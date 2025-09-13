import { HttpError } from 'wasp/server';
// Default configuration
const DEFAULT_CONFIG = {
    baseUrl: process.env.SEARXNG_URL || 'http://localhost:8080',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    defaultLanguage: 'en',
    defaultSafesearch: 1
};
export class SearxngClient {
    config;
    abortController = null;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Validate configuration
        if (!this.config.baseUrl) {
            throw new Error('SearXNG base URL is required. Set SEARXNG_URL environment variable.');
        }
    }
    /**
     * Perform a search using SearXNG
     */
    async search(query, options = {}) {
        if (!query || query.trim().length === 0) {
            throw new Error('Search query cannot be empty');
        }
        const searchOptions = {
            format: 'json',
            language: this.config.defaultLanguage,
            safesearch: this.config.defaultSafesearch,
            pageno: 1,
            ...options
        };
        let lastError = null;
        // Retry logic
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await this.performSearch(query, searchOptions);
                return {
                    results: response.results || [],
                    suggestions: response.suggestions || [],
                    totalResults: response.number_of_results || 0,
                    query: response.query || query
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`SearXNG search attempt ${attempt} failed:`, lastError.message);
                // Don't retry on certain errors
                if (error instanceof HttpError && error.statusCode === 400) {
                    throw error;
                }
                // Wait before retrying (except on last attempt)
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        // All attempts failed
        throw new HttpError(503, `SearXNG search failed after ${this.config.retryAttempts} attempts: ${lastError?.message || 'Unknown error'}`);
    }
    /**
     * Search with specific engines
     */
    async searchWithEngines(query, engines, options = {}) {
        return this.search(query, { ...options, engines });
    }
    /**
     * Search with specific categories
     */
    async searchWithCategories(query, categories, options = {}) {
        return this.search(query, { ...options, categories });
    }
    /**
     * Cancel ongoing search
     */
    cancelSearch() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
    /**
     * Get available engines from SearXNG instance
     */
    async getAvailableEngines() {
        try {
            const url = `${this.config.baseUrl}/config`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Learning-Platform/1.0'
                },
                signal: AbortSignal.timeout(this.config.timeout)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const config = await response.json();
            return Object.keys(config.engines || {});
        }
        catch (error) {
            console.warn('Failed to get available engines:', error);
            return []; // Return empty array if config endpoint is not available
        }
    }
    /**
     * Test connection to SearXNG instance
     */
    async testConnection() {
        try {
            const response = await this.search('test', { engines: [] });
            return response !== null;
        }
        catch (error) {
            console.error('SearXNG connection test failed:', error);
            return false;
        }
    }
    /**
     * Perform the actual HTTP request to SearXNG
     */
    async performSearch(query, options) {
        // Create new abort controller for this request
        this.abortController = new AbortController();
        // Build search URL
        const searchUrl = new URL('/search', this.config.baseUrl);
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('format', options.format || 'json');
        if (options.language) {
            searchUrl.searchParams.set('language', options.language);
        }
        if (options.safesearch !== undefined) {
            searchUrl.searchParams.set('safesearch', options.safesearch.toString());
        }
        if (options.pageno) {
            searchUrl.searchParams.set('pageno', options.pageno.toString());
        }
        if (options.time_range) {
            searchUrl.searchParams.set('time_range', options.time_range);
        }
        if (options.categories && options.categories.length > 0) {
            searchUrl.searchParams.set('categories', options.categories.join(','));
        }
        if (options.engines && options.engines.length > 0) {
            searchUrl.searchParams.set('engines', options.engines.join(','));
        }
        try {
            const response = await fetch(searchUrl.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Learning-Platform/1.0',
                    'Accept-Language': options.language || this.config.defaultLanguage
                },
                signal: this.abortController.signal
            });
            if (!response.ok) {
                if (response.status === 400) {
                    throw new HttpError(400, `Invalid search query: ${query}`);
                }
                if (response.status === 429) {
                    throw new HttpError(429, 'Rate limit exceeded');
                }
                if (response.status >= 500) {
                    throw new HttpError(503, `SearXNG server error: ${response.status}`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from SearXNG');
            }
            return data;
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Search request was cancelled');
            }
            if (error instanceof HttpError) {
                throw error;
            }
            // Network or parsing errors
            throw new Error(`SearXNG request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            this.abortController = null;
        }
    }
    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
// Export a default instance
export const defaultSearxngClient = new SearxngClient();
//# sourceMappingURL=client.js.map