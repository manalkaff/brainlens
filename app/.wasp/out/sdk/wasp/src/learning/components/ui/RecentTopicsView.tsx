import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { History, Clock, Bookmark, BookmarkPlus } from 'lucide-react';
import type { TopicTreeItem } from './TopicTree';

interface RecentTopicsViewProps {
  recentTopics: TopicTreeItem[];
  onTopicSelect: (topic: TopicTreeItem) => void;
  onToggleBookmark: (topicId: string) => void;
  bookmarkedTopics: string[];
  selectedTopicId?: string;
}

export function RecentTopicsView({
  recentTopics,
  onTopicSelect,
  onToggleBookmark,
  bookmarkedTopics,
  selectedTopicId
}: RecentTopicsViewProps) {
  if (recentTopics.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="py-8">
          <History className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No recent topics</p>
          <p className="text-xs text-muted-foreground mt-1">
            Topics you visit will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">Recent Topics</h3>
        <span className="text-xs text-muted-foreground">
          Last {recentTopics.length} visited
        </span>
      </div>
      
      {recentTopics.map((topic, index) => (
        <Card 
          key={`${topic.id}-${index}`}
          className={`cursor-pointer transition-all hover:shadow-sm ${
            selectedTopicId === topic.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onTopicSelect(topic)}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{topic.title}</h4>
                {topic.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {topic.summary}
                  </p>
                )}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>#{index + 1} recent</span>
                  </div>
                  
                  <span>Level {topic.depth + 1}</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(topic.id);
                }}
                className="h-6 w-6 p-0 ml-2 flex-shrink-0"
              >
                {bookmarkedTopics.includes(topic.id) ? (
                  <Bookmark className="w-3 h-3 text-yellow-600 fill-current" />
                ) : (
                  <BookmarkPlus className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}