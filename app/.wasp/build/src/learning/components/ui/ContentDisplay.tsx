import React from 'react';
import { ChevronRight, Clock, BookOpen, Zap, TrendingUp, Home } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { cn } from '../../../lib/utils';
import { MDXContent } from './MDXContent';
import { SubtopicCards, topicsToSubtopicCards, type SubtopicCard } from './SubtopicCards';
import { BreadcrumbNavigation, createBreadcrumbItems } from './BreadcrumbNavigation';
import { ContentMetadata, calculateReadTime, determineComplexity } from './ContentMetadata';
import type { TopicTreeItem } from './TopicTree';

interface SourceAttribution {
  id: string;
  title: string;
  url?: string;
  source: string;
  contentType: string;
  relevanceScore?: number;
  engine?: string;
}

interface ContentDisplayProps {
  topic: TopicTreeItem;
  content?: string;
  sources?: SourceAttribution[];
  subtopics?: TopicTreeItem[];
  isGenerating?: boolean;
  onSubtopicClick: (subtopic: TopicTreeItem) => void;
  onGenerateContent: () => void;
  navigationPath: { title: string; path: string[]; topic: TopicTreeItem }[];
  onNavigateToPath: (path: string[]) => void;
  selectedSubtopicId?: string;
  
  // Error handling
  error?: string | null;
  onRetryGeneration?: () => void;
  onClearError?: () => void;
  
  // Bookmark and reading progress props
  bookmarks?: string[];
  onToggleBookmark?: (sectionId: string) => void;
  onMarkAsRead?: (sectionId: string) => void;
  isBookmarked?: (sectionId: string) => boolean;
  isRead?: (sectionId: string) => boolean;
  
  // Analytics tracking
  onAnalyticsEvent?: (event: string, data: any) => void;
  
  className?: string;
}

interface ContentPlaceholderProps {
  topic: TopicTreeItem;
  onGenerateContent: () => void;
  isGenerating: boolean;
  navigationPath: { title: string; path: string[]; topic: TopicTreeItem }[];
  onNavigateToPath: (path: string[]) => void;
  error?: string | null;
  onRetryGeneration?: () => void;
  onClearError?: () => void;
}

