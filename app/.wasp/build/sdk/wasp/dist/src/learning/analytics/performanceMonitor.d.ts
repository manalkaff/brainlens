/**
 * Performance Monitor for BrainLens
 * Tracks and analyzes application performance metrics
 */
interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    timestamp: Date;
    category: 'memory' | 'timing' | 'navigation' | 'resource' | 'custom';
    tags?: Record<string, string>;
}
interface NavigationMetrics {
    pageLoad: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
    timeToInteractive?: number;
}
interface ResourceMetrics {
    totalSize: number;
    totalRequests: number;
    averageResponseTime: number;
    slowestResource: {
        name: string;
        duration: number;
    };
    fastestResource: {
        name: string;
        duration: number;
    };
}
interface MemoryMetrics {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    memoryUsagePercentage: number;
}
interface CustomMetrics {
    topicLoadTime: number[];
    chatResponseTime: number[];
    mindMapRenderTime: number[];
    searchQueryTime: number[];
    exportGenerationTime: number[];
}
export declare class PerformanceMonitor {
    private metrics;
    private observers;
    private customMetrics;
    private readonly MAX_METRICS_HISTORY;
    private readonly STORAGE_KEY;
    constructor();
    /**
     * Initialize performance monitoring
     */
    private initialize;
    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, category?: PerformanceMetric['category'], tags?: Record<string, string>): void;
    /**
     * Start timing an operation
     */
    startTiming(operationId: string): () => void;
    /**
     * Measure function execution time
     */
    measureAsync<T>(operationName: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    /**
     * Get navigation metrics
     */
    getNavigationMetrics(): NavigationMetrics | null;
    /**
     * Get resource metrics
     */
    getResourceMetrics(): ResourceMetrics;
    /**
     * Get memory metrics
     */
    getMemoryMetrics(): MemoryMetrics | null;
    /**
     * Get custom application metrics
     */
    getCustomMetrics(): CustomMetrics;
    /**
     * Get metrics by category
     */
    getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[];
    /**
     * Get metrics for a time range
     */
    getMetricsInRange(startTime: Date, endTime: Date): PerformanceMetric[];
    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        navigation: NavigationMetrics | null;
        resources: ResourceMetrics;
        memory: MemoryMetrics | null;
        custom: CustomMetrics;
        totalMetrics: number;
        timeRange: {
            start: Date;
            end: Date;
        } | null;
    };
    /**
     * Clear all metrics
     */
    clearMetrics(): void;
    /**
     * Export metrics as JSON
     */
    exportMetrics(): string;
    /**
     * Private methods
     */
    private setupNavigationObserver;
    private setupResourceObserver;
    private setupPaintObserver;
    private setupLayoutShiftObserver;
    private setupLargestContentfulPaintObserver;
    private setupFirstInputDelayObserver;
    private recordNavigationMetrics;
    private startMemoryMonitoring;
    private updateCustomMetrics;
    private cleanup;
    private persistMetrics;
    private loadPersistedMetrics;
    /**
     * Cleanup observers when done
     */
    destroy(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
export default performanceMonitor;
//# sourceMappingURL=performanceMonitor.d.ts.map