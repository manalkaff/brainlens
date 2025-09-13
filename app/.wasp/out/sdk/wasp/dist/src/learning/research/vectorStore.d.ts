export interface VectorStoreConfig {
    qdrantUrl: string;
    collectionName: string;
    vectorSize: number;
    distance: 'Cosine' | 'Euclid' | 'Dot';
    apiKey?: string;
}
export interface VectorDocument {
    id: string;
    content: string;
    metadata: {
        topicId: string;
        topicSlug: string;
        contentType: 'summary' | 'subtopic' | 'research' | 'generated';
        depth: number;
        createdAt: string;
        agent?: string;
        confidence?: number;
        sourceUrl?: string;
        tokens?: number;
        language?: string;
        [key: string]: any;
    };
}
export interface SearchResult {
    id: string;
    content: string;
    metadata: VectorDocument['metadata'];
    score: number;
}
export declare class QdrantVectorStore {
    private client;
    private config;
    private embeddingService;
    constructor(config?: Partial<VectorStoreConfig>);
    /**
     * Create a collection for a specific topic
     */
    createCollection(topicId: string): Promise<void>;
    /**
     * Store embeddings for multiple documents
     */
    storeEmbeddings(documents: VectorDocument[]): Promise<void>;
    /**
     * Search for similar content using vector similarity
     */
    searchSimilar(query: string, topicId: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Delete a collection for a specific topic
     */
    deleteCollection(topicId: string): Promise<void>;
    /**
     * Generate embeddings using the embedding service
     */
    protected generateEmbedding(text: string): Promise<number[]>;
    /**
     * Store documents in a specific topic collection
     */
    private storeDocumentsInTopic;
    /**
     * Get collection name for a specific topic
     */
    private getTopicCollectionName;
    /**
     * Check if a collection exists
     */
    private collectionExists;
    /**
     * Health check for the vector store
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get collection info and statistics
     */
    getCollectionInfo(topicId: string): Promise<any>;
}
export declare class VectorStore extends QdrantVectorStore {
    constructor(collectionName?: string);
    /**
     * Initialize the vector collection with proper configuration
     * @deprecated Use createCollection instead
     */
    initializeCollection(): Promise<void>;
    /**
     * Generate embeddings using OpenAI text-embedding-3-small
     * @deprecated Use the internal generateEmbedding method
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Store a document with its embedding in the vector database
     */
    storeDocument(document: VectorDocument): Promise<void>;
    /**
     * Store multiple documents in batch
     */
    storeDocuments(documents: VectorDocument[]): Promise<void>;
    /**
     * Search for similar content using vector similarity (legacy method)
     */
    searchSimilarLegacy(query: string, options?: {
        limit?: number;
        scoreThreshold?: number;
        filter?: Record<string, any>;
        topicId?: string;
    }): Promise<SearchResult[]>;
    /**
     * Search for content within a specific topic
     */
    searchInTopic(query: string, topicId: string, options?: {
        limit?: number;
        scoreThreshold?: number;
        contentTypes?: string[];
    }): Promise<SearchResult[]>;
    /**
     * Delete documents by topic ID
     */
    deleteByTopic(topicId: string): Promise<void>;
    /**
     * Get collection info and statistics
     */
    getCollectionInfo(topicId?: string): Promise<any>;
}
export declare const vectorStore: VectorStore;
//# sourceMappingURL=vectorStore.d.ts.map