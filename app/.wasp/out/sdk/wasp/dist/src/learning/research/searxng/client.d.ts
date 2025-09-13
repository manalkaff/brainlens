export interface SearxngSearchOptions {
    categories?: string[];
    engines?: string[];
    language?: string;
    pageno?: number;
    time_range?: string;
    safesearch?: 0 | 1 | 2;
    format?: 'json' | 'csv' | 'rss';
}
export interface SearxngSearchResult {
    title: string;
    url: string;
    img_src?: string;
    thumbnail_src?: string;
    thumbnail?: string;
    content?: string;
    author?: string;
    iframe_src?: string;
    engine?: string;
    score?: number;
    category?: string;
    publishedDate?: string;
    length?: string;
    views?: string;
    template?: string;
}
export interface SearxngResponse {
    query: string;
    number_of_results: number;
    results: SearxngSearchResult[];
    answers: string[];
    corrections: string[];
    infoboxes: any[];
    suggestions: string[];
    unresponsive_engines: string[];
}
export interface SearxngConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    defaultLanguage: string;
    defaultSafesearch: 0 | 1 | 2;
}
export declare class SearxngClient {
    private config;
    private abortController;
    constructor(config?: Partial<SearxngConfig>);
    /**
     * Perform a search using SearXNG
     */
    search(query: string, options?: SearxngSearchOptions): Promise<{
        results: SearxngSearchResult[];
        suggestions: string[];
        totalResults: number;
        query: string;
    }>;
    /**
     * Search with specific engines
     */
    searchWithEngines(query: string, engines: string[], options?: Omit<SearxngSearchOptions, 'engines'>): Promise<{
        results: SearxngSearchResult[];
        suggestions: string[];
        totalResults: number;
        query: string;
    }>;
    /**
     * Search with specific categories
     */
    searchWithCategories(query: string, categories: string[], options?: Omit<SearxngSearchOptions, 'categories'>): Promise<{
        results: SearxngSearchResult[];
        suggestions: string[];
        totalResults: number;
        query: string;
    }>;
    /**
     * Cancel ongoing search
     */
    cancelSearch(): void;
    /**
     * Get available engines from SearXNG instance
     */
    getAvailableEngines(): Promise<string[]>;
    /**
     * Test connection to SearXNG instance
     */
    testConnection(): Promise<boolean>;
    /**
     * Perform the actual HTTP request to SearXNG
     */
    private performSearch;
    /**
     * Utility method for delays
     */
    private delay;
    /**
     * Get current configuration
     */
    getConfig(): SearxngConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<SearxngConfig>): void;
}
export declare const defaultSearxngClient: SearxngClient;
//# sourceMappingURL=client.d.ts.map