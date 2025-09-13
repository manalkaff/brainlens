import type { IterativeResearchOptions, SerializableIterativeResearchResult } from '../../learning/api/iterativeResearch';
import type { SerializableDepthExpansionResult } from '../../learning/api/topicDepthManager';
import type { SubtopicInfo } from '../../learning/api/aiLearningAgent';
import type { TopicHierarchy } from '../../learning/api/topicDepthManager';
import { type SubtopicProgress } from '../../learning/api/progressTracker';
export interface StartIterativeResearchArgs {
    topicSlug: string;
    options?: IterativeResearchOptions;
}
export interface ExpandTopicDepthArgs {
    topicId: string;
    targetDepth: number;
    userContext?: {
        level?: "beginner" | "intermediate" | "advanced";
        interests?: string[];
    };
    forceRefresh?: boolean;
}
export interface GenerateSubtopicsArgs {
    topicId: string;
    userContext?: any;
    forceRefresh?: boolean;
}
export interface EnhancedResearchStats {
    topicId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
    lastResearched?: string;
    cacheStatus?: string;
    totalTopics: number;
    researchedTopics: number;
    pendingTopics: number;
    averageDepth: number;
    lastResearchDate?: string;
    isActive?: boolean;
    realTimeProgress?: {
        isActive: boolean;
        phase: 'main_topic' | 'subtopics' | 'completed';
        currentStep?: {
            number: number;
            name: string;
            description: string;
            startTime: string;
            estimatedDuration: number;
            progress: number;
        };
        completedSteps: SerializableCompletedStep[];
        overallProgress: number;
        mainTopicCompleted: boolean;
        mainTopicResult?: any;
        subtopicsProgress: SubtopicProgress[];
        error?: string;
        estimatedTimeRemaining?: number;
    };
    totalTopicsProcessed?: number;
    cacheHits?: number;
    processingTime?: number;
    [key: string]: any;
}
export interface CompletedStep {
    number: number;
    name: string;
    description: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    result?: any;
}
export interface SerializableCompletedStep {
    number: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: number;
    result?: any;
}
export declare const startIterativeResearch: ({ topicSlug, options }: StartIterativeResearchArgs, context: any) => Promise<SerializableIterativeResearchResult>;
/**
 * Expand a topic to a specific depth
 */
export declare const expandTopicDepth: ({ topicId, targetDepth, userContext, forceRefresh }: ExpandTopicDepthArgs, context: any) => Promise<SerializableDepthExpansionResult>;
/**
 * Generate subtopics for a topic
 */
export declare const generateSubtopics: ({ topicId, userContext, forceRefresh }: GenerateSubtopicsArgs, context: any) => Promise<{
    subtopics: SubtopicInfo[];
    researchResult?: SerializableIterativeResearchResult;
}>;
/**
 * Get topic hierarchy with research status
 */
export declare const getTopicHierarchy: ({ topicId, maxDepth }: {
    topicId: string;
    maxDepth?: number;
}, context: any) => Promise<TopicHierarchy>;
/**
 * Get research statistics with real-time progress integration
 */
export declare const getResearchStats: ({ topicId }: {
    topicId: string;
}, context: any) => Promise<EnhancedResearchStats>;
/**
 * Get cache statistics for monitoring
 */
export declare const getCacheStatistics: (args: any, context: any) => Promise<import("../../learning/api/cachingSystem").CacheStats>;
/**
 * Clean up expired cache entries
 */
export declare const cleanupCache: (args: any, context: any) => Promise<{
    cleanedEntries: number;
}>;
/**
 * Check if topic needs research update
 */
export declare const checkResearchFreshness: ({ topicId, cacheTtlDays }: {
    topicId: string;
    cacheTtlDays?: number;
}, context: any) => Promise<{
    needsUpdate: boolean;
    lastResearched: Date | null | undefined;
    cacheStatus: import(".prisma/client").$Enums.CacheStatus | undefined;
    lastContentGenerated: Date | undefined;
}>;
//# sourceMappingURL=iterativeResearch.d.ts.map