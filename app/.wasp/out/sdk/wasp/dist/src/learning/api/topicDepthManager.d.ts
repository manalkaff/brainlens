import { type IterativeResearchResult } from "./iterativeResearch";
import type { SubtopicInfo } from "./aiLearningAgent";
export interface TopicHierarchy {
    id: string;
    slug: string;
    title: string;
    summary?: string;
    depth: number;
    parentId?: string;
    children: TopicHierarchy[];
    researchStatus: 'pending' | 'researching' | 'completed' | 'error';
    lastResearched?: Date;
    subtopicsGenerated: boolean;
    metadata?: {
        estimatedReadTime?: number;
        complexity?: 'beginner' | 'intermediate' | 'advanced';
        priority?: number;
    };
    [key: string]: any;
}
export interface DepthExpansionRequest {
    topicId: string;
    targetDepth: number;
    userContext?: {
        level?: "beginner" | "intermediate" | "advanced";
        interests?: string[];
    };
    forceRefresh?: boolean;
}
export interface DepthExpansionResult {
    expandedHierarchy: TopicHierarchy;
    newTopicsCreated: number;
    totalProcessingTime: number;
    researchResults: Map<string, IterativeResearchResult>;
}
export interface SerializableDepthExpansionResult {
    expandedHierarchy: TopicHierarchy;
    newTopicsCreated: number;
    totalProcessingTime: number;
    researchResults: Record<string, IterativeResearchResult>;
    [key: string]: any;
}
export declare function makeDepthExpansionSerializable(result: DepthExpansionResult): SerializableDepthExpansionResult;
export declare function makeDepthExpansionFromSerializable(serialized: SerializableDepthExpansionResult): DepthExpansionResult;
/**
 * Topic Depth Management System
 * Handles multi-level topic exploration and hierarchical research
 */
export declare class TopicDepthManager {
    private readonly MAX_EXPANSION_DEPTH;
    private readonly BATCH_SIZE;
    /**
     * Expand a topic to a specific depth level
     */
    expandToDepth(request: DepthExpansionRequest): Promise<DepthExpansionResult>;
    /**
     * Generate subtopics for a specific topic
     */
    generateSubtopics(topicId: string, userContext?: any, forceRefresh?: boolean): Promise<{
        subtopics: SubtopicInfo[];
        researchResult?: IterativeResearchResult;
    }>;
    /**
     * Get topic hierarchy with depth information
     */
    getTopicHierarchy(topicId: string, maxDepth?: number): Promise<TopicHierarchy>;
    /**
     * Check if a topic needs research update based on cache TTL
     */
    needsResearchUpdate(topicId: string, cacheTtlDays?: number): Promise<boolean>;
    /**
     * Get research statistics for a topic hierarchy
     */
    getResearchStats(topicId: string): Promise<{
        totalTopics: number;
        researchedTopics: number;
        pendingTopics: number;
        averageDepth: number;
        lastResearchDate?: Date;
    }>;
    private expandHierarchyToDepth;
    private buildTopicHierarchy;
    private buildChildrenHierarchy;
    private createSubtopicsInDatabase;
    private determineResearchStatus;
    private inferComplexity;
    private flattenHierarchy;
    private generateSlug;
    /**
     * Generate a unique slug that avoids database conflicts
     * If the base slug already exists, append parent slug or counter
     */
    private generateUniqueSlug;
}
export declare const topicDepthManager: TopicDepthManager;
//# sourceMappingURL=topicDepthManager.d.ts.map