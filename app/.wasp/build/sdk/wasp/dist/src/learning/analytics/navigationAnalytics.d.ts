interface NavigationEvent {
    event: string;
    timestamp: string;
    userId?: string;
    sessionId?: string;
    data: Record<string, any>;
}
interface SubtopicNavigationData {
    fromTopic: string;
    toSubtopic: string;
    subtopicTitle: string;
    navigationDepth: number;
    navigationSource: 'sidebar' | 'cards' | 'breadcrumb' | 'url';
    timestamp: string;
}
interface ContentGenerationData {
    topicId: string;
    topicTitle: string;
    generationTrigger: 'manual' | 'automatic';
    generationTime?: number;
    success: boolean;
    errorMessage?: string;
}
interface LoadingStateData {
    topicId: string;
    loadingType: 'navigation' | 'content_generation' | 'subtopic_expansion';
    duration: number;
    success: boolean;
}
declare class NavigationAnalytics {
    private events;
    private sessionId;
    private userId?;
    constructor();
    private generateSessionId;
    private loadUserId;
    private trackEvent;
    private sendToAnalyticsService;
    trackSubtopicCardClick(data: SubtopicNavigationData): void;
    trackSubtopicSidebarClick(data: SubtopicNavigationData): void;
    trackBreadcrumbClick(data: SubtopicNavigationData): void;
    trackContentGeneration(data: ContentGenerationData): void;
    trackLoadingState(data: LoadingStateData): void;
    trackTimeSpent(topicId: string, timeSpent: number): void;
    trackSearch(query: string, resultsCount: number): void;
    trackError(error: string, context: Record<string, any>): void;
    getAnalyticsSummary(): {
        totalEvents: number;
        eventTypes: Record<string, number>;
        recentEvents: NavigationEvent[];
    };
    clearAnalytics(): void;
}
export declare const navigationAnalytics: NavigationAnalytics;
export type { NavigationEvent, SubtopicNavigationData, ContentGenerationData, LoadingStateData };
export declare function useNavigationAnalytics(): {
    trackSubtopicCardClick: (data: SubtopicNavigationData) => void;
    trackSubtopicSidebarClick: (data: SubtopicNavigationData) => void;
    trackBreadcrumbClick: (data: SubtopicNavigationData) => void;
    trackContentGeneration: (data: ContentGenerationData) => void;
    trackLoadingState: (data: LoadingStateData) => void;
    trackTimeSpent: (topicId: string, timeSpent: number) => void;
    trackSearch: (query: string, resultsCount: number) => void;
    trackError: (error: string, context: Record<string, any>) => void;
    getAnalyticsSummary: () => {
        totalEvents: number;
        eventTypes: Record<string, number>;
        recentEvents: NavigationEvent[];
    };
    clearAnalytics: () => void;
};
//# sourceMappingURL=navigationAnalytics.d.ts.map