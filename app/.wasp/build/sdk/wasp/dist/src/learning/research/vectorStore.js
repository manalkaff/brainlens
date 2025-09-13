import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingService } from './embeddings';
export class QdrantVectorStore {
    client;
    config;
    embeddingService;
    constructor(config) {
        this.config = {
            qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
            collectionName: 'learning_content',
            vectorSize: 1536, // OpenAI text-embedding-3-small dimensions
            distance: 'Cosine',
            apiKey: process.env.QDRANT_API_KEY,
            ...config,
        };
        this.client = new QdrantClient({
            url: this.config.qdrantUrl,
            apiKey: this.config.apiKey,
        });
        this.embeddingService = new EmbeddingService();
    }
    /**
     * Create a collection for a specific topic
     */
    async createCollection(topicId) {
        try {
            const collectionName = this.getTopicCollectionName(topicId);
            // Check if collection exists
            const collections = await this.client.getCollections();
            const collectionExists = collections.collections.some((col) => col.name === collectionName);
            if (!collectionExists) {
                await this.client.createCollection(collectionName, {
                    vectors: {
                        size: this.config.vectorSize,
                        distance: this.config.distance,
                    },
                    optimizers_config: {
                        default_segment_number: 2,
                    },
                    replication_factor: 1,
                });
                console.log(`Created Qdrant collection: ${collectionName}`);
            }
        }
        catch (error) {
            console.error(`Failed to create collection for topic ${topicId}:`, error);
            throw new Error(`Collection creation failed: ${error}`);
        }
    }
    /**
     * Store embeddings for multiple documents
     */
    async storeEmbeddings(documents) {
        if (documents.length === 0)
            return;
        try {
            // Group documents by topic for efficient storage
            const documentsByTopic = documents.reduce((acc, doc) => {
                const topicId = doc.metadata.topicId;
                if (!acc[topicId])
                    acc[topicId] = [];
                acc[topicId].push(doc);
                return acc;
            }, {});
            // Process each topic separately
            for (const [topicId, topicDocs] of Object.entries(documentsByTopic)) {
                await this.createCollection(topicId);
                await this.storeDocumentsInTopic(topicId, topicDocs);
            }
            console.log(`Stored ${documents.length} documents across ${Object.keys(documentsByTopic).length} topics`);
        }
        catch (error) {
            console.error('Failed to store embeddings:', error);
            throw new Error(`Embedding storage failed: ${error}`);
        }
    }
    /**
     * Search for similar content using vector similarity
     */
    async searchSimilar(query, topicId, limit = 10) {
        try {
            const collectionName = this.getTopicCollectionName(topicId);
            // Check if collection exists
            if (!(await this.collectionExists(collectionName))) {
                console.warn(`Collection ${collectionName} does not exist`);
                return [];
            }
            // Generate embedding for the query
            const queryEmbedding = await this.generateEmbedding(query);
            // Search in Qdrant
            const searchResult = await this.client.search(collectionName, {
                vector: queryEmbedding,
                limit,
                score_threshold: 0.7,
                with_payload: true,
            });
            // Transform results
            return searchResult.map((result) => ({
                id: result.id,
                content: result.payload?.content,
                metadata: result.payload?.metadata,
                score: result.score,
            }));
        }
        catch (error) {
            console.error(`Failed to search similar content for topic ${topicId}:`, error);
            throw new Error(`Vector search failed: ${error}`);
        }
    }
    /**
     * Delete a collection for a specific topic
     */
    async deleteCollection(topicId) {
        try {
            const collectionName = this.getTopicCollectionName(topicId);
            if (await this.collectionExists(collectionName)) {
                await this.client.deleteCollection(collectionName);
                console.log(`Deleted collection: ${collectionName}`);
            }
        }
        catch (error) {
            console.error(`Failed to delete collection for topic ${topicId}:`, error);
            throw new Error(`Collection deletion failed: ${error}`);
        }
    }
    /**
     * Generate embeddings using the embedding service
     */
    async generateEmbedding(text) {
        return this.embeddingService.generateEmbedding(text);
    }
    /**
     * Store documents in a specific topic collection
     */
    async storeDocumentsInTopic(topicId, documents) {
        try {
            const collectionName = this.getTopicCollectionName(topicId);
            // Generate embeddings for all documents using batch processing
            const texts = documents.map(doc => doc.content);
            const embeddings = await this.embeddingService.generateBatchEmbeddings(texts);
            // Prepare points for batch upsert
            const points = documents.map((doc, index) => ({
                id: doc.id,
                vector: embeddings[index],
                payload: {
                    content: doc.content,
                    metadata: doc.metadata,
                },
            }));
            // Batch upsert to Qdrant
            await this.client.upsert(collectionName, {
                wait: true,
                points,
            });
            console.log(`Stored ${documents.length} documents in collection ${collectionName}`);
        }
        catch (error) {
            console.error(`Failed to store documents in topic ${topicId}:`, error);
            throw new Error(`Document storage failed: ${error}`);
        }
    }
    /**
     * Get collection name for a specific topic
     */
    getTopicCollectionName(topicId) {
        return `${this.config.collectionName}_${topicId}`;
    }
    /**
     * Check if a collection exists
     */
    async collectionExists(collectionName) {
        try {
            const collections = await this.client.getCollections();
            return collections.collections.some((col) => col.name === collectionName);
        }
        catch (error) {
            console.error('Failed to check collection existence:', error);
            return false;
        }
    }
    /**
     * Health check for the vector store
     */
    async healthCheck() {
        try {
            await this.client.getCollections();
            return true;
        }
        catch (error) {
            console.error('Vector store health check failed:', error);
            return false;
        }
    }
    /**
     * Get collection info and statistics
     */
    async getCollectionInfo(topicId) {
        try {
            const collectionName = this.getTopicCollectionName(topicId);
            return await this.client.getCollection(collectionName);
        }
        catch (error) {
            console.error(`Failed to get collection info for topic ${topicId}:`, error);
            throw new Error(`Collection info retrieval failed: ${error}`);
        }
    }
}
// Legacy VectorStore class for backward compatibility
export class VectorStore extends QdrantVectorStore {
    constructor(collectionName = 'learning_content') {
        super({ collectionName });
    }
    /**
     * Initialize the vector collection with proper configuration
     * @deprecated Use createCollection instead
     */
    async initializeCollection() {
        console.warn('initializeCollection is deprecated. Collections are created automatically per topic.');
    }
    /**
     * Generate embeddings using OpenAI text-embedding-3-small
     * @deprecated Use the internal generateEmbedding method
     */
    async generateEmbedding(text) {
        return super.generateEmbedding(text);
    }
    /**
     * Store a document with its embedding in the vector database
     */
    async storeDocument(document) {
        await this.storeEmbeddings([document]);
    }
    /**
     * Store multiple documents in batch
     */
    async storeDocuments(documents) {
        await this.storeEmbeddings(documents);
    }
    /**
     * Search for similar content using vector similarity (legacy method)
     */
    async searchSimilarLegacy(query, options = {}) {
        const { topicId, limit = 10 } = options;
        if (!topicId) {
            throw new Error('topicId is required for vector search');
        }
        return super.searchSimilar(query, topicId, limit);
    }
    /**
     * Search for content within a specific topic
     */
    async searchInTopic(query, topicId, options = {}) {
        const { limit = 10 } = options;
        return super.searchSimilar(query, topicId, limit);
    }
    /**
     * Delete documents by topic ID
     */
    async deleteByTopic(topicId) {
        await this.deleteCollection(topicId);
    }
    /**
     * Get collection info and statistics
     */
    async getCollectionInfo(topicId) {
        if (!topicId) {
            throw new Error('topicId is required to get collection info');
        }
        return super.getCollectionInfo(topicId);
    }
}
// Export singleton instance
export const vectorStore = new VectorStore();
//# sourceMappingURL=vectorStore.js.map