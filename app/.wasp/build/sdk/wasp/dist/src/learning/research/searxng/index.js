// SearXNG Integration Module
// This module provides a complete SearXNG integration for the learning platform
// Client and core functionality
export { SearxngClient, defaultSearxngClient } from './client';
// Agent configurations
export { AgentConfigManager, AGENT_SEARCH_CONFIGS, GENERAL_RESEARCH_CONFIG, ACADEMIC_RESEARCH_CONFIG, COMPUTATIONAL_RESEARCH_CONFIG, VIDEO_LEARNING_CONFIG, COMMUNITY_DISCUSSION_CONFIG } from './agentConfigs';
// Error handling and retry logic
export { SearxngCircuitBreaker, SearxngRetryHandler, SearxngErrorRecovery, searxngCircuitBreaker, searxngRetryHandler, createSearxngError, isSearxngError, getSearxngErrorMessage, SearxngErrorType } from './errorHandler';
// Import required classes and types for utility class
import { SearxngClient, defaultSearxngClient } from './client';
import { AgentConfigManager, AGENT_SEARCH_CONFIGS } from './agentConfigs';
import { searxngCircuitBreaker, searxngRetryHandler, isSearxngError, SearxngErrorRecovery } from './errorHandler';
// Utility functions for common operations
export class SearxngUtils {
    /**
     * Create a configured SearXNG client for a specific agent
     */
    static createClientForAgent(agentName) {
        return new SearxngClient({
            baseUrl: process.env.SEARXNG_URL || 'http://localhost:8080',
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000
        });
    }
    /**
     * Perform a search with agent-specific optimization
     */
    static async searchWithAgent(agentName, query, context) {
        const searchStartTime = Date.now();
        console.log(`TIMING LOGS: Starting SearXNG search with agent "${agentName}" - query: "${query}"`);
        const client = this.createClientForAgent(agentName);
        const optimizationStartTime = Date.now();
        console.log(`TIMING LOGS: Starting query optimization for agent "${agentName}"`);
        const optimizedQueries = AgentConfigManager.optimizeQuery(agentName, query, context);
        const searchOptions = AgentConfigManager.getSearchOptions(agentName);
        const optimizationDuration = Date.now() - optimizationStartTime;
        console.log(`TIMING LOGS: Completed query optimization in ${optimizationDuration}ms - ${optimizedQueries.length} optimized queries`);
        // Use the first optimized query for the main search
        const mainQuery = optimizedQueries[0] || query;
        try {
            const networkStartTime = Date.now();
            console.log(`TIMING LOGS: Starting network request to SearXNG for agent "${agentName}"`);
            const response = await searxngRetryHandler.execute(async () => {
                return await searxngCircuitBreaker.execute(async () => {
                    return await client.search(mainQuery, searchOptions);
                });
            });
            const networkDuration = Date.now() - networkStartTime;
            console.log(`TIMING LOGS: Completed SearXNG network request in ${networkDuration}ms - found ${response.results?.length || 0} raw results`);
            // Filter results based on agent configuration
            const filteringStartTime = Date.now();
            console.log(`TIMING LOGS: Starting result filtering for agent "${agentName}"`);
            const filteredResults = AgentConfigManager.filterResults(agentName, response.results);
            const filteringDuration = Date.now() - filteringStartTime;
            console.log(`TIMING LOGS: Completed result filtering in ${filteringDuration}ms - ${filteredResults.length} filtered results`);
            const totalSearchDuration = Date.now() - searchStartTime;
            console.log(`TIMING LOGS: Completed full SearXNG search with agent "${agentName}" in ${totalSearchDuration}ms`);
            return {
                ...response,
                results: filteredResults
            };
        }
        catch (error) {
            const errorDuration = Date.now() - searchStartTime;
            console.log(`TIMING LOGS: SearXNG search failed for agent "${agentName}" after ${errorDuration}ms - error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Handle errors with recovery strategies
            if (isSearxngError(error)) {
                const recoveryStartTime = Date.now();
                console.log(`TIMING LOGS: Starting SearXNG error recovery`);
                const recoveryResult = await SearxngErrorRecovery.handleError(error, 'cache');
                const recoveryDuration = Date.now() - recoveryStartTime;
                console.log(`TIMING LOGS: Completed SearXNG error recovery in ${recoveryDuration}ms`);
                return recoveryResult;
            }
            throw error;
        }
    }
    /**
     * Test SearXNG connectivity
     */
    static async testConnection() {
        try {
            const client = new SearxngClient();
            const connected = await client.testConnection();
            const availableEngines = connected ? await client.getAvailableEngines() : [];
            return {
                connected,
                availableEngines
            };
        }
        catch (error) {
            return {
                connected: false,
                availableEngines: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Validate all agent configurations
     */
    static validateAllConfigs() {
        const errors = [];
        for (const [name, config] of Object.entries(AGENT_SEARCH_CONFIGS)) {
            if (!AgentConfigManager.validateConfig(config)) {
                errors.push(`Invalid configuration for agent: ${name}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get configuration summary for debugging
     */
    static getConfigSummary() {
        const agents = AgentConfigManager.getAllConfigs().map(config => ({
            name: config.name,
            engines: config.engines,
            categories: config.categories
        }));
        return {
            searxngUrl: process.env.SEARXNG_URL || 'http://localhost:8080',
            agentCount: agents.length,
            agents,
            circuitBreakerState: searxngCircuitBreaker.getState()
        };
    }
}
// Default export for convenience
export default {
    SearxngClient,
    AgentConfigManager,
    SearxngUtils,
    defaultSearxngClient,
    searxngCircuitBreaker,
    searxngRetryHandler
};
//# sourceMappingURL=index.js.map