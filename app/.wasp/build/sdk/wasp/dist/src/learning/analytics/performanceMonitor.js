/**
 * Performance Monitor for BrainLens
 * Tracks and analyzes application performance metrics
 */
export class PerformanceMonitor {
    metrics = [];
    observers = new Map();
    customMetrics = {
        topicLoadTime: [],
        chatResponseTime: [],
        mindMapRenderTime: [],
        searchQueryTime: [],
        exportGenerationTime: []
    };
    MAX_METRICS_HISTORY = 1000;
    STORAGE_KEY = 'brainlens_performance_metrics';
    constructor() {
        this.initialize();
    }
    /**
     * Initialize performance monitoring
     */
    initialize() {
        if (typeof window === 'undefined')
            return;
        // Load persisted metrics
        this.loadPersistedMetrics();
        // Set up performance observers
        this.setupNavigationObserver();
        this.setupResourceObserver();
        this.setupPaintObserver();
        this.setupLayoutShiftObserver();
        this.setupLargestContentfulPaintObserver();
        this.setupFirstInputDelayObserver();
        // Monitor memory usage
        this.startMemoryMonitoring();
        // Initial navigation metrics
        this.recordNavigationMetrics();
        // Periodic cleanup
        setInterval(() => this.cleanup(), 60000); // Every minute
        console.log('[Performance] Monitor initialized');
    }
    /**
     * Record a custom metric
     */
    recordMetric(name, value, category = 'custom', tags) {
        const metric = {
            id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            value,
            timestamp: new Date(),
            category,
            tags
        };
        this.metrics.push(metric);
        this.persistMetrics();
        // Also track in custom metrics if applicable
        this.updateCustomMetrics(name, value);
    }
    /**
     * Start timing an operation
     */
    startTiming(operationId) {
        const startTime = performance.now();
        return () => {
            const duration = performance.now() - startTime;
            this.recordMetric(`${operationId}_duration`, duration, 'timing');
            return duration;
        };
    }
    /**
     * Measure function execution time
     */
    async measureAsync(operationName, fn, tags) {
        const startTime = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            this.recordMetric(`${operationName}_duration`, duration, 'timing', tags);
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.recordMetric(`${operationName}_error_duration`, duration, 'timing', {
                ...tags,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get navigation metrics
     */
    getNavigationMetrics() {
        if (!window.performance?.navigation)
            return null;
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        const metrics = {
            pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0
        };
        // Get Web Vitals if available
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
            metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
        }
        // Get CLS from layout shift entries
        const layoutShiftEntries = performance.getEntriesByType('layout-shift');
        if (layoutShiftEntries.length > 0) {
            metrics.cumulativeLayoutShift = layoutShiftEntries.reduce((sum, entry) => {
                return sum + (entry.hadRecentInput ? 0 : entry.value);
            }, 0);
        }
        return metrics;
    }
    /**
     * Get resource metrics
     */
    getResourceMetrics() {
        const resources = performance.getEntriesByType('resource');
        if (resources.length === 0) {
            return {
                totalSize: 0,
                totalRequests: 0,
                averageResponseTime: 0,
                slowestResource: { name: '', duration: 0 },
                fastestResource: { name: '', duration: 0 }
            };
        }
        const durations = resources.map(r => r.duration);
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const sortedByDuration = resources.sort((a, b) => a.duration - b.duration);
        return {
            totalSize,
            totalRequests: resources.length,
            averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            slowestResource: {
                name: sortedByDuration[sortedByDuration.length - 1]?.name || '',
                duration: sortedByDuration[sortedByDuration.length - 1]?.duration || 0
            },
            fastestResource: {
                name: sortedByDuration[0]?.name || '',
                duration: sortedByDuration[0]?.duration || 0
            }
        };
    }
    /**
     * Get memory metrics
     */
    getMemoryMetrics() {
        // @ts-ignore - memory API is not in standard types
        const memory = performance.memory;
        if (!memory)
            return null;
        return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
    }
    /**
     * Get custom application metrics
     */
    getCustomMetrics() {
        return { ...this.customMetrics };
    }
    /**
     * Get metrics by category
     */
    getMetricsByCategory(category) {
        return this.metrics.filter(m => m.category === category);
    }
    /**
     * Get metrics for a time range
     */
    getMetricsInRange(startTime, endTime) {
        return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const sortedMetrics = this.metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return {
            navigation: this.getNavigationMetrics(),
            resources: this.getResourceMetrics(),
            memory: this.getMemoryMetrics(),
            custom: this.getCustomMetrics(),
            totalMetrics: this.metrics.length,
            timeRange: sortedMetrics.length > 0 ? {
                start: sortedMetrics[0].timestamp,
                end: sortedMetrics[sortedMetrics.length - 1].timestamp
            } : null
        };
    }
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics = [];
        this.customMetrics = {
            topicLoadTime: [],
            chatResponseTime: [],
            mindMapRenderTime: [],
            searchQueryTime: [],
            exportGenerationTime: []
        };
        localStorage.removeItem(this.STORAGE_KEY);
    }
    /**
     * Export metrics as JSON
     */
    exportMetrics() {
        return JSON.stringify({
            metrics: this.metrics,
            customMetrics: this.customMetrics,
            summary: this.getPerformanceSummary(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }
    /**
     * Private methods
     */
    setupNavigationObserver() {
        if (!window.PerformanceObserver)
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.recordMetric(`navigation_${entry.name}`, entry.duration, 'navigation');
                });
            });
            observer.observe({ entryTypes: ['navigation'] });
            this.observers.set('navigation', observer);
        }
        catch (error) {
            console.warn('[Performance] Navigation observer setup failed:', error);
        }
    }
    setupResourceObserver() {
        if (!window.PerformanceObserver)
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    const resourceEntry = entry;
                    this.recordMetric('resource_load_time', resourceEntry.duration, 'resource', {
                        name: resourceEntry.name,
                        type: resourceEntry.initiatorType
                    });
                });
            });
            observer.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', observer);
        }
        catch (error) {
            console.warn('[Performance] Resource observer setup failed:', error);
        }
    }
    setupPaintObserver() {
        if (!window.PerformanceObserver)
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.recordMetric(entry.name, entry.startTime, 'timing');
                });
            });
            observer.observe({ entryTypes: ['paint'] });
            this.observers.set('paint', observer);
        }
        catch (error) {
            console.warn('[Performance] Paint observer setup failed:', error);
        }
    }
    setupLayoutShiftObserver() {
        if (!window.PerformanceObserver)
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    // @ts-ignore - layout-shift entry properties
                    if (!entry.hadRecentInput) {
                        // @ts-ignore
                        this.recordMetric('layout_shift', entry.value, 'timing');
                    }
                });
            });
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('layout-shift', observer);
        }
        catch (error) {
            console.warn('[Performance] Layout shift observer setup failed:', error);
        }
    }
    setupLargestContentfulPaintObserver() {
        if (!window.PerformanceObserver)
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    this.recordMetric('largest_contentful_paint', lastEntry.startTime, 'timing');
                }
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('largest-contentful-paint', observer);
        }
        catch (error) {
            console.warn('[Performance] LCP observer setup failed:', error);
        }
    }
    setupFirstInputDelayObserver() {
        if (!window.PerformanceObserver)
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    // @ts-ignore - first-input entry properties
                    this.recordMetric('first_input_delay', entry.processingStart - entry.startTime, 'timing');
                });
            });
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.set('first-input', observer);
        }
        catch (error) {
            console.warn('[Performance] FID observer setup failed:', error);
        }
    }
    recordNavigationMetrics() {
        if (!window.performance?.navigation)
            return;
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.startTime, 'navigation');
                this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.startTime, 'navigation');
                this.recordMetric('dom_interactive', navigation.domInteractive - navigation.startTime, 'navigation');
                this.recordMetric('dom_complete', navigation.domComplete - navigation.startTime, 'navigation');
            }
        }, 0);
    }
    startMemoryMonitoring() {
        // @ts-ignore - memory API
        if (!performance.memory)
            return;
        setInterval(() => {
            const memoryMetrics = this.getMemoryMetrics();
            if (memoryMetrics) {
                this.recordMetric('memory_usage_mb', memoryMetrics.usedJSHeapSize / 1048576, 'memory');
                this.recordMetric('memory_usage_percentage', memoryMetrics.memoryUsagePercentage, 'memory');
            }
        }, 30000); // Every 30 seconds
    }
    updateCustomMetrics(name, value) {
        const maxSamples = 100;
        if (name.includes('topic_load')) {
            this.customMetrics.topicLoadTime.push(value);
            if (this.customMetrics.topicLoadTime.length > maxSamples) {
                this.customMetrics.topicLoadTime.shift();
            }
        }
        else if (name.includes('chat_response')) {
            this.customMetrics.chatResponseTime.push(value);
            if (this.customMetrics.chatResponseTime.length > maxSamples) {
                this.customMetrics.chatResponseTime.shift();
            }
        }
        else if (name.includes('mindmap_render')) {
            this.customMetrics.mindMapRenderTime.push(value);
            if (this.customMetrics.mindMapRenderTime.length > maxSamples) {
                this.customMetrics.mindMapRenderTime.shift();
            }
        }
        else if (name.includes('search_query')) {
            this.customMetrics.searchQueryTime.push(value);
            if (this.customMetrics.searchQueryTime.length > maxSamples) {
                this.customMetrics.searchQueryTime.shift();
            }
        }
        else if (name.includes('export_generation')) {
            this.customMetrics.exportGenerationTime.push(value);
            if (this.customMetrics.exportGenerationTime.length > maxSamples) {
                this.customMetrics.exportGenerationTime.shift();
            }
        }
    }
    cleanup() {
        // Remove old metrics beyond the limit
        if (this.metrics.length > this.MAX_METRICS_HISTORY) {
            this.metrics = this.metrics
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, this.MAX_METRICS_HISTORY);
        }
        // Persist cleaned metrics
        this.persistMetrics();
    }
    persistMetrics() {
        try {
            const data = {
                metrics: this.metrics.slice(-500), // Only persist last 500 metrics
                customMetrics: this.customMetrics,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        }
        catch (error) {
            console.warn('[Performance] Failed to persist metrics:', error);
        }
    }
    loadPersistedMetrics() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // Only load recent metrics (last 24 hours)
                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                if (parsed.timestamp && parsed.timestamp > dayAgo) {
                    this.metrics = parsed.metrics || [];
                    this.customMetrics = { ...this.customMetrics, ...parsed.customMetrics };
                }
            }
        }
        catch (error) {
            console.warn('[Performance] Failed to load persisted metrics:', error);
        }
    }
    /**
     * Cleanup observers when done
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}
// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
//# sourceMappingURL=performanceMonitor.js.map