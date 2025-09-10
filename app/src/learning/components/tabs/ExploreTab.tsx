import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { useTopicContext } from '../../context/TopicContext';
import { EnhancedTopicTree } from '../ui/EnhancedTopicTree';
import { MDXContent } from '../ui/MDXContent';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useTopicTree, useTopicContent } from '../../hooks/useTopicTree';
import { useContentGeneration, useContentBookmarks } from '../../hooks/useContentGeneration';
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
  const { topic, isLoading: topicLoading } = useTopicContext();
  
  // New iterative research system
  const {
    isResearching,
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

  // Content generation system - integrate with navigation
  const {
    content,
    sources,
    isGenerating: isGeneratingLegacyContent,
    isResetting,
    generateContent
  } = useContentGeneration({
    topic: selectedTopic || (topic ? {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      summary: topic.summary,
      depth: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      children: []
    } : null),
    activeTopicId: (selectedSubtopic || selectedTopic)?.id, // Pass the currently active topic ID
    autoGenerate: false // Disable auto-generation to prevent loops - we'll trigger manually
  });

  // Combine loading states
  const isGeneratingContent = isGeneratingNavContent || isGeneratingLegacyContent || isResetting;

  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    markAsRead,
    isRead
  } = useContentBookmarks((selectedSubtopic || selectedTopic)?.id || null);

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

  // Enhanced content generation handler with proper error handling and retry logic
  const handleGenerateContent = useCallback(async () => {
    const targetTopic = selectedSubtopic || selectedTopic;
    if (!targetTopic) {
      console.warn('No topic selected for content generation');
      setSelectionError('No topic selected for content generation');
      return;
    }

    console.log('Starting content generation for:', targetTopic.title, 'ID:', targetTopic.id);
    setSelectionError(null);

    try {
      // Use the legacy content generation system directly since it handles the UI state properly
      await generateContent();
      console.log('Content generation completed successfully for:', targetTopic.title);
      
    } catch (error) {
      console.error('Content generation failed for topic:', targetTopic.title, error);
      
      // Set user-friendly error message based on error type
      let errorMessage = 'Failed to generate content';
      if (error instanceof Error) {
        if (error.message.includes('research')) {
          errorMessage = `Research data needed for "${targetTopic.title}". The topic may need to be researched first.`;
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
  }, [selectedSubtopic, selectedTopic, generateContent]);

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
        hasExistingContent: !!content
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
          console.log('🌿 Selecting as subtopic');
          selectSubtopic(topic, source);
        } else {
          console.log('🌳 Selecting as new main topic');
          selectTopic(topic, source);
        }
      } else {
        console.log('🌳 Selecting as main topic (no parent or same topic)');
        selectTopic(topic, source);
      }

      // Clear any previous errors
      setSelectionError(null);
    } catch (error) {
      console.error('❌ Topic selection failed:', error);
      setSelectionError(error instanceof Error ? error.message : 'Failed to select topic');
    } finally {
      // Add a small delay to show loading state
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Enhanced subtopic card click handler
  const handleSubtopicCardClick = async (subtopic: TopicTreeItem) => {
    try {
      setSelectionError(null);
      setIsTransitioning(true);

      console.log('🎯 Subtopic card clicked:', {
        subtopic: subtopic.title,
        subtopicId: subtopic.id,
        currentSelectedTopic: selectedTopic?.title,
        currentSelectedSubtopic: selectedSubtopic?.title,
        hasExistingContent: !!content
      });

      // Always treat card clicks as subtopic selections
      if (selectedTopic) {
        console.log('🔄 Selecting subtopic via navigation hook');
        selectSubtopic(subtopic, 'cards');
      } else {
        console.log('🔄 Selecting as main topic via navigation hook');
        selectTopic(subtopic, 'cards');
      }

      // The content generation will be triggered by the useEffect that monitors selectedSubtopic changes
      
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

  // Debounced content generation function
  const debouncedGenerateContent = useCallback((currentTopic: any) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout to debounce rapid calls
    debounceTimeoutRef.current = setTimeout(() => {
      if (lastGeneratedTopicRef.current !== currentTopic.id && !isGeneratingContent) {
        console.log('🚀 Debounced content generation for:', currentTopic.title, 'ID:', currentTopic.id);
        lastGeneratedTopicRef.current = currentTopic.id;
        generateContent();
      }
    }, 100); // 100ms debounce
  }, [isGeneratingContent, generateContent]);

  // Clear selection error when topic changes and reset generation tracking
  useEffect(() => {
    setSelectionError(null);
    // Reset the generation tracking when topic changes to allow fresh generation
    lastGeneratedTopicRef.current = null;
    
    // Clear any pending debounced calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [selectedTopic, selectedSubtopic]);

  // Handle topic selection changes and update content if needed
  useEffect(() => {
    const currentTopic = selectedSubtopic || selectedTopic || (topic ? {
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
    
    if (!currentTopic) return;

    // Enhanced logging for topic selection
    console.log('🔍 Topic selection change detected:', {
      currentTopic: currentTopic.title,
      currentTopicId: currentTopic.id,
      selectedTopic: selectedTopic?.title,
      selectedSubtopic: selectedSubtopic?.title,
      hasContent: !!content,
      isGenerating: isGeneratingContent
    });

    // Use debounced content generation to prevent rapid multiple calls
    debouncedGenerateContent(currentTopic);

    // Mark the topic as read when content is viewed (only if we have content)
    if (content && !isRead(currentTopic.id)) {
      markAsRead(currentTopic.id);
    }
  }, [selectedTopic?.id, selectedSubtopic?.id, topic?.id, debouncedGenerateContent]); // Use debouncedGenerateContent instead
  
  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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

  // Show research progress if actively researching
  if (isResearching) {
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
                        onGenerateSubtopics={generateSubtopics}
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
                  selectedTopicId={(selectedSubtopic || selectedTopic)?.id}
                />
              )}
              
              {activeTab === 'recent' && (
                <RecentTopicsView
                  recentTopics={recentTopics}
                  onTopicSelect={(topic) => handleTopicSelect(topic, 'sidebar')}
                  onToggleBookmark={toggleTopicBookmark}
                  bookmarkedTopics={bookmarkedTopics}
                  selectedTopicId={(selectedSubtopic || selectedTopic)?.id}
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
                {(selectedSubtopic || selectedTopic) ? (selectedSubtopic || selectedTopic)!.title : 'Select a Topic'}
              </h3>
              {(selectedSubtopic || selectedTopic) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTopicBookmark((selectedSubtopic || selectedTopic)!.id)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  {bookmarkedTopics.includes((selectedSubtopic || selectedTopic)!.id) ? (
                    <Bookmark className="w-3 h-3 text-yellow-600 fill-current" />
                  ) : (
                    <BookmarkPlus className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              )}
              {(selectedSubtopic || selectedTopic) && (selectedSubtopic || selectedTopic)!.summary && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {(selectedSubtopic || selectedTopic)!.summary}
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
              {(selectedSubtopic || selectedTopic) && (
                <>
                  {isRead((selectedSubtopic || selectedTopic)!.id) && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Eye className="w-3 h-3" />
                      Read
                    </div>
                  )}
                  {(isGeneratingContent || isTransitioning || isResetting) && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {isResetting ? 'Switching content...' : 
                       isTransitioning ? 'Loading topic...' : 
                       isGeneratingContent ? 'Generating content...' : 'Loading...'}
                    </div>
                  )}
                  {selectionError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1 rounded">
                      <span className="max-w-xs truncate" title={selectionError}>
                        {selectionError}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateContent}
                        disabled={isGeneratingContent}
                        className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                        title="Retry content generation"
                      >
                        <Zap className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectionError(null)}
                        className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                        title="Dismiss error"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  {/* Show manual generate button if no content exists and no error */}
                  {!content && !isGeneratingContent && !selectionError && (selectedSubtopic || selectedTopic) && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleGenerateContent}
                      disabled={isGeneratingContent}
                      className="text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Generate Content
                    </Button>
                  )}
                  {/* Show regenerate button if content exists */}
                  {content && !isGeneratingContent && (selectedSubtopic || selectedTopic) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateContent}
                      disabled={isGeneratingContent}
                      className="text-xs"
                      title="Regenerate content"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Regenerate
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
                  {(selectedSubtopic || selectedTopic) && (
                    <DeepLinkManager
                      currentTopic={selectedSubtopic || selectedTopic || undefined}
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Display Area */}
        <div className="flex-1 overflow-auto">
          {/* Show research results if available */}
          {researchResult ? (
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
                  sources={researchResult.mainTopic.sources.map(s => ({
                    id: s.id,
                    title: s.title,
                    url: s.url,
                    source: s.source,
                    engine: s.engine,
                    relevanceScore: s.relevanceScore,
                    contentType: s.contentType
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
          ) : (selectedSubtopic || selectedTopic) ? (
            <TopicErrorBoundary
              onError={(error, errorInfo) => {
                console.error('Content area error:', error, errorInfo);
                setSelectionError(error.message);
              }}
            >
              {/* Show navigation errors */}
              {hasError((selectedSubtopic || selectedTopic)!.id) && (
                <div className="p-4 border-b">
                  <ErrorDisplay
                    error={getError((selectedSubtopic || selectedTopic)!.id)!}
                    onRetry={() => retryLastOperation((selectedSubtopic || selectedTopic)!.id)}
                    onDismiss={() => clearNavigationError((selectedSubtopic || selectedTopic)!.id)}
                    isRetrying={isGeneratingContent}
                  />
                </div>
              )}
              
              {content && !isResetting ? (
                <div key={`content-${(selectedSubtopic || selectedTopic)!.id}`} className="p-6 space-y-6">
                  {/* Breadcrumb Navigation */}
                  <BreadcrumbNavigation
                    navigationPath={getNavigationBreadcrumbs()}
                    onNavigateToPath={navigateToPath}
                  />

                  {/* Enhanced Content Header */}
                  {(selectedSubtopic || selectedTopic) && (
                    <ContentHeader
                      topic={selectedSubtopic || selectedTopic!}
                    isSubtopic={selectedSubtopic !== null}
                    parentTopic={selectedTopic}
                    onBookmarkToggle={() => toggleTopicBookmark((selectedSubtopic || selectedTopic)!.id)}
                    isBookmarked={bookmarkedTopics.includes((selectedSubtopic || selectedTopic)!.id)}
                    isRead={isRead((selectedSubtopic || selectedTopic)!.id)}
                    onMarkAsRead={() => markAsRead((selectedSubtopic || selectedTopic)!.id)}
                  />
                  )}
                  
                  <MDXContent
                    key={(selectedSubtopic || selectedTopic)!.id}
                    content={content}
                    topicTitle={(selectedSubtopic || selectedTopic)!.title}
                    sources={sources}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                    isBookmarked={isBookmarked}
                    onMarkAsRead={markAsRead}
                    isRead={isRead}
                  />
                  
                  {/* Show subtopic cards if the current topic has children */}
                  {(selectedSubtopic || selectedTopic)?.children && (selectedSubtopic || selectedTopic)!.children!.length > 0 && (
                    <div className="border-t pt-6">
                      <SubtopicCards
                        key={`subtopics-${(selectedSubtopic || selectedTopic)!.id}`}
                        subtopics={topicsToSubtopicCards((selectedSubtopic || selectedTopic)!.children!)}
                        onSubtopicClick={handleSubtopicCardClick}
                        selectedSubtopicId={selectedSubtopic?.id}
                        isGeneratingContent={isGeneratingContent || isTransitioning}
                      />
                    </div>
                  )}
                </div>
              ) : (isGeneratingContent || isResetting) ? (
                <div className="p-6">
                  <ContentGenerationSkeleton />
                </div>
              ) : (
                <ContentPlaceholder
                  topic={(selectedSubtopic || selectedTopic)!}
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

