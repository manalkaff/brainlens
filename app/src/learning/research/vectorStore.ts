import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

// Qdrant client configuration
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

// OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    topicId: string;
    topicSlug: string;
    contentType: 'summary' | 'subtopic' | 'research' | 'generated';
    depth: number;
    createdAt: string;
    [key: string]: any;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: VectorDocument['metadata'];
  score: number;
}

export class VectorStore {
  private collectionName: string;

  constructor(collectionName: string = 'learning_content') {
    this.collectionName = collectionName;
  }

  /**
   * Initialize the vector collection with proper configuration
   */
  async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await qdrantClient.getCollections();
      const collectionExists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!collectionExists) {
        // Create collection with OpenAI embedding dimensions (1536 for text-embedding-3-small)
        await qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });

        console.log(`Created Qdrant collection: ${this.collectionName}`);
      }
    } catch (error) {
      console.error('Failed to initialize Qdrant collection:', error);
      throw new Error(`Vector store initialization failed: ${error}`);
    }
  }

  /**
   * Generate embeddings using OpenAI text-embedding-3-small
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  /**
   * Store a document with its embedding in the vector database
   */
  async storeDocument(document: VectorDocument): Promise<void> {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(document.content);

      // Store in Qdrant
      await qdrantClient.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: document.id,
            vector: embedding,
            payload: {
              content: document.content,
              metadata: document.metadata,
            },
          },
        ],
      });

      console.log(`Stored document ${document.id} in vector database`);
    } catch (error) {
      console.error('Failed to store document:', error);
      throw new Error(`Document storage failed: ${error}`);
    }
  }

  /**
   * Store multiple documents in batch
   */
  async storeDocuments(documents: VectorDocument[]): Promise<void> {
    try {
      // Generate embeddings for all documents
      const embeddings = await Promise.all(
        documents.map((doc) => this.generateEmbedding(doc.content))
      );

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
      await qdrantClient.upsert(this.collectionName, {
        wait: true,
        points,
      });

      console.log(`Stored ${documents.length} documents in vector database`);
    } catch (error) {
      console.error('Failed to store documents:', error);
      throw new Error(`Batch document storage failed: ${error}`);
    }
  }

  /**
   * Search for similar content using vector similarity
   */
  async searchSimilar(
    query: string,
    options: {
      limit?: number;
      scoreThreshold?: number;
      filter?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    try {
      const { limit = 10, scoreThreshold = 0.7, filter } = options;

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in Qdrant
      const searchResult = await qdrantClient.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        score_threshold: scoreThreshold,
        filter: filter ? { must: [filter] } : undefined,
        with_payload: true,
      });

      // Transform results
      return searchResult.map((result) => ({
        id: result.id as string,
        content: result.payload?.content as string,
        metadata: result.payload?.metadata as VectorDocument['metadata'],
        score: result.score,
      }));
    } catch (error) {
      console.error('Failed to search vectors:', error);
      throw new Error(`Vector search failed: ${error}`);
    }
  }

  /**
   * Search for content within a specific topic
   */
  async searchInTopic(
    query: string,
    topicId: string,
    options: {
      limit?: number;
      scoreThreshold?: number;
      contentTypes?: string[];
    } = {}
  ): Promise<SearchResult[]> {
    const { contentTypes, ...searchOptions } = options;

    let filter: Record<string, any> = {
      key: 'metadata.topicId',
      match: { value: topicId },
    };

    // Add content type filter if specified
    if (contentTypes && contentTypes.length > 0) {
      filter = {
        must: [
          filter,
          {
            key: 'metadata.contentType',
            match: { any: contentTypes },
          },
        ],
      };
    }

    return this.searchSimilar(query, {
      ...searchOptions,
      filter,
    });
  }

  /**
   * Delete documents by topic ID
   */
  async deleteByTopic(topicId: string): Promise<void> {
    try {
      await qdrantClient.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'metadata.topicId',
              match: { value: topicId },
            },
          ],
        },
      });

      console.log(`Deleted documents for topic ${topicId}`);
    } catch (error) {
      console.error('Failed to delete documents:', error);
      throw new Error(`Document deletion failed: ${error}`);
    }
  }

  /**
   * Get collection info and statistics
   */
  async getCollectionInfo(): Promise<any> {
    try {
      return await qdrantClient.getCollection(this.collectionName);
    } catch (error) {
      console.error('Failed to get collection info:', error);
      throw new Error(`Collection info retrieval failed: ${error}`);
    }
  }

  /**
   * Health check for the vector store
   */
  async healthCheck(): Promise<boolean> {
    try {
      await qdrantClient.getCollections();
      return true;
    } catch (error) {
      console.error('Vector store health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const vectorStore = new VectorStore();