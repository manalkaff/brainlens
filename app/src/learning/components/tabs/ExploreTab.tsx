import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useTopicContext } from '../../context/TopicContext';
import { TopicTree } from '../ui/TopicTree';
import { MDXContent } from '../ui/MDXContent';
import { useTopicTree, useTopicContent } from '../../hooks/useTopicTree';
import { useContentGeneration, useContentBookmarks } from '../../hooks/useContentGeneration';
import type { TopicTreeItem } from '../ui/TopicTree';

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

  const [contentView, setContentView] = useState<'tree' | 'content'>('tree');

  if (topicLoading || treeLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
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
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={contentView === 'tree' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setContentView('tree')}
        >
          Topic Structure
        </Button>
        <Button
          variant={contentView === 'content' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setContentView('content')}
          disabled={!selectedTopic}
        >
          Content View
        </Button>
      </div>

      {contentView === 'tree' ? (
        /* Topic Tree Navigation */
        <TopicTree
          topics={topicsToShow}
          selectedTopicId={selectedTopic?.id}
          onTopicSelect={selectTopic}
          onGenerateSubtopics={generateSubtopics}
          isGenerating={isGenerating}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      ) : (
        /* Content Display */
        selectedTopic ? (
          <MDXContent
            content={content}
            topicTitle={selectedTopic.title}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
            onMarkAsRead={markAsRead}
            isRead={isRead}
          />
        ) : (
          <ContentDisplay
            topic={null}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
            onMarkAsRead={markAsRead}
            isRead={isRead}
            onGenerateContent={generateContent}
            isGeneratingContent={isGeneratingContent}
          />
        )
      )}

    </div>
  );
}

interface ContentDisplayProps {
  topic: TopicTreeItem | null;
  bookmarks: string[];
  onToggleBookmark: (sectionId: string) => void;
  isBookmarked: (sectionId: string) => boolean;
  onMarkAsRead: (sectionId: string) => void;
  isRead: (sectionId: string) => boolean;
  onGenerateContent?: () => void;
  isGeneratingContent?: boolean;
}

function ContentDisplay({
  topic,
  bookmarks,
  onToggleBookmark,
  isBookmarked,
  onMarkAsRead,
  isRead,
  onGenerateContent,
  isGeneratingContent = false
}: ContentDisplayProps) {
  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Select a topic from the tree to view its content</p>
          {onGenerateContent && (
            <Button
              onClick={onGenerateContent}
              disabled={isGeneratingContent}
              variant="outline"
            >
              {isGeneratingContent ? 'Generating Content...' : 'Generate Sample Content'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              {topic.title}
            </div>
            <div className="flex gap-2">
              {onGenerateContent && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onGenerateContent}
                  disabled={isGeneratingContent}
                >
                  {isGeneratingContent ? 'Generating...' : 'Generate Content'}
                </Button>
              )}
              <Button variant="outline" size="sm" disabled>
                Export PDF
              </Button>
              <Button variant="outline" size="sm" disabled>
                Export MD
              </Button>
            </div>
          </CardTitle>
          {topic.summary && (
            <CardDescription>{topic.summary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Content placeholder - this would be replaced with actual MDX content */}
            <div className="prose prose-sm max-w-none">
              <h2 id="overview">Overview</h2>
              <p>
                This section provides a comprehensive overview of {topic.title}. 
                The content here would be dynamically generated based on the research 
                conducted for this topic.
              </p>
              
              <h2 id="key-concepts">Key Concepts</h2>
              <p>
                Understanding the fundamental concepts is crucial for mastering {topic.title}. 
                This section would include detailed explanations of core principles.
              </p>
              
              <h2 id="practical-examples">Practical Examples</h2>
              <p>
                Real-world applications and examples help solidify understanding. 
                This section would contain interactive code blocks and demonstrations.
              </p>
              
              <h2 id="best-practices">Best Practices</h2>
              <p>
                Industry standards and recommended approaches for working with {topic.title}.
              </p>
            </div>
            
            {/* Bookmark indicators */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {['overview', 'key-concepts', 'practical-examples', 'best-practices'].map((sectionId) => (
                <Button
                  key={sectionId}
                  variant={isBookmarked(sectionId) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleBookmark(sectionId)}
                  className="text-xs"
                >
                  {isBookmarked(sectionId) ? '★' : '☆'} {sectionId.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-2">
            {[
              { id: 'overview', title: 'Overview' },
              { id: 'key-concepts', title: 'Key Concepts' },
              { id: 'practical-examples', title: 'Practical Examples' },
              { id: 'best-practices', title: 'Best Practices' }
            ].map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`block text-sm p-2 rounded hover:bg-muted transition-colors ${
                  isRead(section.id) ? 'text-muted-foreground line-through' : ''
                } ${
                  isBookmarked(section.id) ? 'bg-yellow-50 dark:bg-yellow-950 border-l-2 border-yellow-500' : ''
                }`}
                onClick={() => onMarkAsRead(section.id)}
              >
                {section.title}
                {isBookmarked(section.id) && <span className="ml-2 text-yellow-500">★</span>}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Progress and Stats */}
      {topic.userProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time Spent:</span>
                <span>{Math.round(topic.userProgress.timeSpent / 60)} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bookmarks:</span>
                <span>{bookmarks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={topic.userProgress.completed ? 'text-green-600' : 'text-blue-600'}>
                  {topic.userProgress.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}