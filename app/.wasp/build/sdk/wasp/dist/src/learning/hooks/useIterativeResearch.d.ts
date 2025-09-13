import type { IterativeResearchResult } from '../api/iterativeResearch';
import type { TopicHierarchy } from '../api/topicDepthManager';
export interface UseIterativeResearchOptions {
    topicSlug?: string;
    autoStart?: boolean;
    maxDepth?: number;
    userContext?: {
        level?: "beginner" | "intermediate" | "advanced";
        interests?: string[];
    };
}
export interface UseIterativeResearchReturn {
    isResearching: boolean;
    researchProgress: number;
    error: string | null;
    researchResult: IterativeResearchResult | null;
    hierarchy: TopicHierarchy | null;
    startResearch: (options?: {
        forceRefresh?: boolean;
    }) => Promise<void>;
    expandDepth: (topicId: string, targetDepth: number) => Promise<void>;
    generateTopicSubtopics: (topicId: string) => Promise<void>;
    refreshResearch: () => Promise<void>;
    clearError: () => void;
    isTopicExpanded: (topicId: string) => boolean;
    getResearchStats: () => {
        totalTopics: number;
        completedTopics: number;
        pendingTopics: number;
    };
}
/**
 * Hook for managing iterative research with the new AI learning engine
 */
export declare function useIterativeResearch(options?: UseIterativeResearchOptions): UseIterativeResearchReturn;
/**
 * Hook for checking research freshness
 */
export declare function useResearchFreshness(topicId: string | null, cacheTtlDays?: number): {
    needsUpdate: boolean;
    lastResearched?: Date;
    cacheStatus?: string;
    isLoading: boolean;
};
//# sourceMappingURL=useIterativeResearch.d.ts.map