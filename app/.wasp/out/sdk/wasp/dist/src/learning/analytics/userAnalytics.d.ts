/**
 * User Analytics for BrainLens
 * Tracks user behavior, learning patterns, and engagement metrics
 */
interface LearningSession {
    id: string;
    userId: string;
    topicId: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    tabsVisited: string[];
    actionsPerformed: UserAction[];
    completionStatus: 'abandoned' | 'completed' | 'paused';
}
interface UserAction {
    id: string;
    type: 'navigation' | 'interaction' | 'content' | 'export' | 'bookmark' | 'chat' | 'mindmap';
    action: string;
    timestamp: Date;
    context: {
        topicId?: string;
        tabId?: string;
        elementId?: string;
        data?: any;
    };
    duration?: number;
}
interface LearningPattern {
    preferredTabs: {
        tab: string;
        usage: number;
        avgTime: number;
    }[];
    peakLearningHours: number[];
    averageSessionDuration: number;
    topicsCompleted: number;
    bookmarkUsage: number;
    exportUsage: number;
    chatEngagement: number;
    mindmapInteractions: number;
}
interface EngagementMetrics {
    totalSessions: number;
    totalLearningTime: number;
    averageSessionDuration: number;
    bounceRate: number;
    completionRate: number;
    retentionRate: number;
    activeStreak: number;
    lastActiveDate: Date;
}
interface ContentMetrics {
    topicsViewed: number;
    topicsCompleted: number;
    favoriteTopics: {
        topicId: string;
        engagementScore: number;
    }[];
    difficultTopics: {
        topicId: string;
        struggles: number;
    }[];
    fastestCompletions: {
        topicId: string;
        duration: number;
    }[];
}
export declare class UserAnalytics {
    private sessions;
    private actions;
    private currentSession;
    private userId;
    private readonly STORAGE_KEY;
    private readonly SESSION_TIMEOUT;
    private readonly MAX_ACTIONS_HISTORY;
    constructor();
    /**
     * Set user ID for analytics tracking
     */
    setUserId(userId: string): void;
    /**
     * Start a new learning session
     */
    startSession(topicId: string): string;
    /**
     * End current session
     */
    endSession(status?: LearningSession['completionStatus']): void;
    /**
     * Track user action
     */
    trackAction(type: UserAction['type'], action: string, context?: UserAction['context'], duration?: number): void;
    /**
     * Track tab navigation
     */
    trackTabNavigation(fromTab: string, toTab: string, topicId?: string): void;
    /**
     * Track content interaction
     */
    trackContentInteraction(action: string, topicId: string, data?: any): void;
    /**
     * Track chat interaction
     */
    trackChatInteraction(action: 'message_sent' | 'response_received' | 'thread_started', data?: any): (() => void) | void;
    /**
     * Track mindmap interaction
     */
    trackMindmapInteraction(action: 'node_click' | 'zoom' | 'pan' | 'export', nodeId?: string, data?: any): void;
    /**
     * Track export action
     */
    trackExport(format: string, topicId: string, success: boolean, duration?: number): void;
    /**
     * Track bookmark action
     */
    trackBookmark(action: 'add' | 'remove', topicId: string, sectionId?: string): void;
    /**
     * Get learning patterns for user
     */
    getLearningPatterns(): LearningPattern;
    /**
     * Get engagement metrics
     */
    getEngagementMetrics(): EngagementMetrics;
    /**
     * Get content metrics
     */
    getContentMetrics(): ContentMetrics;
    /**
     * Get all analytics data
     */
    getAnalyticsSummary(): {
        patterns: LearningPattern;
        engagement: EngagementMetrics;
        content: ContentMetrics;
        currentSession: LearningSession | null;
        totalActions: number;
        totalSessions: number;
    };
    /**
     * Export analytics data
     */
    exportAnalytics(): string;
    /**
     * Clear all analytics data
     */
    clearData(): void;
    /**
     * Private methods
     */
    private startSessionTracking;
    private cleanup;
    private persistData;
    private loadPersistedData;
}
export declare const userAnalytics: UserAnalytics;
export default userAnalytics;
//# sourceMappingURL=userAnalytics.d.ts.map