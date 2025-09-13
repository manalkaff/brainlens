import { type TopicResearchResult } from "./aiLearningAgent";
export interface IterativeResearchOptions {
    maxDepth?: number;
    forceRefresh?: boolean;
    userContext?: {
        level?: "beginner" | "intermediate" | "advanced";
        interests?: string[];
        previousKnowledge?: string[];
    };
}
export interface IterativeResearchResult {
    mainTopic: TopicResearchResult;
    subtopicResults: Map<string, TopicResearchResult>;
    totalTopicsProcessed: number;
    totalProcessingTime: number;
    cacheHits: number;
    cacheKey: string;
    mainTopicOnly?: boolean;
    subtopicsInProgress?: boolean;
}
export interface SerializableIterativeResearchResult {
    mainTopic: TopicResearchResult;
    subtopicResults: Record<string, TopicResearchResult>;
    totalTopicsProcessed: number;
    totalProcessingTime: number;
    cacheHits: number;
    cacheKey: string;
    mainTopicOnly?: boolean;
    subtopicsInProgress?: boolean;
    [key: string]: any;
}
export declare function makeSerializable(result: IterativeResearchResult): SerializableIterativeResearchResult;
export declare function makeIterativeFromSerializable(serialized: SerializableIterativeResearchResult): IterativeResearchResult;
/**
 * Iterative Research Engine
 * Core system that manages recursive topic exploration with intelligent caching
 */
export declare class IterativeResearchEngine {
    private readonly CACHE_TTL_DAYS;
    private readonly MAX_PARALLEL_SUBTOPICS;
    /**
     * Main entry point for iterative research with immediate main topic results
     * This is the research_and_generate function requested by the user
     */
    researchAndGenerate(topic: string, options?: IterativeResearchOptions, userContext?: {
        userId?: string;
        level?: string;
        style?: string;
    }): Promise<IterativeResearchResult>;
    /**
     * Research a single topic with proper user content vs shared cache logic
     */
    private researchSingleTopic;
    /**
     * New method for background subtopic processing with progress updates and database storage
     */
    private processSubtopicsInBackground;
    /**
     * Store research results to database for persistence
     */
    storeToDatabase(result: IterativeResearchResult, topicSlug: string): Promise<{
        mainTopicId: string;
        subtopicIds: string[];
    }>;
    /**
     * Store generated content in the database
     */
    private storeGeneratedContent;
    /**
     * Check if user has existing content for this topic
     */
    private getUserExistingContent;
    /**
     * Store research result as permanent user content
     */
    private storeUserContent;
    private generateCacheKey;
    private generateSlug;
    /**
     * Generate a unique slug that avoids database conflicts
     * If the base slug already exists, append parent slug or counter
     */
    private generateUniqueSlug;
}
export declare const iterativeResearchEngine: IterativeResearchEngine;
/**
 * Main research_and_generate function - This is what the user requested
 * Entry point for the iterative research system
 */
export declare function researchAndGenerate(topic: string, options?: IterativeResearchOptions, userContext?: {
    userId?: string;
    level?: string;
    style?: string;
}): Promise<IterativeResearchResult>;
/**
 * Convenience function to research and store to database
 */
export declare function researchAndStore(topic: string, topicSlug: string, options?: IterativeResearchOptions, userContext?: {
    userId?: string;
    level?: string;
    style?: string;
}): Promise<{
    research: IterativeResearchResult;
    storage: {
        mainTopicId: string;
        subtopicIds: string[];
    };
}>;
//# sourceMappingURL=iterativeResearch.d.ts.map