function ContentPlaceholder({ 
  topic, 
  onGenerateContent, 
  isGenerating, 
  navigationPath,
  onNavigateToPath,
  error,
  onRetryGeneration,
  onClearError
}: ContentPlaceholderProps) {
  const isMainTopic = topic.depth === 0;
  const isSubtopic = topic.depth > 0;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumbs */}
      <BreadcrumbNavigation
        navigationPath={createBreadcrumbItems(navigationPath)}
        onNavigateToPath={onNavigateToPath}
        className="mb-2"
      />

      {/* Content Header */}
      <div className="border-b pb-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            {topic.summary && (
              <p className="text-muted-foreground mt-2">{topic.summary}</p>
            )}
          </div>
        </div>
        
        {/* Enhanced Topic Metadata */}
        <ContentMetadata
          topic={topic}
          parentTopic={navigationPath.length > 1 ? navigationPath[navigationPath.length - 2]?.topic : undefined}
          sources={[]}
          topicPosition={navigationPath.length > 1 ? {
            current: 1,
            total: navigationPath[navigationPath.length - 2]?.topic?.children?.length || 1
          } : undefined}
        />
      </div>

      {/* Content Generation Placeholder */}
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              {isGenerating ? (
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              ) : error ? (
                <div className="w-8 h-8 text-red-500 flex items-center justify-center">
                  ⚠️
                </div>
              ) : (
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {isGenerating ? 'Generating Content...' : error ? 'Content Generation Failed' : 'No Content Available'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isGenerating ? (
                  'AI is analyzing research data and generating comprehensive content for this topic...'
                ) : error ? (
                  error
                ) : isMainTopic ? (
                  'Content is being prepared automatically from the research data. If this is taking too long, the research might still be in progress.'
                ) : (
                  'No content has been generated for this subtopic yet. Click the button below to create comprehensive learning material.'
                )}
              </p>
            </div>

            {isGenerating ? (
              <div className="space-y-4">
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full animate-pulse transition-all duration-1000" style={{ width: '60%' }} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    AI is analyzing research data and generating comprehensive content...
                  </p>
                  <p className="text-xs text-muted-foreground text-center opacity-75">
                    This may take 30-60 seconds. Content will appear automatically when ready.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={onRetryGeneration || onGenerateContent}
                    disabled={isGenerating}
                    size="sm"
                    className="flex-1"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  {onClearError && (
                    <Button
                      onClick={onClearError}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  If the problem persists, try refreshing the page or check if research data is available for this topic.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={onGenerateContent}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isMainTopic ? 'Retry Content Generation' : 'Generate Content'}
                </Button>
                
                {/* Additional help text for subtopics */}
                {!isMainTopic && (
                  <p className="text-xs text-muted-foreground text-center">
                    This will create comprehensive learning material specifically for this subtopic, 
                    including explanations, examples, and practical applications.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ContentDisplay({
  topic,
  content,
  sources = [],
  subtopics = [],
  isGenerating = false,
  onSubtopicClick,
  onGenerateContent,
  navigationPath,
  onNavigateToPath,
  selectedSubtopicId,
  error,
  onRetryGeneration,
  onClearError,
  bookmarks = [],
  onToggleBookmark = () => {},
  onMarkAsRead = () => {},
  isBookmarked = () => false,
  isRead = () => false,
  onAnalyticsEvent,
  className
}: ContentDisplayProps) {
  
  // Handle subtopic card clicks with analytics tracking
  const handleSubtopicClick = (subtopic: TopicTreeItem) => {
    // Track analytics event
    onAnalyticsEvent?.('subtopic_card_clicked', {
      fromTopic: topic.id,
      toSubtopic: subtopic.id,
      subtopicTitle: subtopic.title,
      navigationDepth: navigationPath.length,
      timestamp: new Date().toISOString()
    });
    
    // Call the navigation handler
    onSubtopicClick(subtopic);
  };

  // Convert subtopics to subtopic cards
  const subtopicCards: SubtopicCard[] = topicsToSubtopicCards(subtopics);

  // If no content, show placeholder
  if (!content) {
    return (
      <div className={cn("space-y-6", className)}>
        <ContentPlaceholder
          topic={topic}
          onGenerateContent={onGenerateContent}
          isGenerating={isGenerating}
          navigationPath={navigationPath}
          onNavigateToPath={onNavigateToPath}
          error={error}
          onRetryGeneration={onRetryGeneration}
          onClearError={onClearError}
        />
        
        {/* Show subtopic cards even when main content is not available */}
        {subtopicCards.length > 0 && (
          <div className="border-t pt-6">
            <SubtopicCards
              subtopics={subtopicCards}
              onSubtopicClick={handleSubtopicClick}
              selectedSubtopicId={selectedSubtopicId}
              isGeneratingContent={isGenerating}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Navigation Breadcrumbs */}
      <BreadcrumbNavigation
        navigationPath={createBreadcrumbItems(navigationPath)}
        onNavigateToPath={onNavigateToPath}
        className="mb-2"
      />

      {/* Content Header */}
      <div className="border-b pb-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            {topic.summary && (
              <p className="text-muted-foreground mt-2">{topic.summary}</p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">
                <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Updating content...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Topic Metadata */}
        <ContentMetadata
          topic={topic}
          parentTopic={navigationPath.length > 1 ? navigationPath[navigationPath.length - 2]?.topic : undefined}
          sources={sources}
          estimatedReadTime={content ? calculateReadTime(content) : undefined}
          complexity={determineComplexity(topic, content)}
          topicPosition={navigationPath.length > 1 ? {
            current: 1,
            total: navigationPath[navigationPath.length - 2]?.topic?.children?.length || 1
          } : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="prose prose-sm max-w-none">
        <MDXContent
          content={content}
          topicTitle={topic.title}
          sources={sources}
          bookmarks={bookmarks}
          onToggleBookmark={onToggleBookmark}
          isBookmarked={isBookmarked}
          onMarkAsRead={onMarkAsRead}
          isRead={isRead}
        />
      </div>

      {/* Subtopic Cards Section */}
      {subtopicCards.length > 0 && (
        <div className="border-t pt-8">
          <SubtopicCards
            subtopics={subtopicCards}
            onSubtopicClick={handleSubtopicClick}
            selectedSubtopicId={selectedSubtopicId}
            isGeneratingContent={isGenerating}
          />
        </div>
      )}

      {/* Content Footer with Progress Indicator */}
      {topic.userProgress && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Progress: {topic.userProgress.completed ? '100%' : '0%'}</span>
              {topic.userProgress.timeSpent > 0 && (
                <span>Time spent: {Math.round(topic.userProgress.timeSpent / 60)} minutes</span>
              )}
            </div>
            
            {!topic.userProgress.completed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead?.(topic.id)}
                className="text-xs"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentDisplay;