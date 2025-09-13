import type { SearchResult } from '../research/vectorStore';
/**
 * Cached wrapper for vector operations to reduce API calls and improve performance
 */
/**
 * Search for content within a specific topic with caching
 */
export declare function searchTopicContentCached(query: string, topicId: string, options?: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
}): Promise<SearchResult[]>;
/**
 * Search across all topics with caching
 */
export declare function searchAllContentCached(query: string, options?: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    topicIds?: string[];
}): Promise<SearchResult[]>;
/**
 * Get content recommendations with caching
 */
export declare function getContentRecommendationsCached(topicId: string, topicTitle: string, options?: {
    limit?: number;
    excludeCurrentTopic?: boolean;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
}): Promise<SearchResult[]>;
/**
 * Extract RAG context with caching for frequently accessed queries
 */
export declare function extractRAGContextCached(query: string, topicId: string, options?: {
    maxTokens?: number;
    includeMetadata?: boolean;
}): Promise<{
    context: string;
    sources: SearchResult[];
    totalTokens: number;
}>;
/**
 * Store topic content and invalidate related caches
 */
export declare function storeTopicContentCached(topicId: string, topicSlug: string, content: string, contentType: 'summary' | 'subtopic' | 'research' | 'generated', depth?: number, additionalMetadata?: Record<string, any>): Promise<void>;
/**
 * Store multiple content pieces and invalidate related caches
 */
export declare function storeTopicContentBatchCached(topicId: string, topicSlug: string, contentItems: Array<{
    content: string;
    contentType: 'summary' | 'subtopic' | 'research' | 'generated';
    depth?: number;
    metadata?: Record<string, any>;
}>): Promise<void>;
/**
 * Delete topic vector content and invalidate related caches
 */
export declare function deleteTopicVectorContentCached(topicId: string): Promise<void>;
/**
 * Cache management utilities
 */
export declare function invalidateTopicSearchCache(topicId: string): Promise<void>;
export declare function invalidateAllSearchCache(): Promise<void>;
export declare function warmSearchCache(commonQueries: string[], topicIds: string[]): Promise<void>;
export { initializeTopicVectorStorage, getVectorStorageStats } from '../research/vectorOperations';
//# sourceMappingURL=cachedVectorOperations.d.ts.map