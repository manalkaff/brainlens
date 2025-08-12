import { useState, useCallback, useEffect } from 'react';
import { useQuery, getTopicTree, createTopic } from 'wasp/client/operations';
import type { TopicTreeItem } from '../components/ui/TopicTree';

interface UseTopicTreeOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseTopicTreeReturn {
  topics: TopicTreeItem[];
  isLoading: boolean;
  error: Error | null;
  selectedTopic: TopicTreeItem | null;
  searchQuery: string;
  isGenerating: boolean;
  selectTopic: (topic: TopicTreeItem) => void;
  setSearchQuery: (query: string) => void;
  generateSubtopics: (topicId: string) => Promise<void>;
  refreshTree: () => void;
}

export function useTopicTree(options: UseTopicTreeOptions = {}): UseTopicTreeReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [selectedTopic, setSelectedTopic] = useState<TopicTreeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch topic tree
  const {
    data: topics = [],
    isLoading,
    error,
    refetch: refreshTree
  } = useQuery(getTopicTree, undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-refresh when generating is complete
  useEffect(() => {
    if (!isGenerating) {
      const timer = setTimeout(() => {
        refreshTree();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, refreshTree]);

  const selectTopic = useCallback((topic: TopicTreeItem) => {
    setSelectedTopic(topic);
  }, []);

  const generateSubtopics = useCallback(async (topicId: string) => {
    setIsGenerating(true);
    
    try {
      // Find the parent topic
      const findTopic = (topicList: TopicTreeItem[], id: string): TopicTreeItem | null => {
        for (const topic of topicList) {
          if (topic.id === id) return topic;
          const found = findTopic(topic.children || [], id);
          if (found) return found;
        }
        return null;
      };

      const parentTopic = findTopic(topics, topicId);
      if (!parentTopic) {
        throw new Error('Parent topic not found');
      }

      // Generate some example subtopics based on the parent topic
      // In a real implementation, this would call an AI service
      const subtopicTitles = generateSubtopicTitles(parentTopic.title);
      
      // Create subtopics
      const subtopicPromises = subtopicTitles.map((title, index) =>
        createTopic({
          title,
          summary: `Exploring ${title.toLowerCase()} in the context of ${parentTopic.title}`,
          parentId: topicId
        })
      );

      await Promise.all(subtopicPromises);
      
      // Refresh the tree to show new subtopics
      await refreshTree();
      
    } catch (error) {
      console.error('Failed to generate subtopics:', error);
      // You might want to show a toast notification here
    } finally {
      setIsGenerating(false);
    }
  }, [topics, refreshTree]);

  return {
    topics,
    isLoading,
    error,
    selectedTopic,
    searchQuery,
    isGenerating,
    selectTopic,
    setSearchQuery,
    generateSubtopics,
    refreshTree
  };
}

// Helper function to generate subtopic titles
// In a real implementation, this would use AI to generate relevant subtopics
function generateSubtopicTitles(parentTitle: string): string[] {
  const commonPatterns = [
    'Fundamentals',
    'Advanced Concepts',
    'Practical Applications',
    'Best Practices',
    'Common Challenges',
    'Tools and Resources'
  ];

  // Generate contextual subtopics based on the parent title
  const contextualSubtopics: string[] = [];
  
  if (parentTitle.toLowerCase().includes('programming') || parentTitle.toLowerCase().includes('coding')) {
    contextualSubtopics.push(
      'Syntax and Structure',
      'Data Types and Variables',
      'Control Flow',
      'Functions and Methods',
      'Error Handling',
      'Testing and Debugging'
    );
  } else if (parentTitle.toLowerCase().includes('machine learning') || parentTitle.toLowerCase().includes('ai')) {
    contextualSubtopics.push(
      'Supervised Learning',
      'Unsupervised Learning',
      'Neural Networks',
      'Model Training',
      'Feature Engineering',
      'Model Evaluation'
    );
  } else if (parentTitle.toLowerCase().includes('web') || parentTitle.toLowerCase().includes('frontend')) {
    contextualSubtopics.push(
      'HTML Structure',
      'CSS Styling',
      'JavaScript Functionality',
      'Responsive Design',
      'Performance Optimization',
      'Accessibility'
    );
  } else {
    // Generic subtopics for any topic
    contextualSubtopics.push(
      `Introduction to ${parentTitle}`,
      `Core Principles of ${parentTitle}`,
      `${parentTitle} in Practice`,
      `Advanced ${parentTitle} Techniques`,
      `${parentTitle} Case Studies`,
      `Future of ${parentTitle}`
    );
  }

  // Return a mix of contextual and common subtopics (max 4-6)
  const allSubtopics = [...contextualSubtopics, ...commonPatterns];
  return allSubtopics.slice(0, Math.min(6, allSubtopics.length));
}

// Hook for managing topic content and bookmarks
export function useTopicContent(topicId: string | null) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readSections, setReadSections] = useState<Set<string>>(new Set());

  const addBookmark = useCallback((sectionId: string) => {
    setBookmarks(prev => {
      if (prev.includes(sectionId)) return prev;
      return [...prev, sectionId];
    });
  }, []);

  const removeBookmark = useCallback((sectionId: string) => {
    setBookmarks(prev => prev.filter(id => id !== sectionId));
  }, []);

  const toggleBookmark = useCallback((sectionId: string) => {
    setBookmarks(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  }, []);

  const markAsRead = useCallback((sectionId: string) => {
    setReadSections(prev => new Set([...prev, sectionId]));
  }, []);

  const isBookmarked = useCallback((sectionId: string) => {
    return bookmarks.includes(sectionId);
  }, [bookmarks]);

  const isRead = useCallback((sectionId: string) => {
    return readSections.has(sectionId);
  }, [readSections]);

  // Reset state when topic changes
  useEffect(() => {
    if (topicId) {
      setBookmarks([]);
      setReadSections(new Set());
    }
  }, [topicId]);

  return {
    bookmarks,
    readSections: Array.from(readSections),
    addBookmark,
    removeBookmark,
    toggleBookmark,
    markAsRead,
    isBookmarked,
    isRead
  };
}