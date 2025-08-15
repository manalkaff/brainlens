import OpenAI from 'openai';
import { createClient } from 'redis';

export interface EmbeddingCacheEntry {
  embedding: number[];
  timestamp: Date;
  model: string;
}

export class EmbeddingService {
  private openai: OpenAI;
  private redis?: ReturnType<typeof createClient>;
  private cacheEnabled: boolean;
  private cacheTTL: number; // Cache TTL in seconds

  constructor(options: {
    cacheEnabled?: boolean;
    cacheTTL?: number;
    redisUrl?: string;
  } = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheTTL = options.cacheTTL ?? 24 * 60 * 60; // 24 hours default

    if (this.cacheEnabled) {
      this.initializeRedis(options.redisUrl);
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Check cache first
      if (this.cacheEnabled) {
        const cached = await this.getCachedEmbedding(text);
        if (cached) {
          console.log('Retrieved embedding from cache');
          return cached;
        }
      }

      // Generate new embedding
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;

      // Cache the result
      if (this.cacheEnabled) {
        await this.cacheEmbedding(text, embedding);
      }

      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      // Check cache for all texts
      const cachedResults: (number[] | null)[] = [];
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      if (this.cacheEnabled) {
        for (let i = 0; i < texts.length; i++) {
          const cached = await this.getCachedEmbedding(texts[i]);
          cachedResults[i] = cached;
          if (!cached) {
            uncachedTexts.push(texts[i]);
            uncachedIndices.push(i);
          }
        }
      } else {
        // If cache is disabled, all texts are uncached
        uncachedTexts.push(...texts);
        uncachedIndices.push(...texts.map((_, i) => i));
      }

      // Generate embeddings for uncached texts
      let newEmbeddings: number[][] = [];
      if (uncachedTexts.length > 0) {
        // Process in batches to avoid API limits
        const batchSize = 100; // OpenAI's batch limit
        const batches: string[][] = [];
        
        for (let i = 0; i < uncachedTexts.length; i += batchSize) {
          batches.push(uncachedTexts.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: batch,
            encoding_format: 'float',
          });

          const batchEmbeddings = response.data.map(item => item.embedding);
          newEmbeddings.push(...batchEmbeddings);

          // Cache the new embeddings
          if (this.cacheEnabled) {
            for (let i = 0; i < batch.length; i++) {
              await this.cacheEmbedding(batch[i], batchEmbeddings[i]);
            }
          }
        }
      }

      // Combine cached and new embeddings
      const results: number[][] = new Array(texts.length);
      let newEmbeddingIndex = 0;

      for (let i = 0; i < texts.length; i++) {
        if (cachedResults[i]) {
          results[i] = cachedResults[i]!;
        } else {
          results[i] = newEmbeddings[newEmbeddingIndex++];
        }
      }

      console.log(`Generated ${newEmbeddings.length} new embeddings, retrieved ${texts.length - newEmbeddings.length} from cache`);
      return results;
    } catch (error) {
      console.error('Failed to generate batch embeddings:', error);
      throw new Error(`Batch embedding generation failed: ${error}`);
    }
  }

  /**
   * Cache an embedding
   */
  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    if (!this.redis || !this.cacheEnabled) return;

    try {
      const cacheKey = this.getCacheKey(text);
      const cacheEntry: EmbeddingCacheEntry = {
        embedding,
        timestamp: new Date(),
        model: 'text-embedding-3-small',
      };

      await this.redis.setEx(
        cacheKey,
        this.cacheTTL,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('Failed to cache embedding:', error);
      // Don't throw error for cache failures
    }
  }

  /**
   * Get cached embedding
   */
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    if (!this.redis || !this.cacheEnabled) return null;

    try {
      const cacheKey = this.getCacheKey(text);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const cacheEntry: EmbeddingCacheEntry = JSON.parse(cached.toString());
        return cacheEntry.embedding;
      }
    } catch (error) {
      console.error('Failed to retrieve cached embedding:', error);
      // Don't throw error for cache failures
    }

    return null;
  }

  /**
   * Clear embedding cache
   */
  async clearCache(): Promise<void> {
    if (!this.redis || !this.cacheEnabled) return;

    try {
      const keys = await this.redis.keys('embedding:*') as string[];
      if (keys.length > 0) {
        await this.redis.del(keys);
        console.log(`Cleared ${keys.length} cached embeddings`);
      }
    } catch (error) {
      console.error('Failed to clear embedding cache:', error);
      throw new Error(`Cache clearing failed: ${error}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    if (!this.redis || !this.cacheEnabled) {
      return { totalKeys: 0, memoryUsage: '0B' };
    }

    try {
      const keys = await this.redis.keys('embedding:*') as string[];
      const info = await this.redis.info('memory');
      const infoStr = typeof info === 'string' ? info : String(info);
      const memoryMatch = infoStr.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

      return {
        totalKeys: keys.length,
        memoryUsage,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalKeys: 0, memoryUsage: 'Error' };
    }
  }

  /**
   * Health check for the embedding service
   */
  async healthCheck(): Promise<{
    openai: boolean;
    cache: boolean;
    error?: string;
  }> {
    const result = {
      openai: false,
      cache: false,
      error: undefined as string | undefined,
    };

    try {
      // Test OpenAI connection
      await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'test',
        encoding_format: 'float',
      });
      result.openai = true;
    } catch (error) {
      result.error = `OpenAI error: ${error}`;
    }

    try {
      // Test Redis connection if enabled
      if (this.redis && this.cacheEnabled) {
        await this.redis.ping();
        result.cache = true;
      } else {
        result.cache = !this.cacheEnabled; // True if cache is disabled
      }
    } catch (error) {
      if (result.error) {
        result.error += `, Cache error: ${error}`;
      } else {
        result.error = `Cache error: ${error}`;
      }
    }

    return result;
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(redisUrl?: string): Promise<void> {
    try {
      this.redis = createClient({
        url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || "",
      });

      this.redis.on('error', (err) => {
        console.error('Redis client error:', err);
        this.cacheEnabled = false; // Disable cache on connection error
      });

      this.redis.on('connect', () => {
        console.log('Connected to Redis for embedding cache');
      });

      await this.redis.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.cacheEnabled = false; // Disable cache if Redis fails
    }
  }

  /**
   * Generate cache key for text
   */
  private getCacheKey(text: string): string {
    // Use a hash of the text to create a consistent key
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `embedding:${hash}`;
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();