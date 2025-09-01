import { redisCache } from './redisClient';
import type { Topic, UserTopicProgress, ChatThread, Quiz } from 'wasp/entities';
import type { SearchResult } from '../research/vectorStore';

// Cache key prefixes
const CACHE_KEYS = {
  TOPIC: 'topic',
  TOPIC_TREE: 'topic_tree',
  USER_PROGRESS: 'user_progress',
  VECTOR_EMBEDDING: 'vector_embedding',
  SEARCH_RESULT: 'search_result',
  CHAT_THREAD: 'chat_thread',
  QUIZ: 'quiz',
  CONTENT_GENERATION: 'content_gen',
  RESEARCH_STATUS: 'research_status',
  API_RATE_LIMIT: 'api_rate_limit',
} as const;

// Cache TTL values (in seconds)
const CACHE_TTL = {
  TOPIC: 604800, // 1 week - topics don't change frequently
  TOPIC_TREE: 604800, // 1 week - topic hierarchies are stable
  USER_PROGRESS: 3600, // 1 hour - user-specific, needs to be fresh
  VECTOR_EMBEDDING: 604800, // 1 week - embeddings are stable
  SEARCH_RESULT: 604800, // 1 week - search results for sharing across users
  CHAT_THREAD: 3600, // 1 hour - user-specific conversations
  QUIZ: 604800, // 1 week - quiz content can be shared
  CONTENT_GENERATION: 604800, // 1 week - research results for cross-user sharing
  RESEARCH_STATUS: 3600, // 1 hour - research progress is user-specific
  API_RATE_LIMIT: 3600, // 1 hour - rate limiting should be short
} as const;

export class CacheService {
  // Topic caching
  async getTopic(topicId: string): Promise<Topic | null> {
    const key = `${CACHE_KEYS.TOPIC}:id:${topicId}`;
    return await redisCache.get<Topic>(key);
  }

  async setTopic(topic: Topic): Promise<void> {
    // Cache by both ID and slug for flexible lookups
    const idKey = `${CACHE_KEYS.TOPIC}:id:${topic.id}`;
    const slugKey = `${CACHE_KEYS.TOPIC}:slug:${topic.slug}`;
    
    await Promise.all([
      redisCache.set(idKey, topic, CACHE_TTL.TOPIC),
      redisCache.set(slugKey, topic, CACHE_TTL.TOPIC)
    ]);
  }

  async getTopicBySlug(slug: string): Promise<Topic | null> {
    const key = `${CACHE_KEYS.TOPIC}:slug:${slug}`;
    return await redisCache.get<Topic>(key);
  }

  async invalidateTopic(topicId: string, topicSlug?: string): Promise<void> {
    const idKey = `${CACHE_KEYS.TOPIC}:id:${topicId}`;
    const deletePromises = [redisCache.del(idKey)];
    
    // Also delete slug key if provided
    if (topicSlug) {
      const slugKey = `${CACHE_KEYS.TOPIC}:slug:${topicSlug}`;
      deletePromises.push(redisCache.del(slugKey));
    }
    
    await Promise.all(deletePromises);
    
    // Also invalidate related caches
    await this.invalidateTopicTree(topicId);
    await this.invalidateUserProgressForTopic(topicId);
  }

  // Topic tree caching
  async getTopicTree(rootTopicId: string): Promise<Topic[] | null> {
    const key = `${CACHE_KEYS.TOPIC_TREE}:id:${rootTopicId}`;
    return await redisCache.get<Topic[]>(key);
  }

  async setTopicTree(rootTopicId: string, tree: Topic[]): Promise<void> {
    const key = `${CACHE_KEYS.TOPIC_TREE}:id:${rootTopicId}`;
    await redisCache.set(key, tree, CACHE_TTL.TOPIC_TREE);
  }

  async invalidateTopicTree(topicId: string): Promise<void> {
    // Invalidate all topic trees that might contain this topic
    const pattern = `${CACHE_KEYS.TOPIC_TREE}:*`;
    await redisCache.flushPattern(pattern);
  }

