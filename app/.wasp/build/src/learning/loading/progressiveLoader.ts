/**
 * Progressive loading strategies for content-heavy learning materials
 * Implements lazy loading, content prioritization, and bandwidth optimization
 */

interface LoadableContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'interactive';
  priority: 'critical' | 'high' | 'medium' | 'low';
  size: number; // in bytes
  url?: string;
  content?: any;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

interface LoadingStrategy {
  name: string;
  shouldLoad: (content: LoadableContent, context: LoadingContext) => boolean;
  priority: number;
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

interface LoadingQueue {
  critical: LoadableContent[];
  high: LoadableContent[];
  medium: LoadableContent[];
  low: LoadableContent[];
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

class ProgressiveLoader {
  private content: Map<string, LoadableContent> = new Map();
  private loadedContent: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private failedContent: Set<string> = new Set();
  private loadingQueue: LoadingQueue = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };
  private strategies: LoadingStrategy[] = [];
  private context: LoadingContext;
  private stats: LoadingStats = {
    totalItems: 0,
    loadedItems: 0,
    failedItems: 0,
    totalBytes: 0,
    loadedBytes: 0,
    averageLoadTime: 0,
    cacheHitRate: 0
  };
  private loadTimes: number[] = [];
  private cacheHits = 0;
  private cacheRequests = 0;

  // Configuration
  private readonly MAX_CONCURRENT_LOADS = 6;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly PRELOAD_DISTANCE = 1000; // pixels
  private readonly BANDWIDTH_THRESHOLDS = {
    high: 2, // Mbps
    medium: 0.5 // Mbps
  };

  private activeLoads = 0;
  private observers: Map<string, IntersectionObserver> = new Map();

  constructor() {
    this.context = this.detectContext();
    this.initializeStrategies();
    this.startPerformanceMonitoring();
  }

  /**
   * Register content for progressive loading
   */
  registerContent(content: LoadableContent[]): void {
    content.forEach(item => {
      this.content.set(item.id, item);
      this.stats.totalItems++;
      this.stats.totalBytes += item.size;
    });

    this.prioritizeContent();
    this.processQueue();
  }

  /**
   * Get loaded content
   */
  getContent(id: string): any | null {
    return this.loadedContent.get(id) || null;
  }

  /**
   * Check if content is loaded
   */
  isLoaded(id: string): boolean {
    return this.loadedContent.has(id);
  }

  /**
   * Check if content is loading
   */
  isLoading(id: string): boolean {
    return this.loadingPromises.has(id);
  }

  /**
   * Check if content failed to load
   */
  hasFailed(id: string): boolean {
    return this.failedContent.has(id);
  }

  /**
   * Force load specific content
   */
  async loadContent(id: string): Promise<any> {
    const content = this.content.get(id);
    if (!content) {
      throw new Error(`Content not found: ${id}`);
    }

    // Return if already loaded
    if (this.loadedContent.has(id)) {
      return this.loadedContent.get(id);
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id);
    }

    // Start loading
    const promise = this.performLoad(content);
    this.loadingPromises.set(id, promise);

    try {
      const result = await promise;
      this.loadedContent.set(id, result);
      this.stats.loadedItems++;
      this.stats.loadedBytes += content.size;
      return result;
    } catch (error) {
      this.failedContent.add(id);
      this.stats.failedItems++;
      throw error;
    } finally {
      this.loadingPromises.delete(id);
      this.activeLoads--;
    }
  }

