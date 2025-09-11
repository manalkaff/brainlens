import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { useTopicContext } from '../../context/TopicContext';
import { EnhancedTopicTree } from '../ui/EnhancedTopicTree';
import { MDXContent } from '../ui/MDXContent';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useTopicTree, useTopicContent } from '../../hooks/useTopicTree';
import { useSubtopicContent } from '../../hooks/useSubtopicContent';
import { useContentBookmarks } from '../../hooks/useContentGeneration';
import { useIterativeResearch } from '../../hooks/useIterativeResearch';
import { useTopicNavigation } from '../../hooks/useTopicNavigation';
import { SubtopicCards, topicsToSubtopicCards } from '../ui/SubtopicCards';
import { DeepLinkManager } from '../ui/DeepLinkManager';
import { ErrorDisplay, InlineError } from '../ui/ErrorDisplay';
import { TopicErrorBoundary } from '../ui/TopicErrorBoundary';
import { 
  TopicTreeSkeleton, 
  ContentSkeleton, 
  SubtopicCardsSkeleton,
  ContentGenerationSkeleton,
  LoadingState
} from '../ui/SkeletonLoaders';
import RealTimeProgressDisplay from '../ui/RealTimeProgressDisplay';
import { ContentPlaceholder } from '../ui/ContentPlaceholder';
import { ContentHeader } from '../ui/ContentHeader';
import { BookmarksView } from '../ui/BookmarksView';
import { RecentTopicsView } from '../ui/RecentTopicsView';
import { EnhancedEmptyState } from '../ui/EnhancedEmptyState';
import { BreadcrumbNavigation } from '../ui/BreadcrumbNavigation';
import type { TopicTreeItem } from '../ui/TopicTree';
import { 
  BookOpen, 
  FileText, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Bookmark,
  BookmarkPlus,
  History,
  Star,
  Clock,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Target,
  Home,
  ChevronDown
} from 'lucide-react';

