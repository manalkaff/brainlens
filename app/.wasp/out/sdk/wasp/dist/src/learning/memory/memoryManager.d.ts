/**
 * Memory management for long-running learning sessions
 * Implements garbage collection, memory monitoring, and resource cleanup
 */
interface MemoryEntry {
    id: string;
    data: any;
    size: number;
    lastAccessed: number;
    accessCount: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    type: 'topic' | 'content' | 'search' | 'chat' | 'quiz' | 'cache';
}
interface MemoryStats {
    totalEntries: number;
    totalSize: number;
    usedMemory: number;
    availableMemory: number;
    gcRuns: number;
    lastGcTime: number;
    hitRate: number;
    averageEntrySize: number;
}
interface MemoryConfig {
    maxMemoryMB: number;
    maxEntries: number;
    gcThresholdMB: number;
    gcInterval: number;
    maxAge: number;
    minAccessCount: number;
    compressionThreshold: number;
}
interface MemoryAlert {
    type: 'warning' | 'critical';
    message: string;
    memoryUsage: number;
    timestamp: number;
}
declare class MemoryManager {
    private entries;
    private accessLog;
    private compressionCache;
    private config;
    private stats;
    private gcInterval;
    private memoryMonitorInterval;
    private alertCallbacks;
    private hits;
    private requests;
    private readonly DEFAULT_CONFIG;
    constructor(config?: Partial<MemoryConfig>);
    /**
     * Store data in memory with automatic management
     */
    set(id: string, data: any, type?: MemoryEntry['type'], priority?: MemoryEntry['priority']): boolean;
    /**
     * Retrieve data from memory
     */
    get<T>(id: string): T | null;
    /**
     * Check if data exists in memory
     */
    has(id: string): boolean;
    /**
     * Remove data from memory
     */
    remove(id: string): boolean;
    /**
     * Clear all data of a specific type
     */
    clearType(type: MemoryEntry['type']): number;
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Get memory statistics
     */
    getStats(): MemoryStats;
    /**
     * Get detailed memory breakdown
     */
    getDetailedStats(): {
        byType: Record<string, {
            count: number;
            size: number;
        }>;
        byPriority: Record<string, {
            count: number;
            size: number;
        }>;
        topEntries: Array<{
            id: string;
            size: number;
            accessCount: number;
        }>;
        compressionRatio: number;
    };
    /**
     * Force garbage collection
     */
    forceGC(): number;
    /**
     * Subscribe to memory alerts
     */
    onAlert(callback: (alert: MemoryAlert) => void): () => void;
    /**
     * Optimize memory usage
     */
    optimize(): {
        entriesRemoved: number;
        bytesFreed: number;
        compressionSavings: number;
    };
    /**
     * Shutdown memory manager
     */
    shutdown(): void;
    private calculateSize;
    private compressData;
    private decompressData;
    private shouldRunGC;
    private runGarbageCollection;
    private updateStats;
    private updateHitRate;
    private startGarbageCollection;
    private startMemoryMonitoring;
    private setupPerformanceObserver;
    private alertMemoryPressure;
}
export declare const memoryManager: MemoryManager;
export declare function useMemoryManager(): {
    set: (id: string, data: any, type?: MemoryEntry["type"], priority?: MemoryEntry["priority"]) => boolean;
    get: <T>(id: string) => T | null;
    has: (id: string) => boolean;
    remove: (id: string) => boolean;
    clearType: (type: MemoryEntry["type"]) => number;
    getStats: () => MemoryStats;
    getDetailedStats: () => {
        byType: Record<string, {
            count: number;
            size: number;
        }>;
        byPriority: Record<string, {
            count: number;
            size: number;
        }>;
        topEntries: Array<{
            id: string;
            size: number;
            accessCount: number;
        }>;
        compressionRatio: number;
    };
    optimize: () => {
        entriesRemoved: number;
        bytesFreed: number;
        compressionSavings: number;
    };
    onAlert: (callback: (alert: MemoryAlert) => void) => () => void;
};
export type { MemoryEntry, MemoryStats, MemoryConfig, MemoryAlert };
//# sourceMappingURL=memoryManager.d.ts.map