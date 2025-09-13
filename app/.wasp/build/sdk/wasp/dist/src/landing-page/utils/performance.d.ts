export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => ((...args: Parameters<T>) => void);
export declare const preloadResource: (href: string, as: string, type?: string) => void;
export declare const prefetchResource: (href: string) => void;
export declare const prefersReducedMotion: () => boolean;
export declare const getAnimationDuration: (defaultDuration: number) => number;
export declare const requestIdleCallback: (callback: () => void, timeout?: number) => number | NodeJS.Timeout;
export declare const cancelIdleCallback: (id: number | NodeJS.Timeout) => void;
export declare const measurePerformance: (name: string, fn: () => void) => void;
export declare const getPerformanceMetrics: () => {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
    domContentLoaded: number;
    loadComplete: number;
    ttfb: number;
} | null;
export declare const logPerformanceMetrics: () => void;
//# sourceMappingURL=performance.d.ts.map