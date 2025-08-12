import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getTopic, getTopicProgressSummary, useQuery } from 'wasp/client/operations';
import { useTabNavigation, type TabId } from '../hooks/useTabNavigation';
import type { Topic, UserTopicProgress } from 'wasp/entities';

// Types for the context
export interface TopicData extends Topic {
  userProgress?: UserTopicProgress;
  children: Topic[];
  parent?: Topic | null;
}

export interface TopicProgressSummary {
  topic: Topic;
  userProgress?: UserTopicProgress;
  childrenProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionPercentage: number;
  };
  hierarchyProgress: {
    totalTimeSpent: number;
    totalBookmarks: number;
    deepestCompletedLevel: number;
  };
}

interface TopicContextState {
  // Topic data
  topic: TopicData | null;
  progressSummary: TopicProgressSummary | null;
  userProgress: UserTopicProgress | null;
  isLoading: boolean;
  error: string | null;
  
  // Tab navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isTabLoaded: (tab: TabId) => boolean;
  loadTab: (tab: TabId) => void;
  loadedTabs: Set<TabId>;
  
  // Actions
  refreshTopic: () => void;
}

interface TopicContextAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'REFRESH';
  payload?: any;
}

const TopicContext = createContext<TopicContextState | undefined>(undefined);

function topicReducer(state: Partial<TopicContextState>, action: TopicContextAction): Partial<TopicContextState> {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'REFRESH':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface TopicProviderProps {
  children: React.ReactNode;
}

export function TopicProvider({ children }: TopicProviderProps) {
  const { slug } = useParams<{ slug: string }>();
  const [state, dispatch] = useReducer(topicReducer, {
    topic: null,
    progressSummary: null,
    userProgress: null,
    isLoading: true,
    error: null
  });

  // Tab navigation hook
  const tabNavigation = useTabNavigation({
    defaultTab: 'learn',
    enableUrlSync: true
  });

  // Fetch topic data
  const { 
    data: topic, 
    isLoading: topicLoading, 
    error: topicError,
    refetch: refetchTopic
  } = useQuery(getTopic, { slug: slug || '' }, {
    enabled: !!slug
  });

  // Fetch progress summary
  const { 
    data: progressSummary, 
    isLoading: progressLoading,
    error: progressError,
    refetch: refetchProgress
  } = useQuery(getTopicProgressSummary, { topicId: topic?.id || '' }, {
    enabled: !!topic?.id
  });

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: topicLoading || progressLoading });
  }, [topicLoading, progressLoading]);

  // Update error state
  useEffect(() => {
    const error = topicError || progressError;
    dispatch({ type: 'SET_ERROR', payload: error ? error.message : null });
  }, [topicError, progressError]);

  const refreshTopic = () => {
    dispatch({ type: 'REFRESH' });
    refetchTopic();
    refetchProgress();
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TopicContextState = useMemo(() => ({
    // Topic data
    topic: topic || null,
    progressSummary: progressSummary || null,
    userProgress: topic?.userProgress || null,
    isLoading: state.isLoading || false,
    error: state.error || null,
    
    // Tab navigation
    activeTab: tabNavigation.activeTab,
    setActiveTab: tabNavigation.setActiveTab,
    isTabLoaded: tabNavigation.isTabLoaded,
    loadTab: tabNavigation.loadTab,
    loadedTabs: tabNavigation.loadedTabs,
    
    // Actions
    refreshTopic
  }), [
    topic,
    progressSummary,
    state.isLoading,
    state.error,
    tabNavigation.activeTab,
    tabNavigation.setActiveTab,
    tabNavigation.isTabLoaded,
    tabNavigation.loadTab,
    tabNavigation.loadedTabs,
    refreshTopic
  ]);

  return (
    <TopicContext.Provider value={contextValue}>
      {children}
    </TopicContext.Provider>
  );
}

export function useTopicContext() {
  const context = useContext(TopicContext);
  if (context === undefined) {
    throw new Error('useTopicContext must be used within a TopicProvider');
  }
  return context;
}