/**
 * Browser-side caching utilities for static learning content and assets
 */
// Cache configuration
const CACHE_CONFIG = {
    TOPIC_CONTENT: {
        name: 'learning-topic-content',
        version: 'v1',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 50 * 1024 * 1024, // 50MB
    },
    SEARCH_RESULTS: {
        name: 'learning-search-results',
        version: 'v1',
        maxAge: 30 * 60 * 1000, // 30 minutes
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    USER_PROGRESS: {
        name: 'learning-user-progress',
        version: 'v1',
        maxAge: 15 * 60 * 1000, // 15 minutes
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    GENERATED_CONTENT: {
        name: 'learning-generated-content',
        version: 'v1',
        maxAge: 60 * 60 * 1000, // 1 hour
        maxSize: 20 * 1024 * 1024, // 20MB
    }
};
class BrowserCacheManager {
    storage;
    memoryCache = new Map();
    constructor() {
        // Use localStorage as fallback if available
        this.storage = typeof window !== 'undefined' ? window.localStorage : {
            length: 0,
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
            clear: () => { },
            key: () => null
        };
    }
    /**
     * Generate cache key with namespace
     */
    getCacheKey(namespace, key) {
        return `${namespace}:${key}`;
    }
    /**
     * Calculate approximate size of data in bytes
     */
    calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }
    /**
     * Check if cache entry is expired
     */
    isExpired(entry, maxAge) {
        return Date.now() - entry.timestamp > maxAge;
    }
    /**
     * Get item from cache (memory first, then localStorage)
     */
    async get(namespace, key, maxAge) {
        const cacheKey = this.getCacheKey(namespace, key);
        // Check memory cache first
        const memoryEntry = this.memoryCache.get(cacheKey);
        if (memoryEntry && !this.isExpired(memoryEntry, maxAge)) {
            return memoryEntry.data;
        }
        // Check localStorage
        try {
            const stored = this.storage.getItem(cacheKey);
            if (stored) {
                const entry = JSON.parse(stored);
                if (!this.isExpired(entry, maxAge)) {
                    // Move to memory cache for faster access
                    this.memoryCache.set(cacheKey, entry);
                    return entry.data;
                }
                else {
                    // Remove expired entry
                    this.storage.removeItem(cacheKey);
                }
            }
        }
        catch (error) {
            console.warn('Failed to read from localStorage cache:', error);
        }
        return null;
    }
    /**
     * Set item in cache (both memory and localStorage)
     */
    async set(namespace, key, data, maxSize) {
        const cacheKey = this.getCacheKey(namespace, key);
        const size = this.calculateSize(data);
        // Skip if data is too large
        if (size > maxSize) {
            console.warn(`Data too large for cache: ${size} bytes > ${maxSize} bytes`);
            return false;
        }
        const entry = {
            data,
            timestamp: Date.now(),
            size,
            key: cacheKey
        };
        // Set in memory cache
        this.memoryCache.set(cacheKey, entry);
        // Set in localStorage
        try {
            this.storage.setItem(cacheKey, JSON.stringify(entry));
            return true;
        }
        catch (error) {
            console.warn('Failed to write to localStorage cache:', error);
            // If localStorage is full, try to clear some space
            await this.cleanup(namespace, maxSize);
            try {
                this.storage.setItem(cacheKey, JSON.stringify(entry));
                return true;
            }
            catch (retryError) {
                console.error('Failed to cache after cleanup:', retryError);
                return false;
            }
        }
    }
    /**
     * Remove item from cache
     */
    async remove(namespace, key) {
        const cacheKey = this.getCacheKey(namespace, key);
        this.memoryCache.delete(cacheKey);
        this.storage.removeItem(cacheKey);
    }
    /**
     * Clear all items in a namespace
     */
    async clear(namespace) {
        const prefix = `${namespace}:`;
        // Clear from memory cache
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                this.memoryCache.delete(key);
            }
        }
        // Clear from localStorage
        try {
            const keysToRemove = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => this.storage.removeItem(key));
        }
        catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }
    }
    /**
     * Cleanup expired entries and enforce size limits
     */
    async cleanup(namespace, maxSize) {
        const prefix = `${namespace}:`;
        const entries = [];
        let totalSize = 0;
        // Collect all entries for this namespace
        try {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(prefix)) {
                    const stored = this.storage.getItem(key);
                    if (stored) {
                        try {
                            const entry = JSON.parse(stored);
                            entries.push({ key, entry });
                            totalSize += entry.size;
                        }
                        catch (parseError) {
                            // Remove corrupted entries
                            this.storage.removeItem(key);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to collect cache entries for cleanup:', error);
            return;
        }
        // Remove expired entries
        const now = Date.now();
        const maxAge = CACHE_CONFIG.TOPIC_CONTENT.maxAge; // Use default max age
        for (const { key, entry } of entries) {
            if (this.isExpired(entry, maxAge)) {
                this.storage.removeItem(key);
                this.memoryCache.delete(key);
                totalSize -= entry.size;
            }
        }
        // If still over size limit, remove oldest entries
        if (totalSize > maxSize) {
            const validEntries = entries
                .filter(({ entry }) => !this.isExpired(entry, maxAge))
                .sort((a, b) => a.entry.timestamp - b.entry.timestamp);
            while (totalSize > maxSize && validEntries.length > 0) {
                const oldest = validEntries.shift();
                this.storage.removeItem(oldest.key);
                this.memoryCache.delete(oldest.key);
                totalSize -= oldest.entry.size;
            }
        }
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        const stats = {
            memoryEntries: this.memoryCache.size,
            localStorageEntries: 0,
            totalSize: 0,
            namespaces: {}
        };
        try {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.includes(':')) {
                    const namespace = key.split(':')[0];
                    const stored = this.storage.getItem(key);
                    if (stored) {
                        try {
                            const entry = JSON.parse(stored);
                            stats.localStorageEntries++;
                            stats.totalSize += entry.size;
                            if (!stats.namespaces[namespace]) {
                                stats.namespaces[namespace] = { entries: 0, size: 0 };
                            }
                            stats.namespaces[namespace].entries++;
                            stats.namespaces[namespace].size += entry.size;
                        }
                        catch (parseError) {
                            // Skip corrupted entries
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to calculate cache stats:', error);
        }
        return stats;
    }
}
// Singleton instance
const browserCache = new BrowserCacheManager();
/**
 * Topic content caching
 */
export const topicContentCache = {
    async get(key) {
        return browserCache.get(CACHE_CONFIG.TOPIC_CONTENT.name, key, CACHE_CONFIG.TOPIC_CONTENT.maxAge);
    },
    async set(key, data) {
        return browserCache.set(CACHE_CONFIG.TOPIC_CONTENT.name, key, data, CACHE_CONFIG.TOPIC_CONTENT.maxSize);
    },
    async remove(key) {
        return browserCache.remove(CACHE_CONFIG.TOPIC_CONTENT.name, key);
    },
    async clear() {
        return browserCache.clear(CACHE_CONFIG.TOPIC_CONTENT.name);
    }
};
/**
 * Search results caching
 */
export const searchResultsCache = {
    async get(key) {
        return browserCache.get(CACHE_CONFIG.SEARCH_RESULTS.name, key, CACHE_CONFIG.SEARCH_RESULTS.maxAge);
    },
    async set(key, data) {
        return browserCache.set(CACHE_CONFIG.SEARCH_RESULTS.name, key, data, CACHE_CONFIG.SEARCH_RESULTS.maxSize);
    },
    async remove(key) {
        return browserCache.remove(CACHE_CONFIG.SEARCH_RESULTS.name, key);
    },
    async clear() {
        return browserCache.clear(CACHE_CONFIG.SEARCH_RESULTS.name);
    }
};
/**
 * User progress caching
 */
export const userProgressCache = {
    async get(key) {
        return browserCache.get(CACHE_CONFIG.USER_PROGRESS.name, key, CACHE_CONFIG.USER_PROGRESS.maxAge);
    },
    async set(key, data) {
        return browserCache.set(CACHE_CONFIG.USER_PROGRESS.name, key, data, CACHE_CONFIG.USER_PROGRESS.maxSize);
    },
    async remove(key) {
        return browserCache.remove(CACHE_CONFIG.USER_PROGRESS.name, key);
    },
    async clear() {
        return browserCache.clear(CACHE_CONFIG.USER_PROGRESS.name);
    }
};
/**
 * Generated content caching
 */
export const generatedContentCache = {
    async get(key) {
        return browserCache.get(CACHE_CONFIG.GENERATED_CONTENT.name, key, CACHE_CONFIG.GENERATED_CONTENT.maxAge);
    },
    async set(key, data) {
        return browserCache.set(CACHE_CONFIG.GENERATED_CONTENT.name, key, data, CACHE_CONFIG.GENERATED_CONTENT.maxSize);
    },
    async remove(key) {
        return browserCache.remove(CACHE_CONFIG.GENERATED_CONTENT.name, key);
    },
    async clear() {
        return browserCache.clear(CACHE_CONFIG.GENERATED_CONTENT.name);
    }
};
/**
 * Cache management utilities
 */
export const cacheManager = {
    async clearAll() {
        await Promise.all([
            topicContentCache.clear(),
            searchResultsCache.clear(),
            userProgressCache.clear(),
            generatedContentCache.clear()
        ]);
    },
    async getStats() {
        return browserCache.getStats();
    },
    async cleanup() {
        await Promise.all([
            browserCache.cleanup(CACHE_CONFIG.TOPIC_CONTENT.name, CACHE_CONFIG.TOPIC_CONTENT.maxSize),
            browserCache.cleanup(CACHE_CONFIG.SEARCH_RESULTS.name, CACHE_CONFIG.SEARCH_RESULTS.maxSize),
            browserCache.cleanup(CACHE_CONFIG.USER_PROGRESS.name, CACHE_CONFIG.USER_PROGRESS.maxSize),
            browserCache.cleanup(CACHE_CONFIG.GENERATED_CONTENT.name, CACHE_CONFIG.GENERATED_CONTENT.maxSize)
        ]);
    }
};
// Auto-cleanup on page load
if (typeof window !== 'undefined') {
    // Run cleanup on page load
    window.addEventListener('load', () => {
        cacheManager.cleanup().catch(console.error);
    });
    // Run cleanup before page unload
    window.addEventListener('beforeunload', () => {
        cacheManager.cleanup().catch(console.error);
    });
}
//# sourceMappingURL=browserCache.js.map