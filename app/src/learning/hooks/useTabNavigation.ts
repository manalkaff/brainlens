import { useEffect, useState, useCallback } from 'react';

export type TabId = 'learn' | 'explore' | 'ask' | 'mindmap' | 'quiz' | 'sources';

interface UseTabNavigationOptions {
  defaultTab?: TabId;
  enableUrlSync?: boolean;
}

interface TabNavigationState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isTabLoaded: (tab: TabId) => boolean;
  loadTab: (tab: TabId) => void;
  loadedTabs: Set<TabId>;
}

export function useTabNavigation(options: UseTabNavigationOptions = {}): TabNavigationState {
  const { defaultTab = 'learn', enableUrlSync = true } = options;
  
  const [activeTab, setActiveTabState] = useState<TabId>(defaultTab);
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(new Set([defaultTab]));

  // Initialize tab from URL hash
  useEffect(() => {
    if (!enableUrlSync) return;

    const getTabFromHash = (): TabId => {
      const hash = window.location.hash.replace('#', '');
      const validTabs: TabId[] = ['learn', 'explore', 'ask', 'mindmap', 'quiz', 'sources'];
      return validTabs.includes(hash as TabId) ? (hash as TabId) : defaultTab;
    };

    const initialTab = getTabFromHash();
    setActiveTabState(initialTab);
    setLoadedTabs(prev => new Set([...Array.from(prev), initialTab]));
  }, [defaultTab, enableUrlSync]);

  // Listen for hash changes
  useEffect(() => {
    if (!enableUrlSync) return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs: TabId[] = ['learn', 'explore', 'ask', 'mindmap', 'quiz', 'sources'];
      
      if (validTabs.includes(hash as TabId)) {
        const newTab = hash as TabId;
        setActiveTabState(newTab);
        setLoadedTabs(prev => new Set([...Array.from(prev), newTab]));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [enableUrlSync]);

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
    setLoadedTabs(prev => new Set([...Array.from(prev), tab]));
    
    if (enableUrlSync) {
      // Update URL hash without triggering navigation
      const newUrl = `${window.location.pathname}${window.location.search}#${tab}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [enableUrlSync]);

  const isTabLoaded = useCallback((tab: TabId): boolean => {
    return loadedTabs.has(tab);
  }, [loadedTabs]);

  const loadTab = useCallback((tab: TabId) => {
    setLoadedTabs(prev => new Set([...Array.from(prev), tab]));
  }, []);

  return {
    activeTab,
    setActiveTab,
    isTabLoaded,
    loadTab,
    loadedTabs
  };
}