  // User progress caching
  async getUserProgress(userId: string, topicId: string): Promise<UserTopicProgress | null> {
    const key = `${CACHE_KEYS.USER_PROGRESS}:${userId}:${topicId}`;
    return await redisCache.get<UserTopicProgress>(key);
  }

  async setUserProgress(progress: UserTopicProgress): Promise<void> {
    const key = `${CACHE_KEYS.USER_PROGRESS}:${progress.userId}:${progress.topicId}`;
    await redisCache.set(key, progress, CACHE_TTL.USER_PROGRESS);
  }

  async invalidateUserProgress(userId: string, topicId?: string): Promise<void> {
    if (topicId) {
      const key = `${CACHE_KEYS.USER_PROGRESS}:${userId}:${topicId}`;
      await redisCache.del(key);
    } else {
      const pattern = `${CACHE_KEYS.USER_PROGRESS}:${userId}:*`;
      await redisCache.flushPattern(pattern);
    }
  }

  async invalidateUserProgressForTopic(topicId: string): Promise<void> {
    const pattern = `${CACHE_KEYS.USER_PROGRESS}:*:${topicId}`;
    await redisCache.flushPattern(pattern);
  }

  // Vector embedding caching
  async getVectorEmbedding(content: string): Promise<number[] | null> {
    // Create a hash of the content for the cache key
    const contentHash = this.hashString(content);
    const key = `${CACHE_KEYS.VECTOR_EMBEDDING}:${contentHash}`;
    return await redisCache.get<number[]>(key);
  }

  async setVectorEmbedding(content: string, embedding: number[]): Promise<void> {
    const contentHash = this.hashString(content);
    const key = `${CACHE_KEYS.VECTOR_EMBEDDING}:${contentHash}`;
    await redisCache.set(key, embedding, CACHE_TTL.VECTOR_EMBEDDING);
  }

  // Search result caching
  async getSearchResults(query: string, topicId: string, options: any): Promise<SearchResult[] | null> {
    const optionsHash = this.hashString(JSON.stringify(options));
    const key = `${CACHE_KEYS.SEARCH_RESULT}:${topicId}:${this.hashString(query)}:${optionsHash}`;
    return await redisCache.get<SearchResult[]>(key);
  }

  async setSearchResults(query: string, topicId: string, options: any, results: SearchResult[]): Promise<void> {
    const optionsHash = this.hashString(JSON.stringify(options));
    const key = `${CACHE_KEYS.SEARCH_RESULT}:${topicId}:${this.hashString(query)}:${optionsHash}`;
    await redisCache.set(key, results, CACHE_TTL.SEARCH_RESULT);
  }

  async invalidateSearchResults(topicId?: string): Promise<void> {
    const pattern = topicId 
      ? `${CACHE_KEYS.SEARCH_RESULT}:${topicId}:*`
      : `${CACHE_KEYS.SEARCH_RESULT}:*`;
    await redisCache.flushPattern(pattern);
  }

  // Chat thread caching
  async getChatThread(threadId: string): Promise<ChatThread | null> {
    const key = `${CACHE_KEYS.CHAT_THREAD}:${threadId}`;
    return await redisCache.get<ChatThread>(key);
  }

  async setChatThread(thread: ChatThread): Promise<void> {
    const key = `${CACHE_KEYS.CHAT_THREAD}:${thread.id}`;
    await redisCache.set(key, thread, CACHE_TTL.CHAT_THREAD);
  }

  async invalidateChatThread(threadId: string): Promise<void> {
    const key = `${CACHE_KEYS.CHAT_THREAD}:${threadId}`;
    await redisCache.del(key);
  }

  // Quiz caching
  async getQuiz(quizId: string): Promise<Quiz | null> {
    const key = `${CACHE_KEYS.QUIZ}:${quizId}`;
    return await redisCache.get<Quiz>(key);
  }

  async setQuiz(quiz: Quiz): Promise<void> {
    const key = `${CACHE_KEYS.QUIZ}:${quiz.id}`;
    await redisCache.set(key, quiz, CACHE_TTL.QUIZ);
  }

  async invalidateQuiz(quizId: string): Promise<void> {
    const key = `${CACHE_KEYS.QUIZ}:${quizId}`;
    await redisCache.del(key);
  }

