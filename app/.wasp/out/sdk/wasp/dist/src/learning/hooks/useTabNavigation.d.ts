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
export declare function useTabNavigation(options?: UseTabNavigationOptions): TabNavigationState;
export {};
//# sourceMappingURL=useTabNavigation.d.ts.map