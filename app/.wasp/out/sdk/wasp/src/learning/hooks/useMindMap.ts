import { useState, useCallback, useMemo } from 'react';
import { TopicTreeItem } from '../components/ui/TopicTree';

export type LayoutType = 'hierarchical' | 'radial' | 'force';

interface UseMindMapOptions {
  topics: TopicTreeItem[];
  selectedTopicId?: string;
  onTopicSelect?: (topic: TopicTreeItem) => void;
  defaultLayout?: LayoutType;
}

interface MindMapFilters {
  showCompleted: boolean;
  showInProgress: boolean;
  showNotStarted: boolean;
  minDepth: number;
  maxDepth: number;
}

export function useMindMap({
  topics,
  selectedTopicId,
  onTopicSelect,
  defaultLayout = 'hierarchical'
}: UseMindMapOptions) {
  const [layout, setLayout] = useState<LayoutType>(defaultLayout);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MindMapFilters>({
    showCompleted: true,
    showInProgress: true,
    showNotStarted: true,
    minDepth: 0,
    maxDepth: 3,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter topics based on current filters and search
  const filteredTopics = useMemo(() => {
    const filterTopics = (topicList: TopicTreeItem[]): TopicTreeItem[] => {
      return topicList.reduce((acc: TopicTreeItem[], topic) => {
        // Check depth filter
        if (topic.depth < filters.minDepth || topic.depth > filters.maxDepth) {
          return acc;
        }

        // Check completion status filter
        const isCompleted = topic.userProgress?.completed || false;
        const hasProgress = topic.userProgress && topic.userProgress.timeSpent > 0;
        const isNotStarted = !hasProgress && !isCompleted;

        const statusMatch = 
          (isCompleted && filters.showCompleted) ||
          (hasProgress && !isCompleted && filters.showInProgress) ||
          (isNotStarted && filters.showNotStarted);

        if (!statusMatch) {
          return acc;
        }

        // Check search query
        const searchMatch = !searchQuery || 
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (topic.summary && topic.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!searchMatch) {
          return acc;
        }

        // Recursively filter children
        const filteredChildren = filterTopics(topic.children || []);
        
        // Include topic if it matches or has matching children
        acc.push({
          ...topic,
          children: filteredChildren
        });
        
        return acc;
      }, []);
    };

    return filterTopics(topics);
  }, [topics, filters, searchQuery]);

  // Get statistics about the mind map
  const statistics = useMemo(() => {
    const countTopics = (topicList: TopicTreeItem[]) => {
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;
      let totalTimeSpent = 0;
      let totalBookmarks = 0;
      let maxDepth = 0;

      const traverse = (topics: TopicTreeItem[]) => {
        topics.forEach(topic => {
          total++;
          maxDepth = Math.max(maxDepth, topic.depth);

          if (topic.userProgress?.completed) {
            completed++;
          } else if (topic.userProgress && topic.userProgress.timeSpent > 0) {
            inProgress++;
          } else {
            notStarted++;
          }

          if (topic.userProgress) {
            totalTimeSpent += topic.userProgress.timeSpent || 0;
            totalBookmarks += topic.userProgress.bookmarks?.length || 0;
          }

          if (topic.children) {
            traverse(topic.children);
          }
        });
      };

      traverse(topicList);

      return {
        total,
        completed,
        inProgress,
        notStarted,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalTimeSpent,
        totalBookmarks,
        maxDepth,
        averageTimePerTopic: total > 0 ? Math.round(totalTimeSpent / total) : 0,
      };
    };

    return {
      all: countTopics(topics),
      filtered: countTopics(filteredTopics),
    };
  }, [topics, filteredTopics]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setLayout(newLayout);
  }, []);

  // Handle search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle topic selection
  const handleTopicSelect = useCallback((topic: TopicTreeItem) => {
    onTopicSelect?.(topic);
  }, [onTopicSelect]);

  // Handle filter changes
  const updateFilters = useCallback((newFilters: Partial<MindMapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      showCompleted: true,
      showInProgress: true,
      showNotStarted: true,
      minDepth: 0,
      maxDepth: 3,
    });
    setSearchQuery('');
  }, []);

  // Export functionality with enhanced features
  const exportMindMap = useCallback(async (format: 'png' | 'svg') => {
    try {
      // This is a placeholder implementation
      // In a real app, you would use html2canvas or similar
      console.log(`Exporting mind map as ${format}`);
      
      // Create a simple export notification
      const exportData = {
        format,
        timestamp: new Date().toISOString(),
        topicCount: filteredTopics.length,
        layout,
        searchQuery: searchQuery || 'none',
        statistics: statistics.filtered
      };
      
      // For demonstration, create a JSON export
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindmap-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Export failed:', error);
      return Promise.reject(error);
    }
  }, [filteredTopics.length, layout, searchQuery, statistics.filtered]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Find topic by ID
  const findTopicById = useCallback((id: string): TopicTreeItem | null => {
    const search = (topicList: TopicTreeItem[]): TopicTreeItem | null => {
      for (const topic of topicList) {
        if (topic.id === id) return topic;
        if (topic.children) {
          const found = search(topic.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return search(topics);
  }, [topics]);

  // Get topic path (breadcrumb)
  const getTopicPath = useCallback((topicId: string): TopicTreeItem[] => {
    const path: TopicTreeItem[] = [];
    
    const findPath = (topicList: TopicTreeItem[], targetId: string, currentPath: TopicTreeItem[]): boolean => {
      for (const topic of topicList) {
        const newPath = [...currentPath, topic];
        
        if (topic.id === targetId) {
          path.push(...newPath);
          return true;
        }
        
        if (topic.children && findPath(topic.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(topics, topicId, []);
    return path;
  }, [topics]);

  return {
    // State
    layout,
    searchQuery,
    filters,
    isFullscreen,
    filteredTopics,
    statistics,
    
    // Actions
    handleLayoutChange,
    handleSearchChange,
    handleTopicSelect,
    updateFilters,
    resetFilters,
    exportMindMap,
    toggleFullscreen,
    
    // Utilities
    findTopicById,
    getTopicPath,
  };
}