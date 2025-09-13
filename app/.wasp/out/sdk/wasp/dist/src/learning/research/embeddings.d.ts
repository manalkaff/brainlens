import { type ResearchResult } from './agents';
import { type ExtractedSubtopic } from './subtopicExtractor';
export interface EmbeddingCacheEntry {
    embedding: number[];
    timestamp: Date;
    model: string;
}
export interface ChunkingConfig {
    maxTokens: number;
    overlapTokens: number;
    strategy: 'sentence' | 'paragraph' | 'semantic' | 'sliding_window';
    preserveContext: boolean;
    respectBoundaries: boolean;
}
export interface ContentChunk {
    id: string;
    content: string;
    metadata: {
        chunkIndex: number;
        totalChunks: number;
        tokenCount: number;
        startOffset: number;
        endOffset: number;
        contextType: 'research' | 'synthesis' | 'subtopic';
        sourceId: string;
        parentTopic?: string;
        subtopic?: string;
        agentSource?: string;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        contentType?: string;
        hierarchy?: {
            level: number;
            path: string[];
        };
    };
}
export interface EnhancedEmbeddingResult {
    chunks: ContentChunk[];
    embeddings: number[][];
    metadata: {
        totalTokens: number;
        processingTime: number;
        cacheHitRate: number;
        chunksGenerated: number;
        strategy: string;
    };
}
export declare class EmbeddingService {
    private openai;
    private redis?;
    private cacheEnabled;
    private cacheTTL;
    private defaultChunkingConfig;
    constructor(options?: {
        cacheEnabled?: boolean;
        cacheTTL?: number;
        redisUrl?: string;
        chunkingConfig?: Partial<ChunkingConfig>;
    });
    /**
     * Generate embedding for a single text
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts in batch
     */
    generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Cache an embedding
     */
    cacheEmbedding(text: string, embedding: number[]): Promise<void>;
    /**
     * Get cached embedding
     */
    getCachedEmbedding(text: string): Promise<number[] | null>;
    /**
     * Clear embedding cache
     */
    clearCache(): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): Promise<{
        totalKeys: number;
        memoryUsage: string;
        hitRate?: number;
    }>;
    /**
     * Health check for the embedding service
     */
    healthCheck(): Promise<{
        openai: boolean;
        cache: boolean;
        error?: string;
    }>;
    /**
     * Initialize Redis connection
     */
    private initializeRedis;
    /**
     * Generate cache key for text
     */
    private getCacheKey;
    /**
     * Enhanced method: Generate embeddings for research results with intelligent chunking
     */
    generateResearchEmbeddings(researchResults: ResearchResult[], mainTopic: string, config?: Partial<ChunkingConfig>): Promise<EnhancedEmbeddingResult>;
    /**
     * Enhanced method: Generate embeddings for subtopic hierarchy
     */
    generateSubtopicEmbeddings(subtopics: ExtractedSubtopic[], mainTopic: string, synthesizedContent?: string, config?: Partial<ChunkingConfig>): Promise<EnhancedEmbeddingResult>;
    /**
     * Chunk a research result into manageable pieces
     */
    private chunkResearchResult;
    /**
     * Create chunks for subtopic hierarchy
     */
    private createSubtopicChunks;
    /**
     * Chunk synthesized content
     */
    private chunkSynthesizedContent;
    /**
     * Core text chunking method with multiple strategies
     */
    private chunkText;
    /**
     * Chunk text by sentences
     */
    private chunkBySentences;
    /**
     * Chunk text by paragraphs
     */
    private chunkByParagraphs;
    /**
     * Chunk text semantically (most intelligent method)
     */
    private chunkSemantically;
    /**
     * Chunk text using sliding window
     */
    private chunkBySliding;
    /**
     * Find semantic break points in text
     */
    private findSemanticBreakPoint;
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
    /**
     * Get last N tokens from text
     */
    private getLastTokens;
    /**
     * Create content for a subtopic
     */
    private createSubtopicContent;
    /**
     * Build hierarchy path for a subtopic
     */
    private buildHierarchyPath;
    /**
     * Classify agent content type
     */
    private classifyAgentContentType;
    /**
     * Create embedding text for a chunk (includes metadata for better semantic understanding)
     */
    private createChunkEmbeddingText;
    /**
     * Update chunking configuration
     */
    updateChunkingConfig(config: Partial<ChunkingConfig>): void;
    /**
     * Get current chunking configuration
     */
    getChunkingConfig(): ChunkingConfig;
    /**
     * Close connections and cleanup
     */
    close(): Promise<void>;
}
export declare const embeddingService: EmbeddingService;
//# sourceMappingURL=embeddings.d.ts.map