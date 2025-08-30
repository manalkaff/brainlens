import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getTopic, getTopicProgressSummary, getResearchStatus, useQuery } from 'wasp/client/operations';
import { useTabNavigation, type TabId } from '../hooks/useTabNavigation';
import { useSharedState, useSharedObject } from '../hooks/useSharedState';
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

export interface ResearchStatus {
  topicId: string;
  status: 'inactive' | 'queued' | 'active' | 'completed' | 'error';
  progress?: number;
  activeAgents?: string[];
  completedAgents?: number;
  totalAgents?: number;
  estimatedCompletion?: Date;
  errors?: string[];
  lastUpdate?: Date;
}

interface TopicContextState {
  // Topic data
  topic: TopicData | null;
  progressSummary: TopicProgressSummary | null;
  userProgress: UserTopicProgress | null;
  isLoading: boolean;
  error: string | null;
  
  // Research status
  researchStatus: ResearchStatus | null;
  isResearchLoading: boolean;
  isResearching: boolean;
  
  // Tab navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isTabLoaded: (tab: TabId) => boolean;
  loadTab: (tab: TabId) => void;
  loadedTabs: Set<TabId>;
  
  // Shared state across tabs
  selectedTopicId: string | null;
  setSelectedTopicId: (topicId: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  userPreferences: any;
  updateUserPreferences: (preferences: any) => void;
  
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
    defaultTab: 'explore', // Changed to make Explore the default tab
    enableUrlSync: true
  });

  // Shared state hooks
  const [selectedTopicId, setSelectedTopicId] = useSharedState<string | null>('selectedTopicId', null);
  const [sidebarCollapsed, setSidebarCollapsed] = useSharedState<boolean>('sidebarCollapsed', false);
  const [userPreferences, { update: updateUserPreferences }] = useSharedObject('userPreferences', {
    theme: 'light',
    fontSize: 'medium',
    autoSave: true,
    notifications: true
  });

  // Sync current topic across tabs
  const [, setCurrentTopic] = useSharedState<string>('currentTopic');
  const [, setCurrentTab] = useSharedState<string>('currentTab');

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

  // Fetch research status
  const { 
    data: researchStatus, 
    isLoading: researchLoading,
    error: researchError,
    refetch: refetchResearchStatus
  } = useQuery(getResearchStatus, { topicId: topic?.id || '' }, {
    enabled: !!topic?.id,
    refetchInterval: (data: any) => {
      // Poll more frequently when research is active
      if (data?.status === 'active' || data?.status === 'queued') {
        return 2000; // Poll every 2 seconds during active research
      }
      return 10000; // Poll every 10 seconds otherwise
    }
  });

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: topicLoading || progressLoading });
  }, [topicLoading, progressLoading]);

  // Update error state
  useEffect(() => {
    const error = topicError || progressError || researchError;
    dispatch({ type: 'SET_ERROR', payload: error ? error.message : null });
  }, [topicError, progressError, researchError]);

  const refreshTopic = () => {
    dispatch({ type: 'REFRESH' });
    refetchTopic();
    refetchProgress();
    refetchResearchStatus();
  };

  // Sync current topic and tab when they change
  useEffect(() => {
    if (topic?.slug) {
      setCurrentTopic(topic.slug);
    }
  }, [topic?.slug, setCurrentTopic]);

  useEffect(() => {
    setCurrentTab(tabNavigation.activeTab);
  }, [tabNavigation.activeTab, setCurrentTab]);

  // Set selected topic ID when topic loads and auto-redirect to explore tab
  useEffect(() => {
    if (topic?.id && !selectedTopicId) {
      setSelectedTopicId(topic.id);
      
      // Auto-redirect to Explore tab for new topics
      // This ensures users immediately see the AI learning engine at work
      if (tabNavigation.activeTab !== 'explore') {
        console.log(`🎯 Auto-redirecting to Explore tab for new topic: ${topic.title}`);
        tabNavigation.setActiveTab('explore');
      }
    }
  }, [topic?.id, selectedTopicId, setSelectedTopicId, tabNavigation]);

  // Additional logic: If a new topic slug is loaded, also switch to explore tab
  useEffect(() => {
    if (slug && topic?.slug === slug && tabNavigation.activeTab !== 'explore') {
      // Only auto-switch if we're not already on a tab the user explicitly selected
      const hasUserInteracted = tabNavigation.loadedTabs.size > 1; // More than just the default tab
      
      if (!hasUserInteracted) {
        console.log(`🎯 New topic loaded: "${slug}", switching to Explore tab`);
        tabNavigation.setActiveTab('explore');
      }
    }
  }, [slug, topic?.slug, tabNavigation]);

  // Compute derived research state
  const isResearching = researchStatus?.status === 'active' || researchStatus?.status === 'queued';
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TopicContextState = useMemo(() => ({
    // Topic data
    topic: topic || null,
    progressSummary: progressSummary || null,
    userProgress: topic?.userProgress || null,
    isLoading: state.isLoading || false,
    error: state.error || null,
    
    // Research status
    researchStatus: researchStatus || null,
    isResearchLoading: researchLoading || false,
    isResearching,
    
    // Tab navigation
    activeTab: tabNavigation.activeTab,
    setActiveTab: tabNavigation.setActiveTab,
    isTabLoaded: tabNavigation.isTabLoaded,
    loadTab: tabNavigation.loadTab,
    loadedTabs: tabNavigation.loadedTabs,
    
    // Shared state across tabs
    selectedTopicId: selectedTopicId ?? null,
    setSelectedTopicId,
    sidebarCollapsed: sidebarCollapsed ?? false,
    setSidebarCollapsed,
    userPreferences,
    updateUserPreferences,
    
    // Actions
    refreshTopic
  }), [
    topic,
    progressSummary,
    state.isLoading,
    state.error,
    researchStatus,
    researchLoading,
    isResearching,
    selectedTopicId,
    setSelectedTopicId,
    sidebarCollapsed,
    setSidebarCollapsed,
    userPreferences,
    updateUserPreferences,
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