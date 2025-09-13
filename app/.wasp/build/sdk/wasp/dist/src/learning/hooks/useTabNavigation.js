import { useEffect, useState, useCallback } from 'react';
export function useTabNavigation(options = {}) {
    const { defaultTab = 'learn', enableUrlSync = true } = options;
    const [activeTab, setActiveTabState] = useState(defaultTab);
    const [loadedTabs, setLoadedTabs] = useState(new Set([defaultTab]));
    // Initialize tab from URL hash
    useEffect(() => {
        if (!enableUrlSync)
            return;
        const getTabFromHash = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = ['learn', 'explore', 'ask', 'mindmap', 'quiz', 'sources'];
            return validTabs.includes(hash) ? hash : defaultTab;
        };
        const initialTab = getTabFromHash();
        setActiveTabState(initialTab);
        setLoadedTabs(prev => new Set([...Array.from(prev), initialTab]));
    }, [defaultTab, enableUrlSync]);
    // Listen for hash changes
    useEffect(() => {
        if (!enableUrlSync)
            return;
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = ['learn', 'explore', 'ask', 'mindmap', 'quiz', 'sources'];
            if (validTabs.includes(hash)) {
                const newTab = hash;
                setActiveTabState(newTab);
                setLoadedTabs(prev => new Set([...Array.from(prev), newTab]));
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [enableUrlSync]);
    const setActiveTab = useCallback((tab) => {
        setActiveTabState(tab);
        setLoadedTabs(prev => new Set([...Array.from(prev), tab]));
        if (enableUrlSync) {
            // Update URL hash without triggering navigation
            const newUrl = `${window.location.pathname}${window.location.search}#${tab}`;
            window.history.replaceState(null, '', newUrl);
        }
    }, [enableUrlSync]);
    const isTabLoaded = useCallback((tab) => {
        return loadedTabs.has(tab);
    }, [loadedTabs]);
    const loadTab = useCallback((tab) => {
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
//# sourceMappingURL=useTabNavigation.js.map