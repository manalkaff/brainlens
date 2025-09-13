import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getTopic, getTopicProgressSummary, getResearchStats, useQuery } from 'wasp/client/operations';
import { useTabNavigation } from '../hooks/useTabNavigation';
import { useSharedState, useSharedObject } from '../hooks/useSharedState';
const TopicContext = createContext(undefined);
function topicReducer(state, action) {
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
export function TopicProvider({ children }) {
    const { slug } = useParams();
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
    const [selectedTopicId, setSelectedTopicId] = useSharedState('selectedTopicId', null);
    const [sidebarCollapsed, setSidebarCollapsed] = useSharedState('sidebarCollapsed', false);
    const [userPreferences, { update: updateUserPreferences }] = useSharedObject('userPreferences', {
        theme: 'light',
        fontSize: 'medium',
        autoSave: true,
        notifications: true
    });
    // Sync current topic across tabs
    const [, setCurrentTopic] = useSharedState('currentTopic');
    const [, setCurrentTab] = useSharedState('currentTab');
    // Fetch topic data
    const { data: topic, isLoading: topicLoading, error: topicError, refetch: refetchTopic } = useQuery(getTopic, { slug: slug || '' }, {
        enabled: !!slug,
        // Force refetch when slug changes to ensure fresh data
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        // Use the slug as part of the query key to prevent caching conflicts
        cacheTime: 0, // Don't cache at all to force fresh data
        staleTime: 0 // Consider data immediately stale
    });
    // Fetch progress summary
    const { data: progressSummary, isLoading: progressLoading, error: progressError, refetch: refetchProgress } = useQuery(getTopicProgressSummary, { topicId: topic?.id || '' }, {
        enabled: !!topic?.id
    });
    // Fetch research stats
    const { data: researchStats, isLoading: researchLoading, error: researchError, refetch: refetchResearchStats } = useQuery(getResearchStats, { topicId: topic?.id || '' }, {
        enabled: !!topic?.id,
        refetchInterval: 5000 // Check every 5 seconds
    });
    // Reset state when slug changes to ensure clean transitions
    useEffect(() => {
        dispatch({ type: 'REFRESH' });
        dispatch({ type: 'SET_LOADING', payload: true });
        // Clear selected topic ID to force fresh context
        setSelectedTopicId(null);
    }, [slug, setSelectedTopicId]);
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
        refetchResearchStats();
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
        if (topic?.id) {
            // Always update selected topic ID when topic changes (not just when null)
            if (selectedTopicId !== topic.id) {
                setSelectedTopicId(topic.id);
                // Auto-redirect to Explore tab for new topics
                // This ensures users immediately see the AI learning engine at work
                if (tabNavigation.activeTab !== 'explore') {
                    console.log(`🎯 Auto-redirecting to Explore tab for new topic: ${topic.title}`);
                    tabNavigation.setActiveTab('explore');
                }
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
    // Compute derived research state from stats
    const enhancedStats = researchStats;
    const isResearching = enhancedStats?.isActive || enhancedStats?.realTimeProgress?.isActive || false;
    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        // Topic data
        topic: topic || null,
        progressSummary: progressSummary || null,
        userProgress: topic?.userProgress || null,
        isLoading: state.isLoading || false,
        error: state.error || null,
        // Research status
        researchStatus: researchStats,
        enhancedResearchStats: enhancedStats,
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
        researchStats,
        enhancedStats,
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
    return (<TopicContext.Provider value={contextValue}>
      {children}
    </TopicContext.Provider>);
}
export function useTopicContext() {
    const context = useContext(TopicContext);
    if (context === undefined) {
        throw new Error('useTopicContext must be used within a TopicProvider');
    }
    return context;
}
//# sourceMappingURL=TopicContext.jsx.map