  /**
   * Preload content based on viewport and user behavior
   */
  preloadContent(elementId: string, contentIds: string[]): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Create intersection observer for this element
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Element is visible, start preloading
            contentIds.forEach(id => {
              if (!this.isLoaded(id) && !this.isLoading(id)) {
                this.loadContent(id).catch(console.error);
              }
            });
          }
        });
      },
      {
        rootMargin: `${this.PRELOAD_DISTANCE}px`,
        threshold: 0.1
      }
    );

    observer.observe(element);
    this.observers.set(elementId, observer);
  }

  /**
   * Update loading context (e.g., on scroll, resize, network change)
   */
  updateContext(updates: Partial<LoadingContext>): void {
    this.context = { ...this.context, ...updates };
    this.prioritizeContent();
    this.processQueue();
  }

  /**
   * Get loading statistics
   */
  getStats(): LoadingStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset
   */
  clearCache(): void {
    this.loadedContent.clear();
    this.failedContent.clear();
    this.loadingPromises.clear();
    this.stats = {
      totalItems: this.content.size,
      loadedItems: 0,
      failedItems: 0,
      totalBytes: Array.from(this.content.values()).reduce((sum, item) => sum + item.size, 0),
      loadedBytes: 0,
      averageLoadTime: 0,
      cacheHitRate: 0
    };
    this.loadTimes = [];
    this.cacheHits = 0;
    this.cacheRequests = 0;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear intersection observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear all data
    this.content.clear();
    this.loadedContent.clear();
    this.loadingPromises.clear();
    this.failedContent.clear();
  }

  // Private methods

  private detectContext(): LoadingContext {
    const viewport = {
      width: window.innerWidth || 1024,
      height: window.innerHeight || 768,
      scrollTop: window.scrollY || 0,
      scrollHeight: document.documentElement.scrollHeight || 0
    };

    // Detect network conditions
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const network = {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100
    };

    // Detect device capabilities
    const device = {
      memory: (navigator as any).deviceMemory || 4,
      cores: navigator.hardwareConcurrency || 4,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    // Determine bandwidth category
    let bandwidth: 'high' | 'medium' | 'low' = 'medium';
    if (network.downlink >= this.BANDWIDTH_THRESHOLDS.high) {
      bandwidth = 'high';
    } else if (network.downlink < this.BANDWIDTH_THRESHOLDS.medium) {
      bandwidth = 'low';
    }

    return {
      viewport,
      network,
      device,
      user: {
        preferences: {},
        bandwidth
      }
    };
  }

  private initializeStrategies(): void {
    this.strategies = [
      // Critical content always loads
      {
        name: 'critical',
        shouldLoad: (content) => content.priority === 'critical',
        priority: 1
      },
      // High priority content on good connections
      {
        name: 'high-priority',
        shouldLoad: (content, context) => 
          content.priority === 'high' && context.user.bandwidth !== 'low',
        priority: 2
      },
      // Visible content
      {
        name: 'visible',
        shouldLoad: (content, context) => {
          // This would need element position data
          return true; // Simplified for now
        },
        priority: 3
      },
      // Small content on any connection
      {
        name: 'small-content',
        shouldLoad: (content) => content.size < 100 * 1024, // < 100KB
        priority: 4
      },
      // Medium priority on good connections
      {
        name: 'medium-priority',
        shouldLoad: (content, context) =>
          content.priority === 'medium' && context.user.bandwidth === 'high',
        priority: 5
      },
      // Low priority only on excellent connections
      {
        name: 'low-priority',
        shouldLoad: (content, context) =>
          content.priority === 'low' && 
          context.user.bandwidth === 'high' && 
          context.network.downlink > 5,
        priority: 6
      }
    ];
  }

  private prioritizeContent(): void {
    // Clear existing queues
    this.loadingQueue = { critical: [], high: [], medium: [], low: [] };

    // Sort content by strategies
    for (const content of this.content.values()) {
      if (this.isLoaded(content.id) || this.isLoading(content.id)) {
        continue;
      }

      // Find applicable strategies
      const applicableStrategies = this.strategies.filter(strategy =>
        strategy.shouldLoad(content, this.context)
      );

      if (applicableStrategies.length === 0) {
        continue; // Don't load this content
      }

      // Use highest priority strategy
      const strategy = applicableStrategies.reduce((best, current) =>
        current.priority < best.priority ? current : best
      );

      // Add to appropriate queue
      switch (content.priority) {
        case 'critical':
          this.loadingQueue.critical.push(content);
          break;
        case 'high':
          this.loadingQueue.high.push(content);
          break;
        case 'medium':
          this.loadingQueue.medium.push(content);
          break;
        case 'low':
          this.loadingQueue.low.push(content);
          break;
      }
    }

    // Sort each queue by size (smaller first for faster perceived loading)
    Object.values(this.loadingQueue).forEach(queue => {
      queue.sort((a: LoadableContent, b: LoadableContent) => a.size - b.size);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeLoads >= this.MAX_CONCURRENT_LOADS) {
      return;
    }

    // Process queues in priority order
    const queues = [
      this.loadingQueue.critical,
      this.loadingQueue.high,
      this.loadingQueue.medium,
      this.loadingQueue.low
    ];

    for (const queue of queues) {
      while (queue.length > 0 && this.activeLoads < this.MAX_CONCURRENT_LOADS) {
        const content = queue.shift()!;
        this.activeLoads++;
        
        // Start loading without waiting
        this.loadContent(content.id).catch(error => {
          console.error(`Failed to load content ${content.id}:`, error);
        });
      }
    }
  }

  private async performLoad(content: LoadableContent): Promise<any> {
    const startTime = Date.now();
    this.cacheRequests++;

    try {
      // Check cache first
      const cached = await this.getCachedContent(content.id);
      if (cached) {
        this.cacheHits++;
        return cached;
      }

      // Load dependencies first
      if (content.dependencies) {
        await Promise.all(
          content.dependencies.map(depId => this.loadContent(depId))
        );
      }

      // Perform actual load based on content type
      let result: any;
      switch (content.type) {
        case 'text':
          result = await this.loadText(content);
          break;
        case 'image':
          result = await this.loadImage(content);
          break;
        case 'video':
          result = await this.loadVideo(content);
          break;
        case 'audio':
          result = await this.loadAudio(content);
          break;
        case 'document':
          result = await this.loadDocument(content);
          break;
        case 'interactive':
          result = await this.loadInteractive(content);
          break;
        default:
          throw new Error(`Unknown content type: ${content.type}`);
      }

      // Cache the result
      await this.setCachedContent(content.id, result);

      // Update performance stats
      const loadTime = Date.now() - startTime;
      this.loadTimes.push(loadTime);
      this.stats.averageLoadTime = this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length;
      this.stats.cacheHitRate = this.cacheHits / this.cacheRequests;

      return result;
    } catch (error) {
      console.error(`Failed to load content ${content.id}:`, error);
      throw error;
    }
  }

  private async loadText(content: LoadableContent): Promise<string> {
    if (content.url) {
      const response = await fetch(content.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    }
    return content.content || '';
  }

  private async loadImage(content: LoadableContent): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${content.url}`));
      img.src = content.url || '';
    });
  }

  private async loadVideo(content: LoadableContent): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadeddata = () => resolve(video);
      video.onerror = () => reject(new Error(`Failed to load video: ${content.url}`));
      video.src = content.url || '';
      video.preload = 'metadata';
    });
  }

  private async loadAudio(content: LoadableContent): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadeddata = () => resolve(audio);
      audio.onerror = () => reject(new Error(`Failed to load audio: ${content.url}`));
      audio.src = content.url || '';
      audio.preload = 'metadata';
    });
  }

  private async loadDocument(content: LoadableContent): Promise<any> {
    if (content.url) {
      const response = await fetch(content.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    }
    return content.content;
  }

  private async loadInteractive(content: LoadableContent): Promise<any> {
    // This would load interactive content like widgets, games, etc.
    // Implementation depends on the specific interactive content format
    return content.content || {};
  }

  private async getCachedContent(id: string): Promise<any | null> {
    try {
      const cached = localStorage.getItem(`progressive_loader_${id}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          return data;
        } else {
          localStorage.removeItem(`progressive_loader_${id}`);
        }
      }
    } catch (error) {
      console.warn('Failed to get cached content:', error);
    }
    return null;
  }

  private async setCachedContent(id: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`progressive_loader_${id}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache content:', error);
    }
  }

  private startPerformanceMonitoring(): void {
    // Monitor network changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        this.context = this.detectContext();
        this.prioritizeContent();
        this.processQueue();
      });
    }

    // Monitor viewport changes
    window.addEventListener('scroll', () => {
      this.context.viewport.scrollTop = window.scrollY;
    });

    window.addEventListener('resize', () => {
      this.context.viewport.width = window.innerWidth;
      this.context.viewport.height = window.innerHeight;
    });
  }
}

// Singleton instance
export const progressiveLoader = new ProgressiveLoader();

// React hook for using progressive loader
export function useProgressiveLoader() {
  return {
    registerContent: (content: LoadableContent[]) => progressiveLoader.registerContent(content),
    loadContent: (id: string) => progressiveLoader.loadContent(id),
    preloadContent: (elementId: string, contentIds: string[]) => 
      progressiveLoader.preloadContent(elementId, contentIds),
    isLoaded: (id: string) => progressiveLoader.isLoaded(id),
    isLoading: (id: string) => progressiveLoader.isLoading(id),
    getContent: (id: string) => progressiveLoader.getContent(id),
    getStats: () => progressiveLoader.getStats(),
  };
}

export type { LoadableContent, LoadingContext, LoadingStats };