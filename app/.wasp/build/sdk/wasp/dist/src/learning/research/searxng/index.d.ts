export { SearxngClient, defaultSearxngClient, type SearxngSearchOptions, type SearxngSearchResult, type SearxngResponse, type SearxngConfig } from './client';
export { AgentConfigManager, AGENT_SEARCH_CONFIGS, GENERAL_RESEARCH_CONFIG, ACADEMIC_RESEARCH_CONFIG, COMPUTATIONAL_RESEARCH_CONFIG, VIDEO_LEARNING_CONFIG, COMMUNITY_DISCUSSION_CONFIG, type AgentSearchConfig, type AgentConfigName } from './agentConfigs';
export { SearxngCircuitBreaker, SearxngRetryHandler, SearxngErrorRecovery, searxngCircuitBreaker, searxngRetryHandler, createSearxngError, isSearxngError, getSearxngErrorMessage, SearxngErrorType, type SearxngError, type RetryConfig } from './errorHandler';
import { SearxngClient } from './client';
import { AgentConfigManager, type AgentConfigName } from './agentConfigs';
export declare class SearxngUtils {
    /**
     * Create a configured SearXNG client for a specific agent
     */
    static createClientForAgent(agentName: AgentConfigName): SearxngClient;
    /**
     * Perform a search with agent-specific optimization
     */
    static searchWithAgent(agentName: AgentConfigName, query: string, context?: any): Promise<{
        results: any[];
        suggestions: string[];
        totalResults: number;
        query: string;
    }>;
    /**
     * Test SearXNG connectivity
     */
    static testConnection(): Promise<{
        connected: boolean;
        availableEngines: string[];
        error?: string;
    }>;
    /**
     * Validate all agent configurations
     */
    static validateAllConfigs(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get configuration summary for debugging
     */
    static getConfigSummary(): {
        searxngUrl: string;
        agentCount: number;
        agents: {
            name: string;
            engines: string[];
            categories?: string[];
        }[];
        circuitBreakerState: any;
    };
}
declare const _default: {
    SearxngClient: typeof SearxngClient;
    AgentConfigManager: typeof AgentConfigManager;
    SearxngUtils: typeof SearxngUtils;
    defaultSearxngClient: SearxngClient;
    searxngCircuitBreaker: import("./errorHandler").SearxngCircuitBreaker;
    searxngRetryHandler: import("./errorHandler").SearxngRetryHandler;
};
export default _default;
//# sourceMappingURL=index.d.ts.map