  // Content generation caching
  async getGeneratedContent(prompt: string, model: string): Promise<string | null> {
    const promptHash = this.hashString(`${model}:${prompt}`);
    const key = `${CACHE_KEYS.CONTENT_GENERATION}:${promptHash}`;
    return await redisCache.get<string>(key);
  }

  async setGeneratedContent(prompt: string, model: string, content: string): Promise<void> {
    const promptHash = this.hashString(`${model}:${prompt}`);
    const key = `${CACHE_KEYS.CONTENT_GENERATION}:${promptHash}`;
    await redisCache.set(key, content, CACHE_TTL.CONTENT_GENERATION);
  }

  // Research status caching
  async getResearchStatus(topicId: string): Promise<any | null> {
    const key = `${CACHE_KEYS.RESEARCH_STATUS}:${topicId}`;
    return await redisCache.get(key);
  }

  async setResearchStatus(topicId: string, status: any): Promise<void> {
    const key = `${CACHE_KEYS.RESEARCH_STATUS}:${topicId}`;
    await redisCache.set(key, status, CACHE_TTL.RESEARCH_STATUS);
  }

  async invalidateResearchStatus(topicId: string): Promise<void> {
    const key = `${CACHE_KEYS.RESEARCH_STATUS}:${topicId}`;
    await redisCache.del(key);
  }

  // API rate limiting
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `${CACHE_KEYS.API_RATE_LIMIT}:${identifier}`;
    const current = await redisCache.increment(key, windowSeconds);
    
    const remaining = Math.max(0, limit - current);
    const allowed = current <= limit;
    const resetTime = Date.now() + (windowSeconds * 1000);

    return {
      allowed,
      remaining,
      resetTime
    };
  }

  // Batch operations
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUserProgress(userId),
      redisCache.flushPattern(`${CACHE_KEYS.CHAT_THREAD}:*:${userId}`),
      redisCache.flushPattern(`${CACHE_KEYS.QUIZ}:*:${userId}`),
    ]);
  }

  async invalidateTopicCache(topicId: string): Promise<void> {
    await Promise.all([
      this.invalidateTopic(topicId),
      this.invalidateSearchResults(topicId),
      this.invalidateResearchStatus(topicId),
    ]);
  }

  // Utility methods
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Health check
  async healthCheck(): Promise<{
    redis: boolean;
    cacheStats: {
      totalKeys: number;
      keysByPrefix: Record<string, number>;
    };
  }> {
    const redis = redisCache.isReady();
    
    let totalKeys = 0;
    const keysByPrefix: Record<string, number> = {};

    if (redis) {
      try {
        for (const prefix of Object.values(CACHE_KEYS)) {
          const keys = await redisCache.keys(`${prefix}:*`);
          keysByPrefix[prefix] = keys.length;
          totalKeys += keys.length;
        }
      } catch (error) {
        console.error('Error getting cache stats:', error);
      }
    }

    return {
      redis,
      cacheStats: {
        totalKeys,
        keysByPrefix
      }
    };
  }

  // Cache warming
  async warmCache(userId: string, topicIds: string[]): Promise<void> {
    // This would be called to pre-populate cache with frequently accessed data
    // Implementation would depend on specific warming strategies
    console.log(`Warming cache for user ${userId} with topics:`, topicIds);
  }

  // Cache cleanup
  async cleanup(): Promise<{
    deletedKeys: number;
    errors: string[];
  }> {
    let deletedKeys = 0;
    const errors: string[] = [];

    try {
      // Clean up expired or stale cache entries
      for (const prefix of Object.values(CACHE_KEYS)) {
        try {
          const keys = await redisCache.keys(`${prefix}:*`);
          // In a real implementation, you might check timestamps or other criteria
          // For now, we'll just count the keys
          console.log(`Found ${keys.length} keys with prefix ${prefix}`);
        } catch (error) {
          errors.push(`Error cleaning prefix ${prefix}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`General cleanup error: ${error}`);
    }

    return { deletedKeys, errors };
  }
}

// Export singleton instance
export const cacheService = new CacheService();