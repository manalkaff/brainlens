/**
 * Browser-side caching utilities for static learning content and assets
 */
/**
 * Topic content caching
 */
export declare const topicContentCache: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, data: T): Promise<boolean>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
};
/**
 * Search results caching
 */
export declare const searchResultsCache: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, data: T): Promise<boolean>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
};
/**
 * User progress caching
 */
export declare const userProgressCache: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, data: T): Promise<boolean>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
};
/**
 * Generated content caching
 */
export declare const generatedContentCache: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, data: T): Promise<boolean>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
};
/**
 * Cache management utilities
 */
export declare const cacheManager: {
    clearAll(): Promise<void>;
    getStats(): Promise<{
        memoryEntries: number;
        localStorageEntries: number;
        totalSize: number;
        namespaces: Record<string, {
            entries: number;
            size: number;
        }>;
    }>;
    cleanup(): Promise<void>;
};
//# sourceMappingURL=browserCache.d.ts.map