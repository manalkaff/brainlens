import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import type { TopicTreeItem } from '../components/ui/TopicTree';
import { useTopicErrorHandler } from './useTopicErrorHandler';
import { withRetry, retryConfigs } from '../utils/retryMechanism';
// Define SourceAttribution interface locally to match expected format
interface SourceAttribution {
  id: string;
  title: string;
  url?: string;
  source: string;
  contentType: string;
  relevanceScore?: number;
}

// Navigation state interface
interface TopicNavigationState {
  selectedTopic: TopicTreeItem | null;
  selectedSubtopic: TopicTreeItem | null;
  contentPath: string[];
  isGeneratingContent: boolean;
  navigationHistory: NavigationHistoryItem[];
}

// Navigation history item
interface NavigationHistoryItem {
  topic: TopicTreeItem;
  timestamp: Date;
  path: string[];
  source: 'sidebar' | 'cards' | 'url' | 'breadcrumb';
}

// Content cache entry
interface ContentCacheEntry {
  content: string;
  sources: SourceAttribution[];
  generatedAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

// Hook return interface
interface UseTopicNavigationReturn {
  // State
  selectedTopic: TopicTreeItem | null;
  selectedSubtopic: TopicTreeItem | null;
  contentPath: string[];
  isGeneratingContent: boolean;
  navigationHistory: NavigationHistoryItem[];
  
  // Error handling
  hasError: (topicId?: string) => boolean;
  getError: (topicId?: string) => any;
  clearError: (topicId?: string) => void;
  retryLastOperation: (topicId: string) => Promise<void>;
  
  // Actions
  selectTopic: (topic: TopicTreeItem, source?: 'sidebar' | 'cards' | 'url' | 'breadcrumb') => void;
  selectSubtopic: (subtopic: TopicTreeItem, source?: 'sidebar' | 'cards' | 'url' | 'breadcrumb') => void;
  navigateToPath: (path: string[]) => void;
  generateContentForTopic: (topic: TopicTreeItem) => Promise<void>;
  
  // Content management
  getTopicContent: (topicId: string) => ContentCacheEntry | null;
  setTopicContent: (topicId: string, content: string, sources: SourceAttribution[]) => void;
  clearContentCache: () => void;
  
  // Utilities
  getTopicByPath: (path: string[]) => TopicTreeItem | null;
  isTopicSelected: (topicId: string) => boolean;
  getNavigationBreadcrumbs: () => { title: string; path: string[]; topic: TopicTreeItem }[];
  getRequiredExpandedNodes: () => string[];
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  navigateBack: () => void;
  navigateForward: () => void;
  
