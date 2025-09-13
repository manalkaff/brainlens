import React from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Bookmark, BookmarkPlus, Eye, Clock, Star, Target } from 'lucide-react';
import type { TopicTreeItem } from './TopicTree';

interface ContentHeaderProps {
  topic: TopicTreeItem;
  isSubtopic: boolean;
  parentTopic?: TopicTreeItem | null;
  onBookmarkToggle: () => void;
  isBookmarked: boolean;
  isRead: boolean;
  onMarkAsRead: () => void;
}

export function ContentHeader({
  topic,
  isSubtopic,
  parentTopic,
  onBookmarkToggle,
  isBookmarked,
  isRead,
  onMarkAsRead
}: ContentHeaderProps) {
  return (
    <div className="border-b pb-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isSubtopic && parentTopic && (
              <Badge variant="outline" className="text-xs">
                Subtopic of {parentTopic.title}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              Level {topic.depth + 1}
            </Badge>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
          
          {topic.summary && (
            <p className="text-muted-foreground">{topic.summary}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmarkToggle}
            className="h-8 w-8 p-0"
          >
            {isBookmarked ? (
              <Bookmark className="w-4 h-4 text-yellow-600 fill-current" />
            ) : (
              <BookmarkPlus className="w-4 h-4" />
            )}
          </Button>
          
          {!isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAsRead}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          
          {isRead && (
            <Badge variant="outline" className="text-xs text-green-600">
              <Eye className="w-3 h-3 mr-1" />
              Read
            </Badge>
          )}
        </div>
      </div>
      
      {/* Topic metadata */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}