import type { TopicResearchResult } from "./aiLearningAgent";
/**
 * Intelligent Caching System for Research Results
 * Implements 1-week TTL with smart cache management
 */
export interface CacheEntry {
    key: string;
    data: TopicResearchResult;
    timestamp: Date;
    accessCount: number;
    lastAccess: Date;
}
export interface CacheStats {
    totalEntries: number;
    hitRate: number;
    averageAge: number;
    expiredEntries: number;
    popularTopics: Array<{
        topic: string;
        accessCount: number;
    }>;
    [key: string]: any;
}
export declare class IntelligentCacheManager {
    private readonly CACHE_TTL_DAYS;
    private readonly MAX_CACHE_ENTRIES;
    private readonly CLEANUP_BATCH_SIZE;
    /**
     * Recursively ensure all timestamp properties are Date objects
     */
    private ensureTimestampsAreObjects;
    private memoryCache;
    private readonly MEMORY_CACHE_SIZE;
    private memoryCacheWarmedUp;
    /**
     * Warm up memory cache with frequently accessed items
     */
    private warmupMemoryCache;
    /**
     * Get cached content with intelligent retrieval
     */
    getCachedContent(key: string): Promise<TopicResearchResult | null>;
    /**
     * Store content in cache with intelligent management
     */
    setCachedContent(key: string, data: TopicResearchResult): Promise<void>;
    /**
     * Check if cache entry is valid based on TTL
     */
    isCacheValid(timestamp: Date | string, ttlDays: number): boolean;
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats(): Promise<CacheStats>;
    /**
     * Manually invalidate cache for a specific key
     */
    invalidateCache(key: string): Promise<void>;
    /**
     * Clean up expired cache entries
     */
    cleanupExpiredEntries(): Promise<number>;
    private getCachedFromDatabase;
    private storeCacheInDatabase;
    private updateAccessStats;
    private deleteCacheFromDatabase;
    private addToMemoryCache;
    private evictLeastRecentlyUsed;
    private getTotalCacheEntries;
    private getExpiredEntries;
    private getPopularTopics;
    private calculateApproximateHitRate;
    private calculateAverageAge;
    private performCleanupIfNeeded;
    private deleteExpiredEntries;
    private removeOldestEntries;
}
export declare const cacheManager: IntelligentCacheManager;
export declare const getCachedContent: (key: string) => Promise<TopicResearchResult | null>;
export declare const setCachedContent: (key: string, data: TopicResearchResult) => Promise<void>;
export declare const isCacheValid: (timestamp: Date | string, ttlDays: number) => boolean;
export declare const invalidateCache: (key: string) => Promise<void>;
export declare const getCacheStats: () => Promise<CacheStats>;
export declare const cleanupExpiredEntries: () => Promise<number>;
//# sourceMappingURL=cachingSystem.d.ts.map