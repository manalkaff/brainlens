import type { TopicResearchResult } from "./aiLearningAgent";
import { prisma } from "wasp/server";

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
  popularTopics: Array<{ topic: string; accessCount: number }>;
  [key: string]: any;
}

export class IntelligentCacheManager {
  private readonly CACHE_TTL_DAYS = 7;
  private readonly MAX_CACHE_ENTRIES = 10000;
  private readonly CLEANUP_BATCH_SIZE = 100;

  /**
   * Recursively ensure all timestamp properties are Date objects
   */
  private ensureTimestampsAreObjects(obj: any): any {
    if (!obj) return obj;
    
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.ensureTimestampsAreObjects(item));
    }
    
    if (typeof obj === 'object') {
      const result = { ...obj };
      for (const key in result) {
        if (key === 'timestamp' || key.toLowerCase().includes('timestamp')) {
          if (typeof result[key] === 'string') {
            result[key] = new Date(result[key]);
          }
        } else {
          result[key] = this.ensureTimestampsAreObjects(result[key]);
        }
      }
      return result;
    }
    
    return obj;
  }
  
  // In-memory cache for frequently accessed items
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MEMORY_CACHE_SIZE = 100;
  private memoryCacheWarmedUp = false;

  /**
   * Warm up memory cache with frequently accessed items
   */
  private async warmupMemoryCache(): Promise<void> {
    if (this.memoryCacheWarmedUp) return;
    
    try {
      console.log('🔥 Warming up memory cache...');
      
      // Get most recently accessed cache entries
      const recentEntries = await prisma.generatedContent.findMany({
        where: {
          contentType: 'cache'
        },
        orderBy: { lastAccess: 'desc' },
        take: Math.min(this.MEMORY_CACHE_SIZE / 2, 50) // Warm up with half the memory cache size
      });

      let warmedCount = 0;
      for (const entry of recentEntries) {
        const metadata = entry.metadata as any;
        if (metadata.cacheKey && metadata.researchResult) {
          const cacheEntry: CacheEntry = {
            key: metadata.cacheKey,
            data: this.ensureTimestampsAreObjects(metadata.researchResult),
            timestamp: new Date(metadata.cacheTimestamp || entry.createdAt),
            accessCount: metadata.accessCount || 1,
            lastAccess: new Date(metadata.lastAccess || entry.createdAt)
          };

          if (this.isCacheValid(cacheEntry.timestamp, this.CACHE_TTL_DAYS)) {
            this.memoryCache.set(metadata.cacheKey, cacheEntry);
            warmedCount++;
          }
        }
      }

      this.memoryCacheWarmedUp = true;
      console.log(`🔥 Memory cache warmed up with ${warmedCount} entries`);
      
    } catch (error) {
      console.error('Memory cache warmup failed:', error);
      this.memoryCacheWarmedUp = true; // Don't keep trying if it fails
    }
  }

  /**
   * Get cached content with intelligent retrieval
   */
  async getCachedContent(key: string): Promise<TopicResearchResult | null> {
    try {
      // Ensure memory cache is warmed up
      await this.warmupMemoryCache();
      
      // Check memory cache first
      const memoryCached = this.memoryCache.get(key);
      if (memoryCached && this.isCacheValid(memoryCached.timestamp, this.CACHE_TTL_DAYS)) {
        memoryCached.accessCount++;
        memoryCached.lastAccess = new Date();
        console.log(`🚀 Memory cache hit for: ${key}`);
        return memoryCached.data;
      }

      // Check database cache
      const cached = await this.getCachedFromDatabase(key);
      if (cached && this.isCacheValid(cached.timestamp, this.CACHE_TTL_DAYS)) {
        // Add to memory cache for faster future access
        this.addToMemoryCache(key, cached);
        
        // Update access statistics
        await this.updateAccessStats(key);
        
        console.log(`💾 Database cache hit for: ${key}`);
        return cached.data;
      }

      console.log(`❌ Cache miss for: ${key}`);
      return null;
      
    } catch (error) {
      console.error(`Cache retrieval error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Store content in cache with intelligent management
   */
  async setCachedContent(key: string, data: TopicResearchResult): Promise<void> {
    try {
      const cacheEntry: CacheEntry = {
        key,
        data,
        timestamp: new Date(),
        accessCount: 1,
        lastAccess: new Date()
      };

      // Store in database
      await this.storeCacheInDatabase(cacheEntry);
      
      // Add to memory cache
      this.addToMemoryCache(key, cacheEntry);
      
      // Trigger cleanup if needed (run asynchronously)
      this.performCleanupIfNeeded().catch(error => 
        console.error("Background cache cleanup failed:", error)
      );
      
      console.log(`💾 Cached content for: ${key}`);
      
    } catch (error) {
      console.error(`Cache storage error for key ${key}:`, error);
      // Don't throw - cache failures shouldn't break the main flow
    }
  }

  /**
   * Check if cache entry is valid based on TTL
   */
  isCacheValid(timestamp: Date | string, ttlDays: number): boolean {
    let timestampMs: number;
    
    if (timestamp instanceof Date) {
      timestampMs = timestamp.getTime();
    } else if (typeof timestamp === 'string') {
      timestampMs = new Date(timestamp).getTime();
    } else {
      console.warn('Invalid timestamp type:', typeof timestamp);
      return false; // Invalid timestamp, consider cache invalid
    }
    
    const ageMs = Date.now() - timestampMs;
    const maxAgeMs = ttlDays * 24 * 60 * 60 * 1000;
    return ageMs < maxAgeMs;
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      // Get total entries
      const totalEntries = await this.getTotalCacheEntries();
      
      // Calculate expired entries
      const expiredEntries = await this.getExpiredEntries();
      
      // Get popular topics
      const popularTopics = await this.getPopularTopics(10);
      
      // Calculate hit rate (simplified - would need request tracking for accurate rate)
      const hitRate = this.calculateApproximateHitRate();
      
      // Calculate average age
      const averageAge = await this.calculateAverageAge();

      return {
        totalEntries,
        hitRate,
        averageAge,
        expiredEntries,
        popularTopics
      };
      
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {
        totalEntries: 0,
        hitRate: 0,
        averageAge: 0,
        expiredEntries: 0,
        popularTopics: []
      };
    }
  }

  /**
   * Manually invalidate cache for a specific key
   */
  async invalidateCache(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      
      // Remove from database cache
      await this.deleteCacheFromDatabase(key);
      
      console.log(`🗑️ Invalidated cache for: ${key}`);
      
    } catch (error) {
      console.error(`Cache invalidation error for key ${key}:`, error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const expiredCount = await this.deleteExpiredEntries();
      console.log(`🧹 Cleaned up ${expiredCount} expired cache entries`);
      return expiredCount;
    } catch (error) {
      console.error("Cache cleanup failed:", error);
      return 0;
    }
  }

  // Private methods for database operations
  private async getCachedFromDatabase(key: string): Promise<CacheEntry | null> {
    try {
      const result = await prisma.generatedContent.findFirst({
        where: {
          metadata: {
            path: ["cacheKey"],
            equals: key
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (result && result.metadata) {
        const metadata = result.metadata as any;
        if (metadata.researchResult) {
          // Ensure all timestamps (including nested ones) are properly handled
          const researchResult = this.ensureTimestampsAreObjects(metadata.researchResult);
          
          return {
            key,
            data: researchResult,
            timestamp: new Date(metadata.cacheTimestamp || result.createdAt),
            accessCount: metadata.accessCount || 1,
            lastAccess: new Date(metadata.lastAccess || result.createdAt)
          };
        }
      }

      return null;
      
    } catch (error) {
      console.error("Database cache retrieval error:", error);
      return null;
    }
  }

  private async storeCacheInDatabase(entry: CacheEntry): Promise<void> {
    try {
      // Create a cache table instead of using GeneratedContent with invalid foreign key
      // For now, we'll use a simple approach - create a dummy topic for cache entries
      const cacheTopicSlug = "cache-" + entry.key;
      
      // First, ensure cache topic exists and get the actual topic ID
      const cacheTopic = await prisma.topic.upsert({
        where: { slug: cacheTopicSlug },
        update: {},
        create: {
          slug: cacheTopicSlug,
          title: `Cache: ${entry.key}`,
          summary: "Cache entry",
          depth: 0,
          status: 'COMPLETED',
          cacheStatus: 'FRESH',
          metadata: { isCache: true } as any
        }
      });

      // Then store the cache data using the actual topic ID
      await prisma.generatedContent.upsert({
        where: {
          topicId_contentType_userLevel_learningStyle: {
            topicId: cacheTopic.id, // Use the actual topic ID, not the slug
            contentType: "cache",
            userLevel: "cache",
            learningStyle: "cache"
          }
        },
        update: {
          content: "", // No actual content for cache entries
          metadata: {
            cacheKey: entry.key,
            researchResult: JSON.parse(JSON.stringify(entry.data)),
            accessCount: entry.accessCount,
            lastAccess: entry.lastAccess.toISOString(),
            cacheTimestamp: entry.timestamp.toISOString()
          } as any
        },
        create: {
          topicId: cacheTopic.id, // Use the actual topic ID, not the slug
          contentType: "cache",
          content: "",
          metadata: {
            cacheKey: entry.key,
            researchResult: JSON.parse(JSON.stringify(entry.data)),
            accessCount: entry.accessCount,
            lastAccess: entry.lastAccess.toISOString(),
            cacheTimestamp: entry.timestamp.toISOString()
          } as any,
          userLevel: "cache",
          learningStyle: "cache"
        }
      });
    } catch (error) {
      console.error("Database cache storage error:", error);
      throw error;
    }
  }

  private async updateAccessStats(key: string): Promise<void> {
    try {
      await prisma.generatedContent.updateMany({
        where: {
          metadata: {
            path: ["cacheKey"],
            equals: key
          }
        },
        data: {
          metadata: {
            // This would need to be handled more carefully in production
            // as it requires reading the current metadata first
          }
        }
      });
    } catch (error) {
      console.error("Access stats update error:", error);
      // Don't throw - this is not critical
    }
  }

  private async deleteCacheFromDatabase(key: string): Promise<void> {
    try {
      const cacheTopicSlug = "cache-" + key;
      
      // Find the cache topic first
      const cacheTopic = await prisma.topic.findUnique({
        where: { slug: cacheTopicSlug }
      });
      
      if (cacheTopic) {
        // Delete cache content using the actual topic ID
        await prisma.generatedContent.deleteMany({
          where: {
            topicId: cacheTopic.id,
            contentType: "cache"
          }
        });
        
        // Delete cache topic
        await prisma.topic.delete({
          where: { id: cacheTopic.id }
        });
      }
    } catch (error) {
      console.error("Database cache deletion error:", error);
      throw error;
    }
  }

  // Memory cache management
  private addToMemoryCache(key: string, entry: CacheEntry): void {
    // If memory cache is full, remove least recently used item
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }
    
    this.memoryCache.set(key, entry);
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestAccess = new Date();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      console.log(`🗑️ Evicted LRU item from memory cache: ${oldestKey}`);
    }
  }

  // Statistics and monitoring
  private async getTotalCacheEntries(): Promise<number> {
    try {
      return await prisma.topic.count({
        where: {
          metadata: {
            path: ["isCache"],
            equals: true
          }
        }
      });
    } catch (error) {
      console.error("Error getting total cache entries:", error);
      return 0;
    }
  }

  private async getExpiredEntries(): Promise<number> {
    try {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - this.CACHE_TTL_DAYS);
      
      return await prisma.topic.count({
        where: {
          metadata: {
            path: ["isCache"],
            equals: true
          },
          createdAt: { lt: expireDate }
        }
      });
    } catch (error) {
      console.error("Error getting expired entries:", error);
      return 0;
    }
  }

  private async getPopularTopics(limit: number): Promise<Array<{ topic: string; accessCount: number }>> {
    try {
      // This would need more sophisticated querying in production
      // For now, return empty array
      return [];
    } catch (error) {
      console.error("Error getting popular topics:", error);
      return [];
    }
  }

  private calculateApproximateHitRate(): number {
    // Simplified calculation based on memory cache
    // In production, you'd track actual requests
    return 0.7; // Placeholder
  }

  private async calculateAverageAge(): Promise<number> {
    try {
      const cacheEntries = await prisma.topic.findMany({
        where: {
          metadata: {
            path: ["isCache"],
            equals: true
          }
        },
        select: { createdAt: true }
      });

      if (cacheEntries.length === 0) return 0;

      const now = Date.now();
      const totalAge = cacheEntries.reduce((sum, entry) => {
        return sum + (now - entry.createdAt.getTime());
      }, 0);

      return totalAge / cacheEntries.length / (1000 * 60 * 60 * 24); // Return in days
    } catch (error) {
      console.error("Error calculating average age:", error);
      return 0;
    }
  }

  // Cleanup operations
  private async performCleanupIfNeeded(): Promise<void> {
    const totalEntries = await this.getTotalCacheEntries();
    
    if (totalEntries > this.MAX_CACHE_ENTRIES) {
      console.log(`🧹 Cache size (${totalEntries}) exceeds limit, starting cleanup...`);
      await this.cleanupExpiredEntries();
      
      // If still over limit after cleanup, remove oldest entries
      const remainingEntries = await this.getTotalCacheEntries();
      if (remainingEntries > this.MAX_CACHE_ENTRIES) {
        await this.removeOldestEntries(remainingEntries - this.MAX_CACHE_ENTRIES);
      }
    }
  }

  private async deleteExpiredEntries(): Promise<number> {
    try {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - this.CACHE_TTL_DAYS);
      
      // Find expired cache topics
      const expiredCacheTopics = await prisma.topic.findMany({
        where: {
          metadata: {
            path: ["isCache"],
            equals: true
          },
          createdAt: { lt: expireDate }
        },
        select: { id: true, slug: true }
      });

      let deletedCount = 0;

      // Delete expired cache entries
      for (const cacheEntry of expiredCacheTopics) {
        // Delete content first
        await prisma.generatedContent.deleteMany({
          where: {
            topicId: cacheEntry.id,
            contentType: "cache"
          }
        });
        
        // Delete topic
        await prisma.topic.delete({
          where: { id: cacheEntry.id }
        });
        
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error("Error deleting expired entries:", error);
      return 0;
    }
  }

  private async removeOldestEntries(count: number): Promise<number> {
    try {
      const oldestCacheTopics = await prisma.topic.findMany({
        where: {
          metadata: {
            path: ["isCache"],
            equals: true
          }
        },
        orderBy: { createdAt: 'asc' },
        take: count,
        select: { id: true }
      });

      let deletedCount = 0;

      for (const cacheEntry of oldestCacheTopics) {
        // Delete content first
        await prisma.generatedContent.deleteMany({
          where: {
            topicId: cacheEntry.id,
            contentType: "cache"
          }
        });
        
        // Delete topic
        await prisma.topic.delete({
          where: { id: cacheEntry.id }
        });
        
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error("Error removing oldest entries:", error);
      return 0;
    }
  }
}

// Export singleton instance and convenience functions
export const cacheManager = new IntelligentCacheManager();

// Convenience functions for use throughout the application
export const getCachedContent = (key: string) => cacheManager.getCachedContent(key);
export const setCachedContent = (key: string, data: TopicResearchResult) => cacheManager.setCachedContent(key, data);
export const isCacheValid = (timestamp: Date | string, ttlDays: number) => cacheManager.isCacheValid(timestamp, ttlDays);
export const invalidateCache = (key: string) => cacheManager.invalidateCache(key);
export const getCacheStats = () => cacheManager.getCacheStats();
export const cleanupExpiredEntries = () => cacheManager.cleanupExpiredEntries();