/**
 * Memory management for long-running learning sessions
 * Implements garbage collection, memory monitoring, and resource cleanup
 */
class MemoryManager {
    entries = new Map();
    accessLog = new Map();
    compressionCache = new Map();
    config;
    stats = {
        totalEntries: 0,
        totalSize: 0,
        usedMemory: 0,
        availableMemory: 0,
        gcRuns: 0,
        lastGcTime: 0,
        hitRate: 0,
        averageEntrySize: 0
    };
    gcInterval = null;
    memoryMonitorInterval = null;
    alertCallbacks = new Set();
    hits = 0;
    requests = 0;
    // Default configuration
    DEFAULT_CONFIG = {
        maxMemoryMB: 100, // 100MB max memory usage
        maxEntries: 10000, // Maximum number of entries
        gcThresholdMB: 80, // Run GC when memory usage exceeds 80MB
        gcInterval: 30000, // Run GC every 30 seconds
        maxAge: 30 * 60 * 1000, // 30 minutes max age
        minAccessCount: 2, // Minimum access count to keep entry
        compressionThreshold: 10 * 1024, // Compress entries larger than 10KB
    };
    constructor(config = {}) {
        this.config = { ...this.DEFAULT_CONFIG, ...config };
        this.startGarbageCollection();
        this.startMemoryMonitoring();
        this.setupPerformanceObserver();
    }
    /**
     * Store data in memory with automatic management
     */
    set(id, data, type = 'cache', priority = 'medium') {
        try {
            const size = this.calculateSize(data);
            const now = Date.now();
            // Check if we need to run GC before adding
            if (this.shouldRunGC()) {
                this.runGarbageCollection();
            }
            // Check if we still have space after GC
            if (this.stats.totalSize + size > this.config.maxMemoryMB * 1024 * 1024) {
                this.alertMemoryPressure('critical', 'Memory limit exceeded, cannot store new data');
                return false;
            }
            // Compress large entries
            let finalData = data;
            let compressed = false;
            if (size > this.config.compressionThreshold) {
                try {
                    finalData = this.compressData(data);
                    compressed = true;
                }
                catch (error) {
                    console.warn('Failed to compress data:', error);
                }
            }
            const entry = {
                id,
                data: finalData,
                size: compressed ? this.calculateSize(finalData) : size,
                lastAccessed: now,
                accessCount: 1,
                priority,
                type
            };
            // Remove existing entry if it exists
            if (this.entries.has(id)) {
                this.remove(id);
            }
            // Store the entry
            this.entries.set(id, entry);
            this.updateStats();
            // Track compression
            if (compressed) {
                this.compressionCache.set(id, 'compressed');
            }
            return true;
        }
        catch (error) {
            console.error('Failed to store data in memory:', error);
            return false;
        }
    }
    /**
     * Retrieve data from memory
     */
    get(id) {
        this.requests++;
        const entry = this.entries.get(id);
        if (!entry) {
            return null;
        }
        // Update access statistics
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        this.hits++;
        // Track access pattern
        const accessTimes = this.accessLog.get(id) || [];
        accessTimes.push(Date.now());
        // Keep only last 10 access times
        if (accessTimes.length > 10) {
            accessTimes.shift();
        }
        this.accessLog.set(id, accessTimes);
        // Decompress if needed
        let data = entry.data;
        if (this.compressionCache.has(id)) {
            try {
                data = this.decompressData(entry.data);
            }
            catch (error) {
                console.error('Failed to decompress data:', error);
                return null;
            }
        }
        this.updateHitRate();
        return data;
    }
    /**
     * Check if data exists in memory
     */
    has(id) {
        return this.entries.has(id);
    }
    /**
     * Remove data from memory
     */
    remove(id) {
        const entry = this.entries.get(id);
        if (!entry) {
            return false;
        }
        this.entries.delete(id);
        this.accessLog.delete(id);
        this.compressionCache.delete(id);
        this.updateStats();
        return true;
    }
    /**
     * Clear all data of a specific type
     */
    clearType(type) {
        let cleared = 0;
        const toRemove = [];
        for (const [id, entry] of this.entries) {
            if (entry.type === type) {
                toRemove.push(id);
            }
        }
        toRemove.forEach(id => {
            if (this.remove(id)) {
                cleared++;
            }
        });
        return cleared;
    }
    /**
     * Clear all data
     */
    clear() {
        this.entries.clear();
        this.accessLog.clear();
        this.compressionCache.clear();
        this.updateStats();
    }
    /**
     * Get memory statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get detailed memory breakdown
     */
    getDetailedStats() {
        const byType = {};
        const byPriority = {};
        const topEntries = [];
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        for (const [id, entry] of this.entries) {
            // By type
            if (!byType[entry.type]) {
                byType[entry.type] = { count: 0, size: 0 };
            }
            byType[entry.type].count++;
            byType[entry.type].size += entry.size;
            // By priority
            if (!byPriority[entry.priority]) {
                byPriority[entry.priority] = { count: 0, size: 0 };
            }
            byPriority[entry.priority].count++;
            byPriority[entry.priority].size += entry.size;
            // Top entries
            topEntries.push({
                id,
                size: entry.size,
                accessCount: entry.accessCount
            });
            // Compression stats
            totalCompressedSize += entry.size;
            if (this.compressionCache.has(id)) {
                // Estimate original size (compression typically saves 30-70%)
                totalOriginalSize += entry.size * 2;
            }
            else {
                totalOriginalSize += entry.size;
            }
        }
        // Sort top entries by size
        topEntries.sort((a, b) => b.size - a.size);
        topEntries.splice(20); // Keep only top 20
        const compressionRatio = totalOriginalSize > 0
            ? (totalOriginalSize - totalCompressedSize) / totalOriginalSize
            : 0;
        return {
            byType,
            byPriority,
            topEntries,
            compressionRatio
        };
    }
    /**
     * Force garbage collection
     */
    forceGC() {
        return this.runGarbageCollection();
    }
    /**
     * Subscribe to memory alerts
     */
    onAlert(callback) {
        this.alertCallbacks.add(callback);
        return () => {
            this.alertCallbacks.delete(callback);
        };
    }
    /**
     * Optimize memory usage
     */
    optimize() {
        const initialSize = this.stats.totalSize;
        const initialEntries = this.stats.totalEntries;
        // Run aggressive garbage collection
        const gcRemoved = this.runGarbageCollection(true);
        // Compress large uncompressed entries
        let compressionSavings = 0;
        for (const [id, entry] of this.entries) {
            if (entry.size > this.config.compressionThreshold && !this.compressionCache.has(id)) {
                try {
                    const originalSize = entry.size;
                    const compressed = this.compressData(entry.data);
                    const compressedSize = this.calculateSize(compressed);
                    if (compressedSize < originalSize * 0.8) { // Only compress if saves at least 20%
                        entry.data = compressed;
                        entry.size = compressedSize;
                        this.compressionCache.set(id, 'compressed');
                        compressionSavings += originalSize - compressedSize;
                    }
                }
                catch (error) {
                    console.warn(`Failed to compress entry ${id}:`, error);
                }
            }
        }
        this.updateStats();
        return {
            entriesRemoved: initialEntries - this.stats.totalEntries,
            bytesFreed: initialSize - this.stats.totalSize,
            compressionSavings
        };
    }
    /**
     * Shutdown memory manager
     */
    shutdown() {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
        }
        this.clear();
    }
    // Private methods
    calculateSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        }
        catch (error) {
            // Fallback estimation
            const str = typeof data === 'string' ? data : JSON.stringify(data);
            return str.length * 2; // Rough estimate for UTF-16
        }
    }
    compressData(data) {
        // Simple compression using JSON + base64
        // In a real implementation, you might use a proper compression library
        const json = JSON.stringify(data);
        return btoa(json);
    }
    decompressData(compressed) {
        try {
            const json = atob(compressed);
            return JSON.parse(json);
        }
        catch (error) {
            throw new Error('Failed to decompress data');
        }
    }
    shouldRunGC() {
        const memoryUsageMB = this.stats.totalSize / (1024 * 1024);
        return (memoryUsageMB > this.config.gcThresholdMB ||
            this.stats.totalEntries > this.config.maxEntries ||
            Date.now() - this.stats.lastGcTime > this.config.gcInterval);
    }
    runGarbageCollection(aggressive = false) {
        const now = Date.now();
        const toRemove = [];
        for (const [id, entry] of this.entries) {
            const age = now - entry.lastAccessed;
            const shouldRemove = aggressive
                ? (age > this.config.maxAge / 2 || // More aggressive age threshold
                    entry.accessCount < this.config.minAccessCount * 2 || // Higher access count requirement
                    entry.priority === 'low')
                : (age > this.config.maxAge ||
                    (entry.accessCount < this.config.minAccessCount && entry.priority !== 'critical'));
            if (shouldRemove && entry.priority !== 'critical') {
                toRemove.push(id);
            }
        }
        // Remove entries
        toRemove.forEach(id => this.remove(id));
        // Update stats
        this.stats.gcRuns++;
        this.stats.lastGcTime = now;
        this.updateStats();
        if (toRemove.length > 0) {
            console.log(`Garbage collection removed ${toRemove.length} entries`);
        }
        return toRemove.length;
    }
    updateStats() {
        let totalSize = 0;
        for (const entry of this.entries.values()) {
            totalSize += entry.size;
        }
        this.stats.totalEntries = this.entries.size;
        this.stats.totalSize = totalSize;
        this.stats.usedMemory = totalSize;
        this.stats.availableMemory = (this.config.maxMemoryMB * 1024 * 1024) - totalSize;
        this.stats.averageEntrySize = this.entries.size > 0 ? totalSize / this.entries.size : 0;
    }
    updateHitRate() {
        this.stats.hitRate = this.requests > 0 ? this.hits / this.requests : 0;
    }
    startGarbageCollection() {
        this.gcInterval = setInterval(() => {
            if (this.shouldRunGC()) {
                this.runGarbageCollection();
            }
        }, this.config.gcInterval);
    }
    startMemoryMonitoring() {
        this.memoryMonitorInterval = setInterval(() => {
            const memoryUsageMB = this.stats.totalSize / (1024 * 1024);
            if (memoryUsageMB > this.config.maxMemoryMB * 0.9) {
                this.alertMemoryPressure('critical', `Memory usage critical: ${memoryUsageMB.toFixed(1)}MB`);
            }
            else if (memoryUsageMB > this.config.maxMemoryMB * 0.7) {
                this.alertMemoryPressure('warning', `Memory usage high: ${memoryUsageMB.toFixed(1)}MB`);
            }
        }, 10000); // Check every 10 seconds
    }
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    for (const entry of entries) {
                        if (entry.name === 'measure' && entry.name.includes('memory')) {
                            // Handle performance measurements
                            console.log('Memory performance:', entry);
                        }
                    }
                });
                observer.observe({ entryTypes: ['measure'] });
            }
            catch (error) {
                console.warn('Failed to setup performance observer:', error);
            }
        }
    }
    alertMemoryPressure(type, message) {
        const alert = {
            type,
            message,
            memoryUsage: this.stats.totalSize / (1024 * 1024),
            timestamp: Date.now()
        };
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            }
            catch (error) {
                console.error('Error in memory alert callback:', error);
            }
        });
        // Auto-cleanup on critical alerts
        if (type === 'critical') {
            this.optimize();
        }
    }
}
// Singleton instance
export const memoryManager = new MemoryManager();
// React hook for memory management
export function useMemoryManager() {
    return {
        set: (id, data, type, priority) => memoryManager.set(id, data, type, priority),
        get: (id) => memoryManager.get(id),
        has: (id) => memoryManager.has(id),
        remove: (id) => memoryManager.remove(id),
        clearType: (type) => memoryManager.clearType(type),
        getStats: () => memoryManager.getStats(),
        getDetailedStats: () => memoryManager.getDetailedStats(),
        optimize: () => memoryManager.optimize(),
        onAlert: (callback) => memoryManager.onAlert(callback),
    };
}
//# sourceMappingURL=memoryManager.js.map