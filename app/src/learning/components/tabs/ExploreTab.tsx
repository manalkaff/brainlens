import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { useTopicContext } from '../../context/TopicContext';
import { TopicTree } from '../ui/TopicTree';
import { MDXContent } from '../ui/MDXContent';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useTopicTree, useTopicContent } from '../../hooks/useTopicTree';
import { useContentGeneration, useContentBookmarks } from '../../hooks/useContentGeneration';
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
  const {
    topics,
    isLoading: treeLoading,
    selectedTopic,
    searchQuery,
    isGenerating,
    selectTopic,
    setSearchQuery,
    generateSubtopics
  } = useTopicTree({ autoRefresh: true });

  const {
    content,
    sources,
    isGenerating: isGeneratingContent,
    generateContent
  } = useContentGeneration({
    topic: selectedTopic,
    autoGenerate: true // Changed to true for automatic generation
  });

  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    markAsRead,
    isRead
  } = useContentBookmarks(selectedTopic?.id || null);

  // State for layout management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Enhanced navigation state
  const [activeTab, setActiveTab] = useState<'tree' | 'bookmarks' | 'recent'>('tree');
  const [filterText, setFilterText] = useState('');
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [recentTopics, setRecentTopics] = useState<TopicTreeItem[]>([]);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<string[]>([]);

  // Auto-select the current topic when topics load
  useEffect(() => {
    if (topic && topics.length > 0 && !selectedTopic) {
      const findTopicInTree = (topicList: TopicTreeItem[], slug: string): TopicTreeItem | null => {
        for (const t of topicList) {
          if (t.slug === slug) return t;
          const found = findTopicInTree(t.children || [], slug);
          if (found) return found;
        }
        return null;
      };

      const currentTopicInTree = findTopicInTree(topics, topic.slug);
      if (currentTopicInTree) {
        selectTopic(currentTopicInTree);
        // Add to recent topics
        addToRecentTopics(currentTopicInTree);
      }
    }
  }, [topic, topics, selectedTopic, selectTopic]);

  // Track recent topics
  const addToRecentTopics = (topic: TopicTreeItem) => {
    setRecentTopics(prev => {
      const filtered = prev.filter(t => t.id !== topic.id);
      return [topic, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  // Enhanced topic selection with recent tracking
  const handleTopicSelect = (topic: TopicTreeItem) => {
    selectTopic(topic);
    addToRecentTopics(topic);
  };

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
                  <TopicTree
                    topics={topicsToShow}
                    selectedTopicId={selectedTopic?.id}
                    onTopicSelect={handleTopicSelect}
                    onGenerateSubtopics={generateSubtopics}
                    isGenerating={isGenerating}
                    searchQuery={filterText}
                    onSearchChange={() => {}}
                    compact={true}
                  />
                </div>
              )}
              
              {activeTab === 'bookmarks' && (
                <BookmarksView
                  bookmarkedTopics={bookmarkedTopics}
                  allTopics={topics}
                  onTopicSelect={handleTopicSelect}
                  onToggleBookmark={toggleTopicBookmark}
                  selectedTopicId={selectedTopic?.id}
                />
              )}
              
              {activeTab === 'recent' && (
                <RecentTopicsView
                  recentTopics={recentTopics}
                  onTopicSelect={handleTopicSelect}
                  onToggleBookmark={toggleTopicBookmark}
                  bookmarkedTopics={bookmarkedTopics}
                  selectedTopicId={selectedTopic?.id}
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
                {selectedTopic ? selectedTopic.title : 'Select a Topic'}
              </h3>
              {selectedTopic && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTopicBookmark(selectedTopic.id)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  {bookmarkedTopics.includes(selectedTopic.id) ? (
                    <Bookmark className="w-3 h-3 text-yellow-600 fill-current" />
                  ) : (
                    <BookmarkPlus className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              )}
              {selectedTopic && selectedTopic.summary && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {selectedTopic.summary}
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
              {selectedTopic && (
                <>
                  {isRead(selectedTopic.id) && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Eye className="w-3 h-3" />
                      Read
                    </div>
                  )}
                  {isGeneratingContent && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating content...
                    </div>
                  )}
                  {/* Only show manual generate button for subtopics or if auto-generation failed */}
                  {!content && !isGeneratingContent && selectedTopic.depth > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={generateContent}
                      disabled={isGeneratingContent}
                      className="text-xs"
                    >
                      Generate Content
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Display Area */}
        <div className="flex-1 overflow-auto">
          {selectedTopic ? (
            content ? (
              <div className="p-6">
                <MDXContent
                  content={content}
                  topicTitle={selectedTopic.title}
                  sources={sources}
                  bookmarks={bookmarks}
                  onToggleBookmark={toggleBookmark}
                  isBookmarked={isBookmarked}
                  onMarkAsRead={markAsRead}
                  isRead={isRead}
                />
              </div>
            ) : (
              <ContentPlaceholder
                topic={selectedTopic}
                onGenerateContent={generateContent}
                isGeneratingContent={isGeneratingContent}
              />
            )
          ) : (
            <EnhancedEmptyState 
              onStartExploring={() => setActiveTab('tree')}
              hasRecentTopics={recentTopics.length > 0}
              hasBookmarks={bookmarkedTopics.length > 0}
              onViewRecent={() => setActiveTab('recent')}
              onViewBookmarks={() => setActiveTab('bookmarks')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Content Placeholder Component
interface ContentPlaceholderProps {
  topic: TopicTreeItem;
  onGenerateContent: () => void;
  isGeneratingContent: boolean;
}

function ContentPlaceholder({ topic, onGenerateContent, isGeneratingContent }: ContentPlaceholderProps) {
  // For main topics (depth 0), show automatic generation message
  const isMainTopic = topic.depth === 0;
  
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            {isGeneratingContent ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <FileText className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{topic.title}</h3>
            {topic.summary && (
              <p className="text-sm text-muted-foreground">{topic.summary}</p>
            )}
          </div>

          <div className="space-y-4">
            {isGeneratingContent ? (
              <>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing research data and generating comprehensive content for this topic...
                </p>
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This may take a moment. Content will appear automatically when ready.
                  </p>
                </div>
              </>
            ) : isMainTopic ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Content is being prepared automatically from the research data. If this is taking too long, the research might still be in progress.
                </p>
                <Button
                  onClick={onGenerateContent}
                  disabled={isGeneratingContent}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Retry Content Generation
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No content has been generated for this subtopic yet. Click the button below to create comprehensive learning material.
                </p>
                <Button
                  onClick={onGenerateContent}
                  disabled={isGeneratingContent}
                  size="lg"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Bookmarks View Component
interface BookmarksViewProps {
  bookmarkedTopics: string[];
  allTopics: TopicTreeItem[];
  onTopicSelect: (topic: TopicTreeItem) => void;
  onToggleBookmark: (topicId: string) => void;
  selectedTopicId?: string;
}

function BookmarksView({ 
  bookmarkedTopics, 
  allTopics, 
  onTopicSelect, 
  onToggleBookmark,
  selectedTopicId 
}: BookmarksViewProps) {
  const findTopicById = (topics: TopicTreeItem[], id: string): TopicTreeItem | null => {
    for (const topic of topics) {
      if (topic.id === id) return topic;
      if (topic.children) {
        const found = findTopicById(topic.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const bookmarkedTopicItems = bookmarkedTopics
    .map(id => findTopicById(allTopics, id))
    .filter(Boolean) as TopicTreeItem[];

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="w-3 h-3" />
          <span>{bookmarkedTopics.length} bookmarked topics</span>
        </div>
        
        {bookmarkedTopicItems.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Bookmark className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No bookmarks yet</p>
            <p className="text-xs text-muted-foreground">
              Click the bookmark icon on topics to save them here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {bookmarkedTopicItems.map((topic) => (
              <div
                key={topic.id}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTopicId === topic.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onTopicSelect(topic)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.title}</p>
                    {topic.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {topic.summary}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(topic.id);
                    }}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <Bookmark className="w-3 h-3 text-yellow-600 fill-current" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Recent Topics View Component
interface RecentTopicsViewProps {
  recentTopics: TopicTreeItem[];
  onTopicSelect: (topic: TopicTreeItem) => void;
  onToggleBookmark: (topicId: string) => void;
  bookmarkedTopics: string[];
  selectedTopicId?: string;
}

function RecentTopicsView({ 
  recentTopics, 
  onTopicSelect, 
  onToggleBookmark,
  bookmarkedTopics,
  selectedTopicId 
}: RecentTopicsViewProps) {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Recently viewed topics</span>
        </div>
        
        {recentTopics.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <History className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent topics</p>
            <p className="text-xs text-muted-foreground">
              Topics you explore will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTopics.map((topic) => (
              <div
                key={topic.id}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTopicId === topic.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onTopicSelect(topic)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.title}</p>
                    {topic.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {topic.summary}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(topic.id);
                    }}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    {bookmarkedTopics.includes(topic.id) ? (
                      <Bookmark className="w-3 h-3 text-yellow-600 fill-current" />
                    ) : (
                      <BookmarkPlus className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Breadcrumb Navigation Component
interface BreadcrumbNavigationProps {
  topic: TopicTreeItem;
  allTopics: TopicTreeItem[];
  onTopicSelect: (topic: TopicTreeItem) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

function BreadcrumbNavigation({ topic, allTopics, onTopicSelect, sidebarCollapsed, setSidebarCollapsed }: BreadcrumbNavigationProps) {
  const buildBreadcrumb = (currentTopic: TopicTreeItem): TopicTreeItem[] => {
    const path: TopicTreeItem[] = [];
    
    const findPath = (topics: TopicTreeItem[], targetId: string, currentPath: TopicTreeItem[]): boolean => {
      for (const t of topics) {
        const newPath = [...currentPath, t];
        
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
    
    findPath(allTopics, currentTopic.id, []);
    return path;
  };

  const breadcrumbPath = buildBreadcrumb(topic);

  if (breadcrumbPath.length <= 1) return null;

  return (
    <div className="px-4 py-2 bg-muted/30 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTopicSelect(breadcrumbPath[0])}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Home className="w-3 h-3 mr-1" />
            Root
          </Button>
          
          {breadcrumbPath.slice(0, -1).map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <ChevronDown className="w-3 h-3 text-muted-foreground rotate-[-90deg]" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTopicSelect(crumb)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground truncate max-w-32"
                title={crumb.title}
              >
                {crumb.title}
              </Button>
            </React.Fragment>
          ))}
          
          <ChevronDown className="w-3 h-3 text-muted-foreground rotate-[-90deg]" />
          <span className="text-xs font-medium truncate max-w-40" title={topic.title}>
            {topic.title}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-6 w-6 p-0 ml-2"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Enhanced Empty State Component
interface EnhancedEmptyStateProps {
  onStartExploring: () => void;
  hasRecentTopics: boolean;
  hasBookmarks: boolean;
  onViewRecent: () => void;
  onViewBookmarks: () => void;
}

function EnhancedEmptyState({ 
  onStartExploring, 
  hasRecentTopics, 
  hasBookmarks,
  onViewRecent,
  onViewBookmarks 
}: EnhancedEmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Start Exploring</h3>
            <p className="text-muted-foreground">
              Discover topics and dive deep into learning with AI-powered content generation.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <Button 
            onClick={onStartExploring}
            className="w-full"
            size="lg"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Topic Tree
          </Button>

          {hasRecentTopics && (
            <Button 
              variant="outline"
              onClick={onViewRecent}
              className="w-full"
            >
              <History className="w-4 h-4 mr-2" />
              View Recent Topics
            </Button>
          )}

          {hasBookmarks && (
            <Button 
              variant="outline"
              onClick={onViewBookmarks}
              className="w-full"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              View Bookmarked Topics
            </Button>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Tree View</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              <span>Bookmarks</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <History className="w-3 h-3" />
              <span>Recent</span>
            </div>
          </div>
          <p className="text-xs">
            Navigate through topics, save favorites, and track your learning progress
          </p>
        </div>
      </div>
    </div>
  );
}