// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Prefetch non-critical resources
export const prefetchResource = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Optimize animations based on user preferences
export const getAnimationDuration = (defaultDuration: number): number => {
  return prefersReducedMotion() ? 0 : defaultDuration;
};

// Request idle callback with fallback
export const requestIdleCallback = (callback: () => void, timeout = 5000): number | NodeJS.Timeout => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    return setTimeout(callback, 1);
  }
};

// Cancel idle callback
export const cancelIdleCallback = (id: number | NodeJS.Timeout) => {
  if ('cancelIdleCallback' in window && typeof id === 'number') {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id as NodeJS.Timeout);
  }
};

// Measure performance
export const measurePerformance = (name: string, fn: () => void) => {
  if ('performance' in window && window.performance && 'mark' in window.performance) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } else {
    fn();
  }
};

// Get performance metrics
export const getPerformanceMetrics = () => {
  if (!('performance' in window)) return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    // Core Web Vitals approximations
    fcp: navigation.responseEnd - navigation.fetchStart, // First Contentful Paint approximation
    lcp: navigation.loadEventEnd - navigation.fetchStart, // Largest Contentful Paint approximation
    cls: 0, // Cumulative Layout Shift (would need separate measurement)
    fid: 0, // First Input Delay (would need separate measurement)
    
    // Other useful metrics
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    ttfb: navigation.responseStart - navigation.requestStart, // Time to First Byte
  };
};

// Log performance metrics to console (development only)
export const logPerformanceMetrics = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const metrics = getPerformanceMetrics();
  if (metrics) {
    console.group('Performance Metrics');
    console.log('First Contentful Paint (approx):', `${metrics.fcp.toFixed(2)}ms`);
    console.log('Largest Contentful Paint (approx):', `${metrics.lcp.toFixed(2)}ms`);
    console.log('DOM Content Loaded:', `${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log('Load Complete:', `${metrics.loadComplete.toFixed(2)}ms`);
    console.log('Time to First Byte:', `${metrics.ttfb.toFixed(2)}ms`);
    console.groupEnd();
  }
};