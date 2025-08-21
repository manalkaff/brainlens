import React, { useState, useEffect } from 'react';
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
  Minimize2
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
    isGenerating: isGeneratingContent,
    generateContent
  } = useContentGeneration({
    topic: selectedTopic,
    autoGenerate: false
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
      }
    }
  }, [topic, topics, selectedTopic, selectTopic]);

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
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Topic Structure</h3>
            </div>
          )}
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
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {!sidebarCollapsed && (
            <div className="h-full p-4">
              <TopicTree
                topics={topicsToShow}
                selectedTopicId={selectedTopic?.id}
                onTopicSelect={selectTopic}
                onGenerateSubtopics={generateSubtopics}
                isGenerating={isGenerating}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                compact={true}
              />
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
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">
              {selectedTopic ? selectedTopic.title : 'Select a Topic'}
            </h3>
            {selectedTopic && selectedTopic.summary && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {selectedTopic.summary}
                </p>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {selectedTopic && (
              <Button
                variant="default"
                size="sm"
                onClick={generateContent}
                disabled={isGeneratingContent}
                className="text-xs"
              >
                {isGeneratingContent ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Content'
                )}
              </Button>
            )}
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
            <EmptyState />
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
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{topic.title}</h3>
            {topic.summary && (
              <p className="text-sm text-muted-foreground">{topic.summary}</p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No content has been generated for this topic yet. Click the button below to create comprehensive learning material.
            </p>
            
            <Button
              onClick={onGenerateContent}
              disabled={isGeneratingContent}
              size="lg"
              className="w-full"
            >
              {isGeneratingContent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>

            {isGeneratingContent && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Analyzing research data and generating comprehensive content...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Select a Topic</h3>
            <p className="text-sm text-muted-foreground">
              Choose a topic from the tree navigation on the left to view its content and learning materials.
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Browse the topic hierarchy</p>
            <p>• Generate subtopics on demand</p>
            <p>• Create comprehensive learning content</p>
            <p>• Track your progress and bookmarks</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}