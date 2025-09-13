import { redisCache } from './redisClient';
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
};
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
};
export class CacheService {
    // Topic caching
    async getTopic(topicId) {
        const key = `${CACHE_KEYS.TOPIC}:id:${topicId}`;
        return await redisCache.get(key);
    }
    async setTopic(topic) {
        // Cache by both ID and slug for flexible lookups
        const idKey = `${CACHE_KEYS.TOPIC}:id:${topic.id}`;
        const slugKey = `${CACHE_KEYS.TOPIC}:slug:${topic.slug}`;
        await Promise.all([
            redisCache.set(idKey, topic, CACHE_TTL.TOPIC),
            redisCache.set(slugKey, topic, CACHE_TTL.TOPIC)
        ]);
    }
    async getTopicBySlug(slug) {
        const key = `${CACHE_KEYS.TOPIC}:slug:${slug}`;
        return await redisCache.get(key);
    }
    async invalidateTopic(topicId, topicSlug) {
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
    async getTopicTree(rootTopicId) {
        const key = `${CACHE_KEYS.TOPIC_TREE}:id:${rootTopicId}`;
        return await redisCache.get(key);
    }
    async setTopicTree(rootTopicId, tree) {
        const key = `${CACHE_KEYS.TOPIC_TREE}:id:${rootTopicId}`;
        await redisCache.set(key, tree, CACHE_TTL.TOPIC_TREE);
    }
    async invalidateTopicTree(topicId) {
        // Invalidate all topic trees that might contain this topic
        const pattern = `${CACHE_KEYS.TOPIC_TREE}:*`;
        await redisCache.flushPattern(pattern);
    }
    // User progress caching
    async getUserProgress(userId, topicId) {
        const key = `${CACHE_KEYS.USER_PROGRESS}:${userId}:${topicId}`;
        return await redisCache.get(key);
    }
    async setUserProgress(progress) {
        const key = `${CACHE_KEYS.USER_PROGRESS}:${progress.userId}:${progress.topicId}`;
        await redisCache.set(key, progress, CACHE_TTL.USER_PROGRESS);
    }
    async invalidateUserProgress(userId, topicId) {
        if (topicId) {
            const key = `${CACHE_KEYS.USER_PROGRESS}:${userId}:${topicId}`;
            await redisCache.del(key);
        }
        else {
            const pattern = `${CACHE_KEYS.USER_PROGRESS}:${userId}:*`;
            await redisCache.flushPattern(pattern);
        }
    }
    async invalidateUserProgressForTopic(topicId) {
        const pattern = `${CACHE_KEYS.USER_PROGRESS}:*:${topicId}`;
        await redisCache.flushPattern(pattern);
    }
    // Vector embedding caching
    async getVectorEmbedding(content) {
        // Create a hash of the content for the cache key
        const contentHash = this.hashString(content);
        const key = `${CACHE_KEYS.VECTOR_EMBEDDING}:${contentHash}`;
        return await redisCache.get(key);
    }
    async setVectorEmbedding(content, embedding) {
        const contentHash = this.hashString(content);
        const key = `${CACHE_KEYS.VECTOR_EMBEDDING}:${contentHash}`;
        await redisCache.set(key, embedding, CACHE_TTL.VECTOR_EMBEDDING);
    }
    // Search result caching
    async getSearchResults(query, topicId, options) {
        const optionsHash = this.hashString(JSON.stringify(options));
        const key = `${CACHE_KEYS.SEARCH_RESULT}:${topicId}:${this.hashString(query)}:${optionsHash}`;
        return await redisCache.get(key);
    }
    async setSearchResults(query, topicId, options, results) {
        const optionsHash = this.hashString(JSON.stringify(options));
        const key = `${CACHE_KEYS.SEARCH_RESULT}:${topicId}:${this.hashString(query)}:${optionsHash}`;
        await redisCache.set(key, results, CACHE_TTL.SEARCH_RESULT);
    }
    async invalidateSearchResults(topicId) {
        const pattern = topicId
            ? `${CACHE_KEYS.SEARCH_RESULT}:${topicId}:*`
            : `${CACHE_KEYS.SEARCH_RESULT}:*`;
        await redisCache.flushPattern(pattern);
    }
    // Chat thread caching
    async getChatThread(threadId) {
        const key = `${CACHE_KEYS.CHAT_THREAD}:${threadId}`;
        return await redisCache.get(key);
    }
    async setChatThread(thread) {
        const key = `${CACHE_KEYS.CHAT_THREAD}:${thread.id}`;
        await redisCache.set(key, thread, CACHE_TTL.CHAT_THREAD);
    }
    async invalidateChatThread(threadId) {
        const key = `${CACHE_KEYS.CHAT_THREAD}:${threadId}`;
        await redisCache.del(key);
    }
    // Quiz caching
    async getQuiz(quizId) {
        const key = `${CACHE_KEYS.QUIZ}:${quizId}`;
        return await redisCache.get(key);
    }
    async setQuiz(quiz) {
        const key = `${CACHE_KEYS.QUIZ}:${quiz.id}`;
        await redisCache.set(key, quiz, CACHE_TTL.QUIZ);
    }
    async invalidateQuiz(quizId) {
        const key = `${CACHE_KEYS.QUIZ}:${quizId}`;
        await redisCache.del(key);
    }
    // Content generation caching
    async getGeneratedContent(prompt, model) {
        const promptHash = this.hashString(`${model}:${prompt}`);
        const key = `${CACHE_KEYS.CONTENT_GENERATION}:${promptHash}`;
        return await redisCache.get(key);
    }
    async setGeneratedContent(prompt, model, content) {
        const promptHash = this.hashString(`${model}:${prompt}`);
        const key = `${CACHE_KEYS.CONTENT_GENERATION}:${promptHash}`;
        await redisCache.set(key, content, CACHE_TTL.CONTENT_GENERATION);
    }
    // Research status caching
    async getResearchStatus(topicId) {
        const key = `${CACHE_KEYS.RESEARCH_STATUS}:${topicId}`;
        return await redisCache.get(key);
    }
    async setResearchStatus(topicId, status) {
        const key = `${CACHE_KEYS.RESEARCH_STATUS}:${topicId}`;
        await redisCache.set(key, status, CACHE_TTL.RESEARCH_STATUS);
    }
    async invalidateResearchStatus(topicId) {
        const key = `${CACHE_KEYS.RESEARCH_STATUS}:${topicId}`;
        await redisCache.del(key);
    }
    // API rate limiting
    async checkRateLimit(identifier, limit, windowSeconds) {
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
    async invalidateUserCache(userId) {
        await Promise.all([
            this.invalidateUserProgress(userId),
            redisCache.flushPattern(`${CACHE_KEYS.CHAT_THREAD}:*:${userId}`),
            redisCache.flushPattern(`${CACHE_KEYS.QUIZ}:*:${userId}`),
        ]);
    }
    async invalidateTopicCache(topicId) {
        await Promise.all([
            this.invalidateTopic(topicId),
            this.invalidateSearchResults(topicId),
            this.invalidateResearchStatus(topicId),
        ]);
    }
    // Utility methods
    hashString(str) {
        let hash = 0;
        if (str.length === 0)
            return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    // Health check
    async healthCheck() {
        const redis = redisCache.isReady();
        let totalKeys = 0;
        const keysByPrefix = {};
        if (redis) {
            try {
                for (const prefix of Object.values(CACHE_KEYS)) {
                    const keys = await redisCache.keys(`${prefix}:*`);
                    keysByPrefix[prefix] = keys.length;
                    totalKeys += keys.length;
                }
            }
            catch (error) {
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
    async warmCache(userId, topicIds) {
        // This would be called to pre-populate cache with frequently accessed data
        // Implementation would depend on specific warming strategies
        console.log(`Warming cache for user ${userId} with topics:`, topicIds);
    }
    // Cache cleanup
    async cleanup() {
        let deletedKeys = 0;
        const errors = [];
        try {
            // Clean up expired or stale cache entries
            for (const prefix of Object.values(CACHE_KEYS)) {
                try {
                    const keys = await redisCache.keys(`${prefix}:*`);
                    // In a real implementation, you might check timestamps or other criteria
                    // For now, we'll just count the keys
                    console.log(`Found ${keys.length} keys with prefix ${prefix}`);
                }
                catch (error) {
                    errors.push(`Error cleaning prefix ${prefix}: ${error}`);
                }
            }
        }
        catch (error) {
            errors.push(`General cleanup error: ${error}`);
        }
        return { deletedKeys, errors };
    }
}
// Export singleton instance
export const cacheService = new CacheService();
//# sourceMappingURL=cacheService.js.map