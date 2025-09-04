import React, { useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { useTopicContext } from '../../context/TopicContext';
import { MindMapVisualization } from '../mindmap/MindMapVisualization';

export function MindMapTab() {
  const { topic, isLoading } = useTopicContext();

  // Convert topic tree to flat array for mind map
  const topics = useMemo(() => {
    if (!topic) return [];
    
    const flattenTopics = (topicItem: any): any[] => {
      const result = [topicItem];
      if (topicItem.children) {
        topicItem.children.forEach((child: any) => {
          result.push(...flattenTopics(child));
        });
      }
      return result;
    };
    
    return flattenTopics(topic);
  }, [topic]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Topic not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MindMapVisualization
        topics={topics}
        selectedTopicId={topic?.id}
        onTopicSelect={(selectedTopic) => {
          console.log('Selected topic:', selectedTopic);
        }}
      />
    </div>
  );
}