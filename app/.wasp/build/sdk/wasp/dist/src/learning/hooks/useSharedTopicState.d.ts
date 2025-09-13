interface SharedTopicState {
    learningStyle?: 'visual' | 'text' | 'interactive' | 'video';
    knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
    timeSpentInSession: number;
    lastActiveTab: string;
    bookmarkedSections: string[];
    sidebarCollapsed: boolean;
    preferredLayout: 'compact' | 'comfortable';
    searchHistory: string[];
    recentlyViewed: string[];
}
export declare function useSharedTopicState(): {
    sharedState: SharedTopicState;
    updateLearningPreferences: (preferences: Partial<Pick<SharedTopicState, "learningStyle" | "knowledgeLevel">>) => void;
    addBookmark: (sectionId: string) => void;
    removeBookmark: (sectionId: string) => void;
    toggleBookmark: (sectionId: string) => void;
    isBookmarked: (sectionId: string) => boolean;
    updateUIPreferences: (preferences: Partial<Pick<SharedTopicState, "sidebarCollapsed" | "preferredLayout">>) => void;
    addToSearchHistory: (query: string) => void;
    addToRecentlyViewed: (itemId: string) => void;
    clearHistory: () => void;
    resetState: () => void;
    sessionDuration: number;
    hasBookmarks: boolean;
    hasSearchHistory: boolean;
};
export {};
//# sourceMappingURL=useSharedTopicState.d.ts.map