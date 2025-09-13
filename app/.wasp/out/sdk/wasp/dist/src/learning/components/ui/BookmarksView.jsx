import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Bookmark, BookmarkX, Clock } from 'lucide-react';
export function BookmarksView({ bookmarkedTopics, allTopics, onTopicSelect, onToggleBookmark, selectedTopicId }) {
    // Find bookmarked topics in the tree
    const findTopicById = (topics, id) => {
        for (const topic of topics) {
            if (topic.id === id)
                return topic;
            if (topic.children) {
                const found = findTopicById(topic.children, id);
                if (found)
                    return found;
            }
        }
        return null;
    };
    const bookmarkedTopicItems = bookmarkedTopics
        .map(id => findTopicById(allTopics, id))
        .filter((topic) => topic !== null);
    if (bookmarkedTopicItems.length === 0) {
        return (<div className="p-4 text-center">
        <div className="py-8">
          <Bookmark className="w-8 h-8 mx-auto text-muted-foreground mb-3"/>
          <p className="text-sm text-muted-foreground">No bookmarked topics yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Bookmark topics to access them quickly
          </p>
        </div>
      </div>);
    }
    return (<div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">Bookmarked Topics</h3>
        <span className="text-xs text-muted-foreground">
          {bookmarkedTopicItems.length} saved
        </span>
      </div>
      
      {bookmarkedTopicItems.map((topic) => (<Card key={topic.id} className={`cursor-pointer transition-all hover:shadow-sm ${selectedTopicId === topic.id ? 'ring-2 ring-primary' : ''}`} onClick={() => onTopicSelect(topic)}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{topic.title}</h4>
                {topic.summary && (<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {topic.summary}
                  </p>)}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    <span>Level {topic.depth + 1}</span>
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(topic.id);
            }} className="h-6 w-6 p-0 ml-2 flex-shrink-0">
                <BookmarkX className="w-3 h-3 text-muted-foreground hover:text-red-500"/>
              </Button>
            </div>
          </CardContent>
        </Card>))}
    </div>);
}
//# sourceMappingURL=BookmarksView.jsx.map