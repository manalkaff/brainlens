import { SearchResult } from './vectorStore';
/**
 * Initialize vector storage for a topic
 */
export declare function initializeTopicVectorStorage(topicId: string): Promise<void>;
/**
 * Store generated content in vector database
 */
export declare function storeTopicContent(topicId: string, topicSlug: string, content: string, contentType: 'summary' | 'subtopic' | 'research' | 'generated', depth?: number, additionalMetadata?: Record<string, any>): Promise<void>;
/**
 * Store multiple content pieces for a topic
 */
export declare function storeTopicContentBatch(topicId: string, topicSlug: string, contentItems: Array<{
    content: string;
    contentType: 'summary' | 'subtopic' | 'research' | 'generated';
    depth?: number;
    metadata?: Record<string, any>;
}>): Promise<void>;
/**
 * Search for content within a specific topic
 */
export declare function searchTopicContent(query: string, topicId: string, options?: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
}): Promise<SearchResult[]>;
/**
 * Search across all topics for a user
 */
export declare function searchAllContent(query: string, options?: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    topicIds?: string[];
}): Promise<SearchResult[]>;
/**
 * Get content recommendations based on a topic
 */
export declare function getContentRecommendations(topicId: string, topicTitle: string, options?: {
    limit?: number;
    excludeCurrentTopic?: boolean;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    relatedTopicIds?: string[];
}): Promise<SearchResult[]>;
/**
 * Delete all vector content for a topic
 */
export declare function deleteTopicVectorContent(topicId: string): Promise<void>;
/**
 * Get vector storage statistics for a topic
 */
export declare function getVectorStorageStats(topicId: string): Promise<{
    collectionInfo: any;
    isHealthy: boolean;
}>;
/**
 * Utility function to extract relevant content for RAG context
 */
export declare function extractRAGContext(query: string, topicId: string, options?: {
    maxTokens?: number;
    includeMetadata?: boolean;
}): Promise<{
    context: string;
    sources: SearchResult[];
    totalTokens: number;
}>;
/**
 * Enhanced search function with metadata filtering and content type categorization
 */
export declare function searchTopicContentEnhanced(query: string, topicId: string, options?: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    includeMetadata?: boolean;
    sortBy?: 'score' | 'date' | 'relevance';
}): Promise<SearchResult[]>;
/**
 * Optimize context window by selecting the most relevant content within token limits
 */
export declare function optimizeContextWindow(query: string, topicId: string, maxTokens?: number, options?: {
    prioritizeRecent?: boolean;
    includeMetadata?: boolean;
    diversifyContentTypes?: boolean;
}): Promise<{
    context: string;
    sources: SearchResult[];
    totalTokens: number;
    optimization: {
        originalResults: number;
        selectedResults: number;
        tokenEfficiency: number;
    };
}>;
//# sourceMappingURL=vectorOperations.d.ts.map