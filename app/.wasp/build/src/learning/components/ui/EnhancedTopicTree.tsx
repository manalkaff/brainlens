import React from 'react';
import { TopicTree, type TopicTreeItem } from './TopicTree';
import { useTopicTreeState } from '../../hooks/useTopicTreeState';

interface EnhancedTopicTreeProps {
  topics: TopicTreeItem[];
  selectedTopicId?: string; // Legacy prop for backward compatibility
  selectedTopicPath?: string[]; // New path-based selection
  onTopicSelect: (topic: TopicTreeItem, path?: string[]) => void; // Enhanced callback
  onGenerateSubtopics?: (topicId: string) => void;
  isGenerating?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  compact?: boolean;
  autoExpandSelected?: boolean;
  persistExpansion?: boolean;
}

/**
 * Enhanced TopicTree component that provides backward compatibility
 * while implementing new path-based selection and proper state management
 */
export function EnhancedTopicTree({
  topics,
  selectedTopicId,
  selectedTopicPath: propSelectedTopicPath,
  onTopicSelect,
  onGenerateSubtopics,
  isGenerating = false,
  searchQuery = '',
  onSearchChange,
  compact = false,
  autoExpandSelected = true,
  persistExpansion = true
}: EnhancedTopicTreeProps) {
  
  // Convert selectedTopicId to path for backward compatibility
  const selectedTopicPath = React.useMemo(() => {
    if (propSelectedTopicPath) {
      return propSelectedTopicPath;
    }
    
    if (selectedTopicId) {
      // Find the topic and build its path
      const findTopicPath = (topicList: TopicTreeItem[], targetId: string, currentPath: string[] = []): string[] | null => {
        for (const topic of topicList) {
          const newPath = [...currentPath, topic.id];
          
          if (topic.id === targetId) {
            return newPath;
          }
          
          if (topic.children && topic.children.length > 0) {
            const foundPath = findTopicPath(topic.children, targetId, newPath);
            if (foundPath) {
              return foundPath;
            }
          }
        }
        return null;
      };
      
      return findTopicPath(topics, selectedTopicId) || [];
    }
    
    return [];
  }, [propSelectedTopicPath, selectedTopicId, topics]);

  // Use the topic tree state hook
  const {
    expandedNodes,
    onToggleExpand,
    ensurePathExpanded
  } = useTopicTreeState({
    topics,
    selectedTopicPath,
    autoExpandSelected,
    persistExpansion
  });

  // Enhanced topic select handler
  const handleTopicSelect = React.useCallback((topic: TopicTreeItem, path: string[]) => {
    // Ensure the path to this topic is expanded
    ensurePathExpanded(path);
    
    // Call the original handler with both topic and path
    if (onTopicSelect.length > 1) {
      // New interface - pass both topic and path
      (onTopicSelect as (topic: TopicTreeItem, path: string[]) => void)(topic, path);
    } else {
      // Legacy interface - pass only topic
      (onTopicSelect as (topic: TopicTreeItem) => void)(topic);
    }
  }, [onTopicSelect, ensurePathExpanded]);

  return (
    <TopicTree
      topics={topics}
      selectedTopicPath={selectedTopicPath}
      onTopicSelect={handleTopicSelect}
      onGenerateSubtopics={onGenerateSubtopics}
      expandedNodes={expandedNodes}
      onToggleExpand={onToggleExpand}
      isGenerating={isGenerating}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      compact={compact}
    />
  );
}

// Export both components for flexibility
export { TopicTree } from './TopicTree';
export type { TopicTreeItem } from './TopicTree';