export function ExploreTab() {
  const { topic, isLoading: topicLoading, enhancedResearchStats, isResearching } = useTopicContext();
  
  // URL parameter handling for subtopic selection
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSubtopicId = searchParams.get('subtopic');
  
  // Parse the subtopic ID if it's in comma-separated format (maintopicid,subtopicid)
  const parseSubtopicId = useCallback((rawSubtopicId: string | null): { mainTopicId: string | null; subtopicId: string | null } => {
    if (!rawSubtopicId) {
      return { mainTopicId: null, subtopicId: null };
    }
    
    if (rawSubtopicId.includes(',')) {
      const parts = rawSubtopicId.split(',');
      if (parts.length === 2) {
        return { mainTopicId: parts[0], subtopicId: parts[1] };
      }
    }
    
    // If not comma-separated, treat as plain subtopic ID
    return { mainTopicId: null, subtopicId: rawSubtopicId };
  }, []);
  
  const { mainTopicId: parsedMainTopicId, subtopicId: parsedSubtopicId } = parseSubtopicId(selectedSubtopicId);
  
  // New iterative research system (legacy hook for backward compatibility)
  const {
    isResearching: isLegacyResearching,
    researchProgress,
    error: researchError,
    researchResult,
    hierarchy,
    startResearch,
    expandDepth,
    generateTopicSubtopics,
    refreshResearch,
    clearError,
    isTopicExpanded,
    getResearchStats
  } = useIterativeResearch({
    topicSlug: topic?.slug,
    autoStart: true,
    maxDepth: 3,
    userContext: { level: 'intermediate', interests: [] }
  });

  // Legacy system for compatibility (we'll gradually phase this out)
  const {
    topics,
    isLoading: treeLoading,
    searchQuery,
    isGenerating,
    setSearchQuery,
    generateSubtopics
  } = useTopicTree({ autoRefresh: true });

  // Enhanced navigation system using the new hook with error handling
  const {
    selectedTopic,
    selectedSubtopic,
    contentPath,
    isGeneratingContent: isGeneratingNavContent,
    navigationHistory,
    // Error handling
    hasError,
    getError,
    clearError: clearNavigationError,
    retryLastOperation,
    // Actions
    selectTopic,
    selectSubtopic,
    navigateToPath,
    generateContentForTopic,
    getTopicContent,
    setTopicContent,
    isTopicSelected,
    getNavigationBreadcrumbs,
    getRequiredExpandedNodes,
    canNavigateBack,
    canNavigateForward,
    navigateBack,
    navigateForward,
    // Deep linking functions
    parseCurrentURL,
    validateDeepLink,
    generateShareableURL,
    handleDeepLink
  } = useTopicNavigation(topics);
  
  // Subtopic content handling using the new API
  const {
    content: subtopicContent,
    isLoading: isLoadingSubtopic,
    isGenerating: isGeneratingSubtopic,
    error: subtopicError,
    progress: subtopicProgress,
    refetch: refetchSubtopic,
    clearError: clearSubtopicError
  } = useSubtopicContent(
    topic?.id || null,
    selectedSubtopicId,
    {
      userLevel: 'intermediate',
      learningStyle: 'textual'
    }
  );
  

  // Find the subtopic by ID if one is selected via URL
  const findTopicById = useCallback((topicList: any[], id: string): any | null => {
    for (const topicItem of topicList) {
      if (topicItem.id === id) return topicItem;
      if (topicItem.children) {
        const found = findTopicById(topicItem.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const selectedSubtopicFromUrl = parsedSubtopicId ? findTopicById(topics, parsedSubtopicId) : null;
  
  // Determine the currently active topic and content target
  const activeTopicForContent = selectedSubtopicFromUrl || selectedSubtopic || selectedTopic || (topic ? {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    summary: topic.summary,
    depth: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: []
  } : null);

  // Helper function to get subtopic result (handles both Map and Object)
  const getSubtopicResult = (subtopicTitle: string) => {
    if (!researchResult?.subtopicResults) return null;
    
    // Handle Map interface (internal research engine)
    if (researchResult.subtopicResults instanceof Map) {
      return researchResult.subtopicResults.get(subtopicTitle);
    }
    
    // Handle Object interface (serialized data from API)
    return (researchResult.subtopicResults as Record<string, any>)[subtopicTitle];
  };

  // Determine content source - prioritize URL-based subtopic content
  const currentContent = useMemo(() => {
    // Priority 1: URL-based subtopic content (if parsedSubtopicId exists and content is available)
    if (parsedSubtopicId && subtopicContent?.success && subtopicContent.content) {
      return {
        content: subtopicContent.content,
        sources: subtopicContent.sources || [],
        isFromResearch: false,
        isFromSubtopicAPI: true
      };
    }
    
    // Priority 2: Navigation hook subtopic content (fallback for backward compatibility)
    if (selectedSubtopic && researchResult) {
      return {
        content: getSubtopicResult(selectedSubtopic.title)?.content?.content || '',
        sources: getSubtopicResult(selectedSubtopic.title)?.sources || [],
        isFromResearch: true,
        isFromSubtopicAPI: false
      };
    }
    
    // Priority 3: Main topic content from research results
    if (researchResult) {
      return {
        content: researchResult.mainTopic.content.content,
        sources: researchResult.mainTopic.sources,
        isFromResearch: true,
        isFromSubtopicAPI: false
      };
    }
    
    return { content: '', sources: [], isFromResearch: false, isFromSubtopicAPI: false };
  }, [parsedSubtopicId, subtopicContent, selectedSubtopic, researchResult, getSubtopicResult, subtopicContent?.content]);

  // Determine if main topic is still being researched (not subtopics)
  const isMainTopicResearching = isResearching && 
    enhancedResearchStats?.realTimeProgress && 
    !enhancedResearchStats.realTimeProgress.mainTopicCompleted;

  // Combine loading states - include subtopic states
  const isGeneratingContent = isMainTopicResearching || isGeneratingNavContent || isGeneratingSubtopic;
  const isLoadingContent = isLoadingSubtopic;

  // Debug logging (can be removed after testing)
  // console.log('🔥 EXPLORE TAB DEBUG:', {
  //   selectedTopic: selectedTopic?.title,
  //   selectedTopicId: selectedTopic?.id,
  //   selectedSubtopic: selectedSubtopic?.title,
  //   selectedSubtopicId: selectedSubtopic?.id,
  //   activeTopicForContent: activeTopicForContent?.title,
  //   activeTopicId,
  //   hasContent: !!content,
  //   contentLength: content?.length,
  //   isGeneratingLegacyContent,
  //   isResetting,
  //   isGeneratingContent
  // });

  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    markAsRead,
    isRead
  } = useContentBookmarks(activeTopicForContent?.id || null);

  // State for layout management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Enhanced navigation state
  const [activeTab, setActiveTab] = useState<'tree' | 'bookmarks' | 'recent'>('tree');
  const [filterText, setFilterText] = useState('');
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<string[]>([]);

  // Get expanded nodes from navigation hook
  const expandedNodes = useMemo(() => {
    return new Set(getRequiredExpandedNodes());
  }, [getRequiredExpandedNodes]);

  // Track recent topics from navigation history
  const recentTopics = useMemo(() => {
    return navigationHistory
      .slice(0, 10) // Keep last 10
      .map(item => item.topic);
  }, [navigationHistory]);

  // State for error handling and loading
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Ref to track last generated topic to prevent infinite loops
  const lastGeneratedTopicRef = useRef<string | null>(null);
  
  // Ref to track debouncing timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Content generation handler using iterative research system
  const handleGenerateContent = useCallback(async () => {
    const targetTopic = activeTopicForContent;
    if (!targetTopic) {
      console.warn('No topic selected for content generation');
      setSelectionError('No topic selected for content generation');
      return;
    }

    console.log('Manual research triggered for:', targetTopic.title, 'ID:', targetTopic.id);
    setSelectionError(null);

    try {
      // Use the iterative research system for content generation
      await startResearch({ forceRefresh: true });
      console.log('Manual research completed successfully for:', targetTopic.title);
    } catch (error) {
      console.error('Manual research failed for topic:', targetTopic.title, error);
      
      // Set user-friendly error message
      let errorMessage = 'Failed to generate content';
      if (error instanceof Error) {
        if (error.message.includes('research')) {
          errorMessage = `Research failed for "${targetTopic.title}". Please try again.`;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else if (error.message.includes('rate') || error.message.includes('limit')) {
          errorMessage = 'API rate limit reached. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSelectionError(errorMessage);
    }
  }, [activeTopicForContent, startResearch]);

  // URL parameter update functions
  const updateSubtopicUrl = useCallback((subtopicId: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (subtopicId) {
      newSearchParams.set('subtopic', subtopicId);
    } else {
      newSearchParams.delete('subtopic');
    }
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // Enhanced unified topic selection handler that works for both sidebar and cards
  const handleTopicSelect = async (topic: TopicTreeItem, source: 'sidebar' | 'cards' | 'breadcrumb' = 'sidebar') => {
    try {
      setSelectionError(null);
      setIsTransitioning(true);

      console.log('🏹 Topic selection from', source, ':', {
        topic: topic.title,
        topicId: topic.id,
        currentSelectedTopic: selectedTopic?.title,
        currentSelectedSubtopic: selectedSubtopic?.title,
        selectedSubtopicId,
        hasExistingContent: !!currentContent.content
      });

      // Determine if this is a subtopic selection or main topic selection
      if (selectedTopic && topic.id !== selectedTopic.id) {
        // Check if the selected topic is a child of the current topic
        const isSubtopic = isTopicChildOf(topic, selectedTopic);
        
        console.log('🔍 Topic relationship analysis:', {
          isSubtopic,
          parentTopic: selectedTopic.title,
          selectedTopic: topic.title
        });
        
        if (isSubtopic) {
          console.log('🌿 Selecting as subtopic via URL');
          updateSubtopicUrl(topic.id);
          selectSubtopic(topic, source);
        } else {
          console.log('🌳 Selecting as new main topic');
          updateSubtopicUrl(null); // Clear subtopic when selecting new main topic
          selectTopic(topic, source);
        }
      } else {
        console.log('🌳 Selecting as main topic (no parent or same topic)');
        updateSubtopicUrl(null); // Clear subtopic when selecting main topic
        selectTopic(topic, source);
      }

      // Clear any previous errors
      setSelectionError(null);
      clearSubtopicError();
    } catch (error) {
      console.error('❌ Topic selection failed:', error);
      setSelectionError(error instanceof Error ? error.message : 'Failed to select topic');
    } finally {
      // Add a small delay to show loading state
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Enhanced subtopic card click handler with URL integration
  const handleSubtopicCardClick = async (subtopic: TopicTreeItem) => {
    try {
      setSelectionError(null);
      setIsTransitioning(true);

      console.log('🎯 Subtopic card clicked:', {
        subtopic: subtopic.title,
        subtopicId: subtopic.id,
        currentSelectedTopic: selectedTopic?.title,
        currentSelectedSubtopic: selectedSubtopic?.title,
        selectedSubtopicId,
        hasExistingContent: !!currentContent.content
      });

      // Update URL with subtopic ID
      updateSubtopicUrl(subtopic.id);

      // Always treat card clicks as subtopic selections
      if (selectedTopic) {
        console.log('🔄 Selecting subtopic via navigation hook and URL');
        selectSubtopic(subtopic, 'cards');
      } else {
        console.log('🔄 Selecting as main topic via navigation hook');
        selectTopic(subtopic, 'cards');
      }

      // Clear any previous errors
      clearSubtopicError();
      
    } catch (error) {
      console.error('❌ Subtopic card selection failed:', error);
      setSelectionError(error instanceof Error ? error.message : 'Failed to select subtopic');
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Helper function to check if a topic is a child of another topic
  const isTopicChildOf = (childTopic: TopicTreeItem, parentTopic: TopicTreeItem): boolean => {
    const findInChildren = (children: TopicTreeItem[]): boolean => {
      for (const child of children) {
        if (child.id === childTopic.id) return true;
        if (child.children && findInChildren(child.children)) return true;
      }
      return false;
    };
    
    return parentTopic.children ? findInChildren(parentTopic.children) : false;
  };

  // Clear selection error when topic changes
  useEffect(() => {
    setSelectionError(null);
    clearSubtopicError();
  }, [activeTopicForContent?.id, clearSubtopicError]);
  
  // Handle back to main topic function
  const handleBackToMainTopic = useCallback(() => {
    updateSubtopicUrl(null);
    if (selectedTopic) {
      selectTopic(selectedTopic, 'breadcrumb');
    }
  }, [updateSubtopicUrl, selectedTopic, selectTopic]);

  // Mark content as read when it's viewed
  useEffect(() => {
    if (currentContent.content && activeTopicForContent?.id && !isRead(activeTopicForContent.id)) {
      markAsRead(activeTopicForContent.id);
    }
  }, [currentContent.content, activeTopicForContent?.id, isRead, markAsRead]);

  // Sync navigation hook with URL parameters to ensure consistency
  useEffect(() => {
    if (parsedSubtopicId && selectedSubtopicFromUrl && selectedSubtopic?.id !== parsedSubtopicId) {
      // URL changed but navigation hook hasn't caught up - sync it
      selectSubtopic(selectedSubtopicFromUrl, 'url');
    }
  }, [selectedSubtopicId, parsedSubtopicId, selectedSubtopicFromUrl, selectedSubtopic?.id, selectSubtopic]);

  // Bookmark management
  const toggleTopicBookmark = (topicId: string) => {
    setBookmarkedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };


  // Filter topics based on current criteria
  const filteredTopics = useMemo(() => {
    if (!filterText && !showCompletedOnly) return topics;
    
    const filterRecursive = (topicList: TopicTreeItem[]): TopicTreeItem[] => {
      return topicList.filter(t => {
        const matchesFilter = !filterText || 
          t.title.toLowerCase().includes(filterText.toLowerCase()) ||
          t.summary?.toLowerCase().includes(filterText.toLowerCase());
        
        const matchesCompletion = !showCompletedOnly || isRead(t.id);
        
        return matchesFilter && matchesCompletion;
      }).map(t => ({
        ...t,
        children: t.children ? filterRecursive(t.children) : []
      }));
    };
    
    return filterRecursive(topics);
  }, [topics, filterText, showCompletedOnly, isRead]);

  // Handle mouse resize for sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = Math.max(250, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (topicLoading || treeLoading) {
    return <LoadingSkeleton />;
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>
    );
  }

  // Show research progress only if main topic is still being researched
  if (isMainTopicResearching && enhancedResearchStats?.realTimeProgress) {
    return (
      <RealTimeProgressDisplay
        progressData={enhancedResearchStats.realTimeProgress}
        topicTitle={topic.title}
        onRetry={clearError}
        onClear={clearError}
        error={researchError}
      />
    );
  }
  
  // Fallback to legacy progress display if no enhanced progress data but main topic still researching
  if (isResearching && !enhancedResearchStats?.realTimeProgress?.mainTopicCompleted) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-background">
        <Card className="w-full max-w-lg mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">AI Learning Engine at Work</h3>
              <p className="text-sm text-muted-foreground">
                Our AI agent is researching "{topic.title}" comprehensively using multiple sources and learning iteratively.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${researchProgress}%` }} 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {researchProgress < 30 && "Planning research strategy..."}
                {researchProgress >= 30 && researchProgress < 60 && "Researching with multiple specialized agents..."}
                {researchProgress >= 60 && researchProgress < 85 && "Analyzing and synthesizing findings..."}
                {researchProgress >= 85 && "Generating comprehensive content..."}
              </p>
              
              {getResearchStats().totalTopics > 0 && (
                <div className="text-xs text-muted-foreground">
                  Processing {getResearchStats().totalTopics} topics • {getResearchStats().completedTopics} completed
                </div>
              )}
            </div>

            {researchError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                <p className="font-medium">Research Error</p>
                <p>{researchError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearError} 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find current topic in the tree structure
  const findTopicInTree = (topicList: TopicTreeItem[], slug: string): TopicTreeItem | null => {
    for (const t of topicList) {
      if (t.slug === slug) return t;
      const found = findTopicInTree(t.children || [], slug);
      if (found) return found;
    }
    return null;
  };

  const currentTopicInTree = findTopicInTree(topics, topic.slug);
  const topicsToShow = currentTopicInTree ? [currentTopicInTree] : topics;

  return (
    <div className="flex h-[calc(100vh-200px)] bg-background">
      {/* Left Sidebar - Topic Tree Navigation */}
      <div 
        className={`
          flex-shrink-0 border-r bg-card transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-12' : 'w-80'}
        `}
        style={{ width: sidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
      >

        {/* Navigation Tabs */}
        {!sidebarCollapsed && (
          <div className="border-b">
            <div className="flex bg-muted/20">
              <button
                onClick={() => setActiveTab('tree')}
                className={`flex-1 py-2.5 px-1 text-xs font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'tree' 
                    ? 'border-primary text-primary bg-background' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                Topics
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex-1 py-2.5 px-1 text-xs font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'bookmarks' 
                    ? 'border-primary text-primary bg-background' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                Saved
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-2.5 px-1 text-xs font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'recent' 
                    ? 'border-primary text-primary bg-background' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <History className="w-3 h-3" />
                Recent
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {!sidebarCollapsed && activeTab === 'tree' && (
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search topics..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <Button
              variant={showCompletedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCompletedOnly(!showCompletedOnly)}
              className="w-full h-8 text-xs"
            >
              <Eye className="w-3 h-3 mr-2" />
              {showCompletedOnly ? 'Show All Topics' : 'Show Read Only'}
            </Button>
          </div>
        )}

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {!sidebarCollapsed && (
            <div className="h-full">
              {activeTab === 'tree' && (
                <div className="h-full p-4">
                  <TopicErrorBoundary
                    fallback={(error, retry) => (
                      <div className="p-4">
                        <InlineError
                          message="Failed to load topic tree"
                          onRetry={retry}
                        />
                      </div>
                    )}
                  >
                    {treeLoading ? (
                      <TopicTreeSkeleton />
                    ) : topicsToShow.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">No topics found</p>
                      </div>
                    ) : (
                      <EnhancedTopicTree
                        topics={topicsToShow}
                        selectedTopicPath={contentPath}
                        onTopicSelect={(topic, path) => handleTopicSelect(topic, 'sidebar')}
                        onGenerateSubtopics={undefined}
                        isGenerating={isGenerating}
                        searchQuery={filterText}
                        onSearchChange={() => {}}
                        compact={true}
                      />
                    )}
                  </TopicErrorBoundary>
                </div>
              )}
              
              {activeTab === 'bookmarks' && (
                <BookmarksView
                  bookmarkedTopics={bookmarkedTopics}
                  allTopics={topics}
                  onTopicSelect={(topic) => handleTopicSelect(topic, 'sidebar')}
                  onToggleBookmark={toggleTopicBookmark}
                  selectedTopicId={activeTopicForContent?.id}
                />
              )}
              
              {activeTab === 'recent' && (
                <RecentTopicsView
                  recentTopics={recentTopics}
                  onTopicSelect={(topic) => handleTopicSelect(topic, 'sidebar')}
                  onToggleBookmark={toggleTopicBookmark}
                  bookmarkedTopics={bookmarkedTopics}
                  selectedTopicId={activeTopicForContent?.id}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      {!sidebarCollapsed && (
        <div
          className="w-1 bg-border hover:bg-primary/20 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header */}
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">
                {activeTopicForContent ? activeTopicForContent.title : 'Select a Topic'}
              </h3>
              {activeTopicForContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTopicBookmark(activeTopicForContent.id)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  {bookmarkedTopics.includes(activeTopicForContent.id) ? (
                    <Bookmark className="w-3 h-3 text-yellow-600 fill-current" />
                  ) : (
                    <BookmarkPlus className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              )}
              {activeTopicForContent && activeTopicForContent.summary && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {activeTopicForContent.summary}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
              {activeTopicForContent && (
                <>
                  {isRead(activeTopicForContent.id) && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Eye className="w-3 h-3" />
                      Read
                    </div>
                  )}
                  {(isGeneratingContent || isTransitioning || isLoadingContent) && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {isTransitioning ? 'Loading topic...' : 
                       isGeneratingSubtopic ? `Generating subtopic... ${subtopicProgress}%` :
                       isLoadingContent ? 'Loading subtopic content...' :
                       isGeneratingContent ? 'Researching content...' : 'Loading...'}
                    </div>
                  )}
                  {(selectionError || subtopicError) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1 rounded">
                      <span className="max-w-xs truncate" title={selectionError || subtopicError || ''}>
                        {subtopicError || selectionError}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={parsedSubtopicId ? refetchSubtopic : handleGenerateContent}
                        disabled={isGeneratingContent || isLoadingContent}
                        className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                        title={parsedSubtopicId ? "Retry subtopic content" : "Retry content generation"}
                      >
                        <Zap className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectionError(null);
                          clearSubtopicError();
                        }}
                        className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                        title="Dismiss error"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  {/* Show manual generate button if no content exists and no error */}
                  {!currentContent.content && !isGeneratingContent && !isLoadingContent && !selectionError && !subtopicError && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={parsedSubtopicId ? refetchSubtopic : handleGenerateContent}
                      disabled={isGeneratingContent || isLoadingContent}
                      className="text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {parsedSubtopicId ? 'Load Subtopic' : 'Start Research'}
                    </Button>
                  )}
                  {/* Show regenerate button if content exists */}
                  {currentContent.content && !isGeneratingContent && !isLoadingContent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={parsedSubtopicId ? refetchSubtopic : handleGenerateContent}
                      disabled={isGeneratingContent || isLoadingContent}
                      className="text-xs"
                      title={parsedSubtopicId ? "Refresh subtopic" : "Research again"}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {parsedSubtopicId ? 'Refresh Subtopic' : 'Research Again'}
                    </Button>
                  )}
                  
                  {/* Show back to main topic button when viewing subtopic */}
                  {parsedSubtopicId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToMainTopic}
                      className="text-xs"
                      title="Back to main topic"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Main Topic
                    </Button>
                  )}
                  {/* Navigation controls */}
                  {(canNavigateBack || canNavigateForward) && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={navigateBack}
                        disabled={!canNavigateBack}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={navigateForward}
                        disabled={!canNavigateForward}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Deep Link Manager */}
                  <DeepLinkManager
                    currentTopic={activeTopicForContent}
                    generateShareableURL={generateShareableURL}
                    validateDeepLink={validateDeepLink}
                    onNavigateToDeepLink={(path) => {
                      const success = handleDeepLink(path);
                      if (!success) {
                        console.warn('Failed to navigate to deep link:', path);
                      }
                    }}
                    className="h-8"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Display Area */}
        <div className="flex-1 overflow-auto">
          {/* PRIORITY 1: Show subtopic content if subtopic is selected and has content */}
          {parsedSubtopicId && currentContent.content && !isGeneratingContent && !isLoadingContent ? (
            <div key={`content-${activeTopicForContent.id}`} className="p-6 space-y-6">{/* Breadcrumb Navigation */}
              <BreadcrumbNavigation
                navigationPath={getNavigationBreadcrumbs()}
                onNavigateToPath={navigateToPath}
              />
              
              {/* Show subtopic indicator if viewing subtopic */}
              {parsedSubtopicId && selectedSubtopicFromUrl && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Viewing Subtopic:</strong> {selectedSubtopicFromUrl.title}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToMainTopic}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    Back to {topic?.title}
                  </Button>
                </div>
              )}

              {/* Enhanced Content Header */}
              <ContentHeader
                topic={activeTopicForContent}
                isSubtopic={selectedSubtopic !== null}
                parentTopic={selectedTopic}
                onBookmarkToggle={() => toggleTopicBookmark(activeTopicForContent.id)}
                isBookmarked={bookmarkedTopics.includes(activeTopicForContent.id)}
                isRead={isRead(activeTopicForContent.id)}
                onMarkAsRead={() => markAsRead(activeTopicForContent.id)}
              />
              <MDXContent
                key={`${activeTopicForContent.id}-${parsedSubtopicId || 'main'}-${currentContent.content ? btoa(currentContent.content.substring(0, 50)) : 'empty'}`}
                content={currentContent.content}
                topicTitle={selectedSubtopicFromUrl?.title || activeTopicForContent.title}
                sources={currentContent.sources}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
                isBookmarked={isBookmarked}
                onMarkAsRead={markAsRead}
                isRead={isRead}
                isSubtopic={!!parsedSubtopicId}
                onBackToMain={parsedSubtopicId ? handleBackToMainTopic : undefined}
              />
            </div>
          ) : parsedSubtopicId && subtopicContent && !subtopicContent.success && !isLoadingSubtopic ? (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="mb-4">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Subtopic Content Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  {subtopicContent.message || `Content for "${selectedSubtopicFromUrl?.title}" hasn't been generated yet.`}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {subtopicContent.suggestion || 'Try generating the main topic content first to create subtopic content.'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleBackToMainTopic} variant="outline">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Main Topic
                  </Button>
                  <Button onClick={() => refetchSubtopic()} disabled={isLoadingSubtopic}>
                    <Zap className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : parsedSubtopicId && (isLoadingSubtopic || isGeneratingSubtopic) ? (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="mb-4">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                </div>
                <p className="text-muted-foreground">Loading subtopic content...</p>
              </div>
            </div>
          ) : researchResult ? (
            <div className="p-6">
              {/* Main topic content */}
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">{researchResult.mainTopic.topic}</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Researched by AI Learning Engine • {researchResult.totalTopicsProcessed} topics explored
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshResearch}
                        disabled={isResearching}
                      >
                        {isResearching ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Refresh Research
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Research metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{researchResult.mainTopic.sources.length}</div>
                    <div className="text-xs text-muted-foreground">Sources Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{Math.round(researchResult.totalProcessingTime / 1000)}s</div>
                    <div className="text-xs text-muted-foreground">Research Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{Math.round(researchResult.mainTopic.metadata.confidenceScore * 100)}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>

                {/* Main content */}
                <MDXContent
                  key={`research-${researchResult.mainTopic.topic}`}
                  content={researchResult.mainTopic.content.content}
                  topicTitle={researchResult.mainTopic.topic}
                  sources={researchResult.mainTopic.sources.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    url: s.url,
                    source: s.source,
                    engine: s.engine || s.source,
                    relevanceScore: s.relevanceScore || 0.8,
                    contentType: s.contentType || 'article'
                  }))}
                  bookmarks={bookmarks}
                  onToggleBookmark={toggleBookmark}
                  isBookmarked={isBookmarked}
                  onMarkAsRead={markAsRead}
                  isRead={isRead}
                />

                {/* Subtopics section */}
                {researchResult.mainTopic.subtopics.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Explore Further</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {researchResult.mainTopic.subtopics.map((subtopic, index) => (
                        <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-sm">{subtopic.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {subtopic.description}
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  subtopic.complexity === 'beginner' ? 'bg-green-100 text-green-800' :
                                  subtopic.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {subtopic.complexity}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Priority: {subtopic.priority}</span>
                              <span>{subtopic.estimatedReadTime}min read</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTopicForContent ? (
            <TopicErrorBoundary
              onError={(error, errorInfo) => {
                console.error('Content area error:', error, errorInfo);
                setSelectionError(error.message);
              }}
            >
              {/* Show navigation errors */}
              {hasError(activeTopicForContent.id) && (
                <div className="p-4 border-b">
                  <ErrorDisplay
                    error={getError(activeTopicForContent.id)!}
                    onRetry={() => retryLastOperation(activeTopicForContent.id)}
                    onDismiss={() => clearNavigationError(activeTopicForContent.id)}
                    isRetrying={isGeneratingContent}
                  />
                </div>
              )}
              
              {/* Show generating state for subtopics */}
              {parsedSubtopicId && isGeneratingSubtopic && (
                <div className="p-6">
                  <RealTimeProgressDisplay
                    progressData={{
                      isActive: true,
                      phase: 'subtopics',
                      currentStep: {
                        number: 1,
                        name: 'Generating Subtopic',
                        description: `Generating subtopic content... ${subtopicProgress}%`,
                        startTime: new Date().toISOString(),
                        progress: subtopicProgress
                      },
                      completedSteps: [],
                      overallProgress: subtopicProgress,
                      mainTopicCompleted: true
                    }}
                    topicTitle={selectedSubtopicFromUrl?.title || 'Subtopic'}
                    onRetry={refetchSubtopic}
                    onClear={clearSubtopicError}
                    error={subtopicError}
                  />
                </div>
              )}
              
              {/* Show subtopic error state */}
              {parsedSubtopicId && subtopicError && !isGeneratingSubtopic && (
                <div className="p-6">
                  <ErrorDisplay
                    error={{
                      type: 'content_generation',
                      message: subtopicError,
                      retryable: true,
                      timestamp: new Date()
                    }}
                    onRetry={refetchSubtopic}
                    onDismiss={clearSubtopicError}
                    isRetrying={isLoadingContent}
                  />
                </div>
              )}
              
              {/* Show loading state for subtopic */}
              {parsedSubtopicId && isLoadingContent && !isGeneratingSubtopic && (
                <div className="p-6">
                  <ContentGenerationSkeleton />
                </div>
              )}
              
              {/* Debug: Always visible debug box */}
              <div style={{padding: '10px', background: '#ffcccc', margin: '10px 0', fontSize: '12px', border: '2px solid red'}}>
                🐛 ALWAYS VISIBLE DEBUG: 
                Content Length: {currentContent.content?.length || 0} | 
                Subtopic: {selectedSubtopicFromUrl?.title || 'Main Topic'} |
                ID: {parsedSubtopicId || 'none'} |
                Hash: {currentContent.content ? btoa(currentContent.content.substring(0, 20)) : 'empty'} |
                isGenerating: {isGeneratingContent ? 'true' : 'false'} |
                isLoading: {isLoadingContent ? 'true' : 'false'} |
                hasContent: {currentContent.content ? 'true' : 'false'}
              </div>

              {currentContent.content && !isGeneratingContent && !isLoadingContent ? (
                <div key={`content-${activeTopicForContent.id}`} className="p-6 space-y-6">
                  {/* Breadcrumb Navigation */}
                  <BreadcrumbNavigation
                    navigationPath={getNavigationBreadcrumbs()}
                    onNavigateToPath={navigateToPath}
                  />
                  
                  {/* Show subtopic indicator if viewing subtopic */}
                  {parsedSubtopicId && selectedSubtopicFromUrl && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <strong>Viewing Subtopic:</strong> {selectedSubtopicFromUrl.title}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToMainTopic}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Back to {topic?.title}
                      </Button>
                    </div>
                  )}

                  {/* Enhanced Content Header */}
                  <ContentHeader
                    topic={activeTopicForContent}
                    isSubtopic={selectedSubtopic !== null}
                    parentTopic={selectedTopic}
                    onBookmarkToggle={() => toggleTopicBookmark(activeTopicForContent.id)}
                    isBookmarked={bookmarkedTopics.includes(activeTopicForContent.id)}
                    isRead={isRead(activeTopicForContent.id)}
                    onMarkAsRead={() => markAsRead(activeTopicForContent.id)}
                  />
                  
                  {(() => {
                    console.log('🚀 RENDERING MDXContent with:', {
                      key: `${activeTopicForContent.id}-${parsedSubtopicId || 'main'}`,
                      contentLength: currentContent.content?.length,
                      contentPreview: currentContent.content?.substring(0, 100) + '...',
                      topicTitle: selectedSubtopicFromUrl?.title || activeTopicForContent.title,
                      isFromSubtopicAPI: currentContent.isFromSubtopicAPI,
                      activeTopicId: activeTopicForContent.id,
                      parsedSubtopicId
                    });
                    return null;
                  })()}
                  
                  <MDXContent
                    key={`${activeTopicForContent.id}-${parsedSubtopicId || 'main'}-${currentContent.content ? btoa(currentContent.content.substring(0, 50)) : 'empty'}`}
                    content={currentContent.content}
                    topicTitle={selectedSubtopicFromUrl?.title || activeTopicForContent.title}
                    sources={currentContent.sources}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                    isBookmarked={isBookmarked}
                    onMarkAsRead={markAsRead}
                    isRead={isRead}
                    isSubtopic={!!parsedSubtopicId}
                    onBackToMain={parsedSubtopicId ? handleBackToMainTopic : undefined}
                  />
                  
                  {/* Show subtopic cards if the current topic has children or research subtopics */}
                  {(activeTopicForContent?.children && activeTopicForContent.children.length > 0) || 
                   (researchResult && !selectedSubtopic && (researchResult as any).mainTopic?.subtopics?.length > 0) ? (
                    <div className="border-t pt-6">
                      {activeTopicForContent?.children && activeTopicForContent.children.length > 0 ? (
                        <SubtopicCards
                          key={`subtopics-${activeTopicForContent.id}`}
                          subtopics={topicsToSubtopicCards(activeTopicForContent.children)}
                          onSubtopicClick={handleSubtopicCardClick}
                          selectedSubtopicId={parsedSubtopicId || selectedSubtopic?.id}
                          isGeneratingContent={isGeneratingContent || isTransitioning || isLoadingContent}
                        />
                      ) : (
                        // Show research subtopics as cards
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold">Explore Further</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {researchResult!.mainTopic.subtopics.map((subtopic, index) => (
                              <div key={index} className="cursor-pointer hover:shadow-md transition-shadow p-4 border rounded-lg">
                                <h3 className="font-medium text-sm">{subtopic.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {subtopic.description}
                                </p>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {subtopic.estimatedReadTime}min read • {subtopic.complexity}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : isGeneratingContent ? (
                <div className="p-6">
                  <ContentGenerationSkeleton />
                </div>
              ) : parsedSubtopicId && subtopicContent && !subtopicContent.success && !isLoadingSubtopic ? (
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Subtopic Content Not Available</h3>
                    <p className="text-muted-foreground mb-4">
                      {subtopicContent.message || `Content for "${selectedSubtopicFromUrl?.title}" hasn't been generated yet.`}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {subtopicContent.suggestion || 'Try generating the main topic content first to create subtopic content.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleBackToMainTopic} variant="outline">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Main Topic
                      </Button>
                      <Button onClick={() => refetchSubtopic()} disabled={isLoadingSubtopic}>
                        <Zap className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <ContentPlaceholder
                  topic={activeTopicForContent}
                  onGenerateContent={handleGenerateContent}
                  isGeneratingContent={isGeneratingContent}
                  error={selectionError}
                  onClearError={() => setSelectionError(null)}
                />
              )}
            </TopicErrorBoundary>
          ) : (
            <EnhancedEmptyState 
              onStartExploring={() => setActiveTab('tree')}
              hasRecentTopics={recentTopics.length > 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}

