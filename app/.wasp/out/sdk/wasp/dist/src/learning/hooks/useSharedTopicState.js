import { useCallback, useEffect, useState } from 'react';
import { useTopicContext } from '../context/TopicContext';
const defaultState = {
    timeSpentInSession: 0,
    lastActiveTab: 'learn',
    bookmarkedSections: [],
    sidebarCollapsed: false,
    preferredLayout: 'comfortable',
    searchHistory: [],
    recentlyViewed: []
};
export function useSharedTopicState() {
    const { topic, activeTab } = useTopicContext();
    const [sharedState, setSharedState] = useState(defaultState);
    const [sessionStartTime] = useState(Date.now());
    // Generate storage key based on topic
    const storageKey = topic ? `topic-state-${topic.slug}` : null;
    // Load state from localStorage on mount
    useEffect(() => {
        if (!storageKey)
            return;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsedState = JSON.parse(saved);
                setSharedState(prev => ({ ...prev, ...parsedState }));
            }
        }
        catch (error) {
            console.warn('Failed to load topic state from localStorage:', error);
        }
    }, [storageKey]);
    // Save state to localStorage when it changes
    useEffect(() => {
        if (!storageKey)
            return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(sharedState));
        }
        catch (error) {
            console.warn('Failed to save topic state to localStorage:', error);
        }
    }, [storageKey, sharedState]);
    // Update session time and last active tab
    useEffect(() => {
        const interval = setInterval(() => {
            setSharedState(prev => ({
                ...prev,
                timeSpentInSession: Math.floor((Date.now() - sessionStartTime) / 1000),
                lastActiveTab: activeTab
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [activeTab, sessionStartTime]);
    // Update methods
    const updateLearningPreferences = useCallback((preferences) => {
        setSharedState(prev => ({ ...prev, ...preferences }));
    }, []);
    const addBookmark = useCallback((sectionId) => {
        setSharedState(prev => ({
            ...prev,
            bookmarkedSections: [...new Set([...prev.bookmarkedSections, sectionId])]
        }));
    }, []);
    const removeBookmark = useCallback((sectionId) => {
        setSharedState(prev => ({
            ...prev,
            bookmarkedSections: prev.bookmarkedSections.filter(id => id !== sectionId)
        }));
    }, []);
    const toggleBookmark = useCallback((sectionId) => {
        setSharedState(prev => {
            const isBookmarked = prev.bookmarkedSections.includes(sectionId);
            return {
                ...prev,
                bookmarkedSections: isBookmarked
                    ? prev.bookmarkedSections.filter(id => id !== sectionId)
                    : [...prev.bookmarkedSections, sectionId]
            };
        });
    }, []);
    const updateUIPreferences = useCallback((preferences) => {
        setSharedState(prev => ({ ...prev, ...preferences }));
    }, []);
    const addToSearchHistory = useCallback((query) => {
        setSharedState(prev => ({
            ...prev,
            searchHistory: [query, ...prev.searchHistory.filter(q => q !== query)].slice(0, 10)
        }));
    }, []);
    const addToRecentlyViewed = useCallback((itemId) => {
        setSharedState(prev => ({
            ...prev,
            recentlyViewed: [itemId, ...prev.recentlyViewed.filter(id => id !== itemId)].slice(0, 20)
        }));
    }, []);
    const clearHistory = useCallback(() => {
        setSharedState(prev => ({
            ...prev,
            searchHistory: [],
            recentlyViewed: []
        }));
    }, []);
    const resetState = useCallback(() => {
        setSharedState(defaultState);
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);
    return {
        // State
        sharedState,
        // Learning preferences
        updateLearningPreferences,
        // Bookmarks
        addBookmark,
        removeBookmark,
        toggleBookmark,
        isBookmarked: (sectionId) => sharedState.bookmarkedSections.includes(sectionId),
        // UI preferences
        updateUIPreferences,
        // Search and navigation
        addToSearchHistory,
        addToRecentlyViewed,
        clearHistory,
        // Utilities
        resetState,
        // Computed values
        sessionDuration: sharedState.timeSpentInSession,
        hasBookmarks: sharedState.bookmarkedSections.length > 0,
        hasSearchHistory: sharedState.searchHistory.length > 0
    };
}
//# sourceMappingURL=useSharedTopicState.js.map