import type { SearxngSearchOptions } from './client';
export interface AgentSearchConfig {
    name: string;
    description: string;
    engines: string[];
    categories?: string[];
    searchOptions: Partial<SearxngSearchOptions>;
    queryOptimization: {
        prefixes: string[];
        suffixes: string[];
        excludeTerms: string[];
        includeTerms: string[];
    };
    resultFiltering: {
        minContentLength?: number;
        maxResults?: number;
        scoreThreshold?: number;
        requiredFields: string[];
    };
}
declare const GENERAL_RESEARCH_CONFIG: AgentSearchConfig;
declare const ACADEMIC_RESEARCH_CONFIG: AgentSearchConfig;
declare const COMPUTATIONAL_RESEARCH_CONFIG: AgentSearchConfig;
declare const VIDEO_LEARNING_CONFIG: AgentSearchConfig;
declare const COMMUNITY_DISCUSSION_CONFIG: AgentSearchConfig;
export declare const AGENT_SEARCH_CONFIGS: {
    readonly general: AgentSearchConfig;
    readonly academic: AgentSearchConfig;
    readonly computational: AgentSearchConfig;
    readonly video: AgentSearchConfig;
    readonly community: AgentSearchConfig;
};
export type AgentConfigName = keyof typeof AGENT_SEARCH_CONFIGS;
export declare class AgentConfigManager {
    /**
     * Get configuration for a specific agent
     */
    static getConfig(agentName: AgentConfigName): AgentSearchConfig;
    /**
     * Get all available agent configurations
     */
    static getAllConfigs(): AgentSearchConfig[];
    /**
     * Get agent names
     */
    static getAgentNames(): AgentConfigName[];
    /**
     * Optimize query for a specific agent
     */
    static optimizeQuery(agentName: AgentConfigName, baseQuery: string, context?: any): string[];
    /**
     * Filter results based on agent configuration
     */
    static filterResults(agentName: AgentConfigName, results: any[]): any[];
    /**
     * Get search options for an agent
     */
    static getSearchOptions(agentName: AgentConfigName, overrides?: Partial<SearxngSearchOptions>): SearxngSearchOptions;
    /**
     * Validate agent configuration
     */
    static validateConfig(config: AgentSearchConfig): boolean;
}
export { GENERAL_RESEARCH_CONFIG, ACADEMIC_RESEARCH_CONFIG, COMPUTATIONAL_RESEARCH_CONFIG, VIDEO_LEARNING_CONFIG, COMMUNITY_DISCUSSION_CONFIG };
//# sourceMappingURL=agentConfigs.d.ts.map