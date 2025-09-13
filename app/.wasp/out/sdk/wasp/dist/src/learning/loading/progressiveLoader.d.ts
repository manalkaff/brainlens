/**
 * Progressive loading strategies for content-heavy learning materials
 * Implements lazy loading, content prioritization, and bandwidth optimization
 */
interface LoadableContent {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'interactive';
    priority: 'critical' | 'high' | 'medium' | 'low';
    size: number;
    url?: string;
    content?: any;
    dependencies?: string[];
    metadata?: Record<string, any>;
}
interface LoadingContext {
    viewport: {
        width: number;
        height: number;
        scrollTop: number;
        scrollHeight: number;
    };
    network: {
        effectiveType: string;
        downlink: number;
        rtt: number;
    };
    device: {
        memory: number;
        cores: number;
        isMobile: boolean;
    };
    user: {
        preferences: Record<string, any>;
        bandwidth: 'high' | 'medium' | 'low';
    };
}
interface LoadingStats {
    totalItems: number;
    loadedItems: number;
    failedItems: number;
    totalBytes: number;
    loadedBytes: number;
    averageLoadTime: number;
    cacheHitRate: number;
}
declare class ProgressiveLoader {
    private content;
    private loadedContent;
    private loadingPromises;
    private failedContent;
    private loadingQueue;
    private strategies;
    private context;
    private stats;
    private loadTimes;
    private cacheHits;
    private cacheRequests;
    private readonly MAX_CONCURRENT_LOADS;
    private readonly RETRY_ATTEMPTS;
    private readonly RETRY_DELAY;
    private readonly CACHE_TTL;
    private readonly PRELOAD_DISTANCE;
    private readonly BANDWIDTH_THRESHOLDS;
    private activeLoads;
    private observers;
    constructor();
    /**
     * Register content for progressive loading
     */
    registerContent(content: LoadableContent[]): void;
    /**
     * Get loaded content
     */
    getContent(id: string): any | null;
    /**
     * Check if content is loaded
     */
    isLoaded(id: string): boolean;
    /**
     * Check if content is loading
     */
    isLoading(id: string): boolean;
    /**
     * Check if content failed to load
     */
    hasFailed(id: string): boolean;
    /**
     * Force load specific content
     */
    loadContent(id: string): Promise<any>;
    /**
     * Preload content based on viewport and user behavior
     */
    preloadContent(elementId: string, contentIds: string[]): void;
    /**
     * Update loading context (e.g., on scroll, resize, network change)
     */
    updateContext(updates: Partial<LoadingContext>): void;
    /**
     * Get loading statistics
     */
    getStats(): LoadingStats;
    /**
     * Clear cache and reset
     */
    clearCache(): void;
    /**
     * Cleanup resources
     */
    cleanup(): void;
    private detectContext;
    private initializeStrategies;
    private prioritizeContent;
    private processQueue;
    private performLoad;
    private loadText;
    private loadImage;
    private loadVideo;
    private loadAudio;
    private loadDocument;
    private loadInteractive;
    private getCachedContent;
    private setCachedContent;
    private startPerformanceMonitoring;
}
export declare const progressiveLoader: ProgressiveLoader;
export declare function useProgressiveLoader(): {
    registerContent: (content: LoadableContent[]) => void;
    loadContent: (id: string) => Promise<any>;
    preloadContent: (elementId: string, contentIds: string[]) => void;
    isLoaded: (id: string) => boolean;
    isLoading: (id: string) => boolean;
    getContent: (id: string) => any;
    getStats: () => LoadingStats;
};
export type { LoadableContent, LoadingContext, LoadingStats };
//# sourceMappingURL=progressiveLoader.d.ts.map