  // Deep linking and URL management
  parseCurrentURL: () => URLState;
  validateDeepLink: (subtopicPath: string[]) => DeepLinkResult;
  generateShareableURL: (topic?: TopicTreeItem) => string;
  handleDeepLink: (subtopicPath: string[]) => boolean;
}

// URL state management
interface URLState {
  topicSlug: string;
  subtopicPath?: string[];
  tab?: string;
}

// Parse URL parameters to extract topic navigation state
const parseURLState = (pathname: string, search: string): URLState => {
  const pathParts = pathname.split('/').filter(Boolean);
  const searchParams = new URLSearchParams(search);
  
  // Extract topic slug from path (e.g., /learn/topic-slug)
  const topicSlug = pathParts[pathParts.length - 1] || '';
  
  // Extract subtopic path from query params
  const subtopicParam = searchParams.get('subtopic');
  const subtopicPath = subtopicParam ? subtopicParam.split(',').filter(Boolean) : undefined;
  
  // Extract tab from query params
  const tab = searchParams.get('tab') || undefined;
  
  return { topicSlug, subtopicPath, tab };
};

// Validate URL state to ensure it's safe and well-formed
const validateURLState = (state: URLState, topics: TopicTreeItem[]): URLState => {
  const validatedState = { ...state };
  
  // Validate topic slug exists (only warn if we have topics to validate against)
  if (validatedState.topicSlug && topics.length > 0) {
    const topicExists = findTopicBySlugInTree(topics, validatedState.topicSlug);
    if (!topicExists) {
      // Don't clear the slug, just warn - topic might be valid but not in this tree
      console.debug(`Topic slug not found in current tree: ${validatedState.topicSlug}`);
    }
  }
  
  // Validate subtopic path
  if (validatedState.subtopicPath && validatedState.subtopicPath.length > 0) {
    const subtopicExists = getTopicByPathInTree(topics, validatedState.subtopicPath);
    if (!subtopicExists) {
      console.warn(`Invalid subtopic path in URL: ${validatedState.subtopicPath.join(',')}`);
      validatedState.subtopicPath = undefined;
    }
  }
  
  // Validate tab (optional - could be extended with valid tab names)
  if (validatedState.tab && !['explore', 'learn', 'ask', 'mindmap', 'quiz', 'sources'].includes(validatedState.tab)) {
    console.warn(`Invalid tab in URL: ${validatedState.tab}`);
    validatedState.tab = undefined;
  }
  
  return validatedState;
};

// Helper function to find topic by slug in tree
const findTopicBySlugInTree = (topics: TopicTreeItem[], slug: string): TopicTreeItem | null => {
  for (const topic of topics) {
    if (topic.slug === slug) return topic;
    const found = findTopicBySlugInTree(topic.children || [], slug);
    if (found) return found;
  }
  return null;
};

// Helper function to get topic by path in tree
const getTopicByPathInTree = (topics: TopicTreeItem[], path: string[]): TopicTreeItem | null => {
  if (path.length === 0) return null;
  
  let currentTopics = topics;
  let currentTopic: TopicTreeItem | null = null;
  
  for (const pathSegment of path) {
    currentTopic = currentTopics.find(t => t.id === pathSegment || t.slug === pathSegment) || null;
    if (!currentTopic) return null;
    currentTopics = currentTopic.children || [];
  }
  
  return currentTopic;
};

// Build URL from navigation state
const buildURL = (baseURL: string, state: Partial<URLState>): string => {
  const url = new URL(baseURL, window.location.origin);
  
  // Handle subtopic path
  if (state.subtopicPath && state.subtopicPath.length > 0) {
    // Sanitize path segments to prevent XSS
    const sanitizedPath = state.subtopicPath
      .filter(segment => segment && typeof segment === 'string')
      .map(segment => encodeURIComponent(segment.trim()));
    
    if (sanitizedPath.length > 0) {
      url.searchParams.set('subtopic', sanitizedPath.join(','));
    } else {
      url.searchParams.delete('subtopic');
    }
  } else {
    url.searchParams.delete('subtopic');
  }
  
  // Handle tab parameter
  if (state.tab && typeof state.tab === 'string') {
    const sanitizedTab = encodeURIComponent(state.tab.trim());
    url.searchParams.set('tab', sanitizedTab);
  } else {
    url.searchParams.delete('tab');
  }
  
  return url.pathname + url.search;
};

// Handle browser back/forward navigation
const handlePopState = (callback: (state: URLState) => void) => {
  const handlePopStateEvent = (event: PopStateEvent) => {
    const urlState = parseURLState(window.location.pathname, window.location.search);
    callback(urlState);
  };
  
  window.addEventListener('popstate', handlePopStateEvent);
  
  return () => {
    window.removeEventListener('popstate', handlePopStateEvent);
  };
};

// Content cache implementation
class TopicContentCache {
  private cache = new Map<string, ContentCacheEntry>();
  private maxSize = 50; // Maximum cached topics
  
  get(topicId: string): ContentCacheEntry | null {
    const entry = this.cache.get(topicId);
    if (entry) {
      entry.lastAccessed = new Date();
      entry.accessCount++;
    }
    return entry || null;
  }
  
  set(topicId: string, content: string, sources: SourceAttribution[]): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(topicId, {
      content,
      sources,
      generatedAt: new Date(),
      accessCount: 1,
      lastAccessed: new Date()
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private evictLeastRecentlyUsed(): void {
    let oldestEntry: [string, ContentCacheEntry] | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry[1].lastAccessed) {
        oldestEntry = [key, entry];
      }
    }
    
    if (oldestEntry) {
      this.cache.delete(oldestEntry[0]);
    }
  }
}

// Global content cache instance
const contentCache = new TopicContentCache();

// Deep linking utilities
interface DeepLinkResult {
  isValid: boolean;
  mainTopic: TopicTreeItem | null;
  targetTopic: TopicTreeItem | null;
  expandedNodes: string[];
  error?: string;
}

// Parse and validate deep link
const parseDeepLink = (
  topics: TopicTreeItem[], 
  slug: string, 
  subtopicPath?: string[]
): DeepLinkResult => {
  // Find main topic by slug
  const mainTopic = findTopicBySlugInTree(topics, slug);
  if (!mainTopic) {
    return {
      isValid: false,
      mainTopic: null,
      targetTopic: null,
      expandedNodes: [],
      error: `Topic not found: ${slug}`
    };
  }
  
  // If no subtopic path, return main topic
  if (!subtopicPath || subtopicPath.length === 0) {
    return {
      isValid: true,
      mainTopic,
      targetTopic: mainTopic,
      expandedNodes: []
    };
  }
  
  // Find target subtopic
  const targetTopic = getTopicByPathInTree(topics, subtopicPath);
  if (!targetTopic) {
    return {
      isValid: false,
      mainTopic,
      targetTopic: null,
      expandedNodes: [],
      error: `Subtopic not found: ${subtopicPath.join(' > ')}`
    };
  }
  
  // Calculate required expanded nodes (all parent nodes in the path)
  const expandedNodes: string[] = [];
  let currentTopics = topics;
  
  for (let i = 0; i < subtopicPath.length - 1; i++) {
    const pathSegment = subtopicPath[i];
    const topic = currentTopics.find(t => t.id === pathSegment || t.slug === pathSegment);
    if (topic) {
      expandedNodes.push(topic.id);
      currentTopics = topic.children || [];
    }
  }
  
  return {
    isValid: true,
    mainTopic,
    targetTopic,
    expandedNodes
  };
};

// Generate shareable URL for a topic
const generateShareableURLUtil = (
  baseURL: string,
  mainTopicSlug: string,
  targetTopic?: TopicTreeItem,
  topics?: TopicTreeItem[]
): string => {
  if (!targetTopic || !topics) {
    return `${baseURL}/learn/${mainTopicSlug}`;
  }
  
  // Build path to target topic
  const buildPathToTopic = (topicList: TopicTreeItem[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const topic of topicList) {
      const newPath = [...currentPath, topic.id];
      
      if (topic.id === targetId) {
        return newPath;
      }
      
      if (topic.children) {
        const found = buildPathToTopic(topic.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };
  
  const path = buildPathToTopic(topics, targetTopic.id);
  if (!path || path.length <= 1) {
    return `${baseURL}/learn/${mainTopicSlug}`;
  }
  
  const subtopicPath = path.join(',');
  return `${baseURL}/learn/${mainTopicSlug}?subtopic=${encodeURIComponent(subtopicPath)}`;
};

export function useTopicNavigation(
  topics: TopicTreeItem[],
  initialPath?: string[]
): UseTopicNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  
  // Error handling
  const errorHandler = useTopicErrorHandler();
  
  // Navigation state
  const [state, setState] = useState<TopicNavigationState>({
    selectedTopic: null,
    selectedSubtopic: null,
    contentPath: initialPath || [],
    isGeneratingContent: false,
    navigationHistory: []
  });
  
  // History navigation state
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Store last operations for retry functionality
  const [lastOperations, setLastOperations] = useState<Map<string, () => Promise<void>>>(new Map());
  
  // Parse current URL state with validation
  const urlState = useMemo(() => {
    const rawState = parseURLState(location.pathname, location.search);
    return validateURLState(rawState, topics);
  }, [location.pathname, location.search, topics]);
  
  // Find topic by ID in the tree structure
  const findTopicById = useCallback((topicList: TopicTreeItem[], id: string): TopicTreeItem | null => {
    for (const topic of topicList) {
      if (topic.id === id) return topic;
      const found = findTopicById(topic.children || [], id);
      if (found) return found;
    }
    return null;
  }, []);
  
  // Find topic by slug in the tree structure
  const findTopicBySlug = useCallback((topicList: TopicTreeItem[], slug: string): TopicTreeItem | null => {
    for (const topic of topicList) {
      if (topic.slug === slug) return topic;
      const found = findTopicBySlug(topic.children || [], slug);
      if (found) return found;
    }
    return null;
  }, []);
  
  // Get topic by path (array of topic IDs or slugs)
  const getTopicByPath = useCallback((path: string[]): TopicTreeItem | null => {
    if (path.length === 0) return null;
    
    let currentTopics = topics;
    let currentTopic: TopicTreeItem | null = null;
    
    for (const pathSegment of path) {
      currentTopic = currentTopics.find(t => t.id === pathSegment || t.slug === pathSegment) || null;
      if (!currentTopic) return null;
      currentTopics = currentTopic.children || [];
    }
    
    return currentTopic;
  }, [topics]);
  
  // Build path array from topic to root
  const buildTopicPath = useCallback((topic: TopicTreeItem): string[] => {
    const path: string[] = [];
    
    const findPath = (topicList: TopicTreeItem[], targetId: string, currentPath: string[]): boolean => {
      for (const t of topicList) {
        const newPath = [...currentPath, t.id];
        
        if (t.id === targetId) {
          path.push(...newPath);
          return true;
        }
        
        if (t.children && findPath(t.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(topics, topic.id, []);
    return path;
  }, [topics]);
  
  // Update URL to reflect current navigation state
  const updateURL = useCallback((topic: TopicTreeItem, subtopic?: TopicTreeItem, options?: { replace?: boolean }) => {
    if (!slug) return;
    
    const newState: Partial<URLState> = {};
    
    if (subtopic) {
      const subtopicPath = buildTopicPath(subtopic);
      newState.subtopicPath = subtopicPath;
    } else if (topic.id !== slug && topic.slug !== slug) {
      // If we're navigating to a different topic than the main one
      const topicPath = buildTopicPath(topic);
      newState.subtopicPath = topicPath;
    } else {
      // Clear subtopic path if we're navigating back to main topic
      newState.subtopicPath = undefined;
    }
    
    const newURL = buildURL(location.pathname, newState);
    
    // Only navigate if URL actually changed
    if (newURL !== location.pathname + location.search) {
      navigate(newURL, { 
        replace: options?.replace || false,
        state: { 
          navigationSource: 'topic-navigation',
          timestamp: Date.now()
        }
      });
    }
  }, [slug, location.pathname, location.search, navigate, buildTopicPath]);
  
  // Add item to navigation history
  const addToHistory = useCallback((
    topic: TopicTreeItem, 
    source: 'sidebar' | 'cards' | 'url' | 'breadcrumb' = 'sidebar'
  ) => {
    const historyItem: NavigationHistoryItem = {
      topic,
      timestamp: new Date(),
      path: buildTopicPath(topic),
      source
    };
    
    setState(prev => {
      // Remove any existing entry for this topic to avoid duplicates
      const filteredHistory = prev.navigationHistory.filter(item => item.topic.id !== topic.id);
      
      // Add new item to the beginning and limit to 50 items
      const newHistory = [historyItem, ...filteredHistory].slice(0, 50);
      
      return {
        ...prev,
        navigationHistory: newHistory
      };
    });
    
    // Reset history index when adding new item
    setHistoryIndex(-1);
  }, [buildTopicPath]);
  
  // Select topic handler with error handling
  const selectTopic = useCallback((
    topic: TopicTreeItem, 
    source: 'sidebar' | 'cards' | 'url' | 'breadcrumb' = 'sidebar'
  ) => {
    try {
      errorHandler.clearError(topic.id);
      
      const topicPath = buildTopicPath(topic);
      
      setState(prev => ({
        ...prev,
        selectedTopic: topic,
        selectedSubtopic: null,
        contentPath: topicPath
      }));
      
      // Update URL and add to history (don't replace for user-initiated navigation)
      const shouldReplace = source === 'url'; // Only replace for URL-initiated navigation
      updateURL(topic, undefined, { replace: shouldReplace });
      
      // Add to history only for user-initiated navigation
      if (source !== 'url') {
        addToHistory(topic, source);
      }
      
      // Store operation for retry
      setLastOperations(prev => new Map(prev.set(topic.id, () => 
        Promise.resolve(selectTopic(topic, source))
      )));
      
    } catch (error) {
      errorHandler.handleError(error as Error, { 
        type: 'selection', 
        topicId: topic.id 
      });
    }
  }, [buildTopicPath, updateURL, addToHistory, errorHandler]);
  
  // Select subtopic handler with error handling
  const selectSubtopic = useCallback((
    subtopic: TopicTreeItem, 
    source: 'sidebar' | 'cards' | 'url' | 'breadcrumb' = 'sidebar'
  ) => {
    try {
      errorHandler.clearError(subtopic.id);
      
      const subtopicPath = buildTopicPath(subtopic);
      
      setState(prev => ({
        ...prev,
        selectedSubtopic: subtopic,
        contentPath: subtopicPath
      }));
      
      // Update URL and add to history (don't replace for user-initiated navigation)
      const shouldReplace = source === 'url'; // Only replace for URL-initiated navigation
      updateURL(state.selectedTopic || subtopic, subtopic, { replace: shouldReplace });
      
      // Add to history only for user-initiated navigation
      if (source !== 'url') {
        addToHistory(subtopic, source);
      }
      
      // Store operation for retry
      setLastOperations(prev => new Map(prev.set(subtopic.id, () => 
        Promise.resolve(selectSubtopic(subtopic, source))
      )));
      
    } catch (error) {
      errorHandler.handleError(error as Error, { 
        type: 'selection', 
        topicId: subtopic.id 
      });
    }
  }, [state.selectedTopic, buildTopicPath, updateURL, addToHistory, errorHandler]);
  
  // Navigate to specific path with error handling
  const navigateToPath = useCallback((path: string[]) => {
    try {
      const topic = getTopicByPath(path);
      if (topic) {
        // Determine if this is a subtopic or main topic navigation
        const isSubtopic = path.length > 1 && state.selectedTopic;
        
        if (isSubtopic) {
          selectSubtopic(topic, 'breadcrumb');
        } else {
          selectTopic(topic, 'breadcrumb');
        }
      } else {
        throw new Error(`Topic not found for path: ${path.join(' > ')}`);
      }
    } catch (error) {
      errorHandler.handleError(error as Error, { 
        type: 'navigation' 
      });
    }
  }, [getTopicByPath, selectTopic, selectSubtopic, state.selectedTopic, errorHandler]);
  
  // Generate content for topic with enhanced error handling and retry logic
  const generateContentForTopic = useCallback(async (topic: TopicTreeItem): Promise<void> => {
    setState(prev => ({ ...prev, isGeneratingContent: true }));
    errorHandler.clearError(topic.id);
    
    const contentGenerationOperation = async () => {
      // Use the currently selected subtopic ID if available, otherwise use the topic ID
      const targetTopicId = (state.selectedSubtopic || topic).id;
      
      // Check if content already exists in cache for the target topic
      const existingContent = contentCache.get(targetTopicId);
      if (existingContent) {
        console.log('Content already exists in cache for topic:', topic.title, 'Target ID:', targetTopicId);
        return;
      }

      console.log('Generating content for topic:', topic.title, 'Target ID:', targetTopicId);
      
      // Call the content generation API using Wasp's authenticated API wrapper
      const response = await fetch('/api/learning/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: targetTopicId, // Use the target topic ID (could be subtopic)
          options: {
            userLevel: 'intermediate', // TODO: Get from user preferences
            learningStyle: 'textual', // TODO: Get from user preferences
            contentType: 'exploration',
            maxTokens: 4000,
            temperature: 0.7
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific error cases
        if (response.status === 400 && errorData.needsResearch) {
          throw new Error(`No research data available for "${topic.title}". Please run research for this topic first.`);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.content) {
        throw new Error('No content received from API');
      }
      
      console.log('Content generated successfully for topic:', topic.title);
      console.log('Content length:', result.content.length);
      console.log('Sources:', result.sources?.length || 0);
      
      // Cache the generated content using the target topic ID
      contentCache.set(targetTopicId, result.content, result.sources || []);
    };
    
    try {
      // Use retry mechanism for content generation
      await withRetry(contentGenerationOperation, retryConfigs.contentGeneration);
      
      // Store operation for retry
      setLastOperations(prev => new Map(prev.set(topic.id, () => 
        generateContentForTopic(topic)
      )));
      
    } catch (error) {
      console.error('Content generation failed for topic:', topic.title, error);
      errorHandler.handleError(error as Error, { 
        type: 'content_generation', 
        topicId: topic.id 
      });
      throw error;
    } finally {
      setState(prev => ({ ...prev, isGeneratingContent: false }));
    }
  }, [errorHandler]);
  
  // Content cache methods
  const getTopicContent = useCallback((topicId: string): ContentCacheEntry | null => {
    return contentCache.get(topicId);
  }, []);
  
  const setTopicContent = useCallback((topicId: string, content: string, sources: SourceAttribution[]) => {
    contentCache.set(topicId, content, sources);
  }, []);
  
  const clearContentCache = useCallback(() => {
    contentCache.clear();
  }, []);
  
  // Check if topic is selected
  const isTopicSelected = useCallback((topicId: string): boolean => {
    // Check if it's the currently selected topic or subtopic
    const currentTopic = state.selectedSubtopic || state.selectedTopic;
    return currentTopic?.id === topicId;
  }, [state.selectedTopic, state.selectedSubtopic]);
  
  // Get navigation breadcrumbs
  const getNavigationBreadcrumbs = useCallback((): { title: string; path: string[]; topic: TopicTreeItem }[] => {
    const currentTopic = state.selectedSubtopic || state.selectedTopic;
    if (!currentTopic) return [];
    
    const breadcrumbs: { title: string; path: string[]; topic: TopicTreeItem }[] = [];
    const path = buildTopicPath(currentTopic);
    
    // Build breadcrumbs from root to current topic
    for (let i = 0; i < path.length; i++) {
      const topicAtPath = getTopicByPath(path.slice(0, i + 1));
      if (topicAtPath) {
        breadcrumbs.push({
          title: topicAtPath.title,
          path: path.slice(0, i + 1),
          topic: topicAtPath
        });
      }
    }
    
    return breadcrumbs;
  }, [state.selectedTopic, state.selectedSubtopic, buildTopicPath, getTopicByPath]);
  
  // Get required expanded nodes based on current selection
  const getRequiredExpandedNodes = useCallback((): string[] => {
    const currentTopic = state.selectedSubtopic || state.selectedTopic;
    if (!currentTopic) return [];
    
    const path = buildTopicPath(currentTopic);
    // Return all parent nodes that should be expanded (exclude the leaf node)
    return path.slice(0, -1);
  }, [state.selectedTopic, state.selectedSubtopic, buildTopicPath]);
  
  // History navigation
  const canNavigateBack = historyIndex < state.navigationHistory.length - 1;
  const canNavigateForward = historyIndex > 0;
  
  const navigateBack = useCallback(() => {
    if (canNavigateBack) {
      const newIndex = historyIndex + 1;
      const historyItem = state.navigationHistory[newIndex];
      if (historyItem) {
        setHistoryIndex(newIndex);
        selectTopic(historyItem.topic, 'breadcrumb');
      }
    }
  }, [canNavigateBack, historyIndex, state.navigationHistory, selectTopic]);
  
  const navigateForward = useCallback(() => {
    if (canNavigateForward) {
      const newIndex = historyIndex - 1;
      const historyItem = state.navigationHistory[newIndex];
      if (historyItem) {
        setHistoryIndex(newIndex);
        selectTopic(historyItem.topic, 'breadcrumb');
      }
    }
  }, [canNavigateForward, historyIndex, state.navigationHistory, selectTopic]);
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const cleanup = handlePopState((newUrlState) => {
      console.log('Browser navigation detected:', newUrlState);
      
      if (!topics.length || !slug) return;
      
      // Find the main topic by slug
      const mainTopic = findTopicBySlug(topics, slug);
      if (!mainTopic) return;
      
      // Handle subtopic navigation from URL
      if (newUrlState.subtopicPath && newUrlState.subtopicPath.length > 0) {
        const subtopic = getTopicByPath(newUrlState.subtopicPath);
        if (subtopic) {
          setState(prev => ({
            ...prev,
            selectedTopic: mainTopic,
            selectedSubtopic: subtopic,
            contentPath: newUrlState.subtopicPath || []
          }));
          return;
        }
      }
      
      // Navigate back to main topic
      setState(prev => ({
        ...prev,
        selectedTopic: mainTopic,
        selectedSubtopic: null,
        contentPath: [mainTopic.id]
      }));
    });
    
    return cleanup;
  }, [topics, slug, getTopicByPath, findTopicBySlug]);

  // Handle deep linking
  const handleDeepLink = useCallback((subtopicPath: string[]): boolean => {
    if (!slug || !topics.length) return false;
    
    const deepLinkResult = parseDeepLink(topics, slug, subtopicPath);
    
    if (!deepLinkResult.isValid) {
      console.warn('Invalid deep link:', deepLinkResult.error);
      
      // Fallback to main topic if deep link is invalid
      if (deepLinkResult.mainTopic) {
        selectTopic(deepLinkResult.mainTopic, 'url');
        return true;
      }
      
      return false;
    }
    
    // Navigate to the target topic
    if (deepLinkResult.targetTopic) {
      if (deepLinkResult.targetTopic.id === deepLinkResult.mainTopic?.id) {
        // Navigating to main topic
        selectTopic(deepLinkResult.targetTopic, 'url');
      } else {
        // Navigating to subtopic - set state directly for deep links
        console.log('Deep link navigating to subtopic:', deepLinkResult.targetTopic.title, 'from main topic:', deepLinkResult.mainTopic?.title);
        
        // Set both main topic and subtopic state directly for deep links
        setState(prev => ({
          ...prev,
          selectedTopic: deepLinkResult.mainTopic,
          selectedSubtopic: deepLinkResult.targetTopic,
          contentPath: subtopicPath
        }));
        
        // Add to history
        if (deepLinkResult.targetTopic) {
          addToHistory(deepLinkResult.targetTopic, 'url');
        }
      }
      
      return true;
    }
    
    return false;
  }, [slug, topics, selectTopic, selectSubtopic, setState, addToHistory]);
  
  // Track if we've initialized to prevent loops
  const initializedRef = useRef(false);
  const currentURLRef = useRef('');

  // Initialize from URL on mount and when URL changes
  useEffect(() => {
    if (!topics.length || !slug) return;
    
    // Create a unique key for this URL state
    const urlKey = `${slug}-${urlState.subtopicPath?.join(',') || 'main'}`;
    
    // Skip if this is the same URL we already processed
    if (currentURLRef.current === urlKey) {
      return;
    }
    
    console.log('Navigation initialization for URL:', urlKey);
    currentURLRef.current = urlKey;
    
    // Handle deep linking for subtopics
    if (urlState.subtopicPath && urlState.subtopicPath.length > 0) {
      console.log('Handling deep link to subtopic path:', urlState.subtopicPath);
      
      const deepLinkResult = parseDeepLink(topics, slug, urlState.subtopicPath);
      
      if (deepLinkResult.isValid && deepLinkResult.targetTopic && deepLinkResult.mainTopic) {
        // Set state directly for deep links to avoid unnecessary navigation calls
        setState(prev => ({
          ...prev,
          selectedTopic: deepLinkResult.mainTopic,
          selectedSubtopic: deepLinkResult.targetTopic,
          contentPath: urlState.subtopicPath || []
        }));
        
        if (!initializedRef.current) {
          addToHistory(deepLinkResult.targetTopic, 'url');
        }
        
        console.log('Deep link handled successfully:', deepLinkResult.targetTopic.title);
        initializedRef.current = true;
        return;
      } else {
        console.warn('Invalid deep link, falling back to main topic:', deepLinkResult.error);
      }
    }
    
    // Find and initialize with main topic
    const mainTopic = findTopicBySlug(topics, slug);
    if (!mainTopic) {
      console.warn(`Topic not found for slug: ${slug}`);
      return;
    }
    
    // Only initialize if we haven't initialized yet or if the topic slug changed
    if (!initializedRef.current || state.selectedTopic?.slug !== slug) {
      console.log('Initializing with main topic:', mainTopic.title);
      
      setState(prev => ({
        ...prev,
        selectedTopic: mainTopic,
        selectedSubtopic: null,
        contentPath: [mainTopic.id]
      }));
      
      if (!initializedRef.current) {
        addToHistory(mainTopic, 'url');
      }
      
      initializedRef.current = true;
    }
  }, [topics, slug, urlState.subtopicPath]);
  
  // Deep linking and URL management functions
  const parseCurrentURL = useCallback((): URLState => {
    return parseURLState(location.pathname, location.search);
  }, [location.pathname, location.search]);
  
  const validateDeepLink = useCallback((subtopicPath: string[]): DeepLinkResult => {
    if (!slug) {
      return {
        isValid: false,
        mainTopic: null,
        targetTopic: null,
        expandedNodes: [],
        error: 'No topic slug provided'
      };
    }
    
    return parseDeepLink(topics, slug, subtopicPath);
  }, [topics, slug]);
  
  const generateShareableURL = useCallback((topic?: TopicTreeItem): string => {
    if (!slug) return window.location.href;
    
    const targetTopic = topic || state.selectedSubtopic || state.selectedTopic || undefined;
    const baseURL = window.location.origin;
    
    return generateShareableURLUtil(baseURL, slug, targetTopic, topics);
  }, [slug, state.selectedSubtopic, state.selectedTopic, topics]);
  

  // Retry last operation for a specific topic
  const retryLastOperation = useCallback(async (topicId: string): Promise<void> => {
    const operation = lastOperations.get(topicId);
    if (operation) {
      await errorHandler.retryOperation(topicId, operation);
    } else {
      throw new Error('No operation to retry for this topic');
    }
  }, [lastOperations, errorHandler]);

  return {
    // State
    selectedTopic: state.selectedTopic,
    selectedSubtopic: state.selectedSubtopic,
    contentPath: state.contentPath,
    isGeneratingContent: state.isGeneratingContent,
    navigationHistory: state.navigationHistory,
    
    // Error handling
    hasError: errorHandler.hasError,
    getError: errorHandler.getError,
    clearError: errorHandler.clearError,
    retryLastOperation,
    
    // Actions
    selectTopic,
    selectSubtopic,
    navigateToPath,
    generateContentForTopic,
    
    // Content management
    getTopicContent,
    setTopicContent,
    clearContentCache,
    
    // Utilities
    getTopicByPath,
    isTopicSelected,
    getNavigationBreadcrumbs,
    getRequiredExpandedNodes,
    canNavigateBack,
    canNavigateForward,
    navigateBack,
    navigateForward,
    
    // Deep linking and URL management
    parseCurrentURL,
    validateDeepLink,
    generateShareableURL,
    handleDeepLink
  };
}