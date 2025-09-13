// General Research Agent Configuration
const GENERAL_RESEARCH_CONFIG = {
    name: 'General Research Agent',
    description: 'Comprehensive information gathering with no engine constraints',
    engines: [], // No specific engines - uses SearXNG default engines
    categories: ['general'],
    searchOptions: {
        safesearch: 1,
        pageno: 1,
        language: 'en'
    },
    queryOptimization: {
        prefixes: ['what is', 'overview of', 'introduction to', 'guide to'],
        suffixes: ['explained', 'overview', 'basics', 'fundamentals', 'definition'],
        excludeTerms: ['buy', 'purchase', 'sale', 'price', 'cost'],
        includeTerms: ['information', 'guide', 'tutorial', 'explanation']
    },
    resultFiltering: {
        minContentLength: 100,
        maxResults: 20,
        scoreThreshold: 0.3,
        requiredFields: ['title', 'url', 'content']
    }
};
// Academic Research Agent Configuration
const ACADEMIC_RESEARCH_CONFIG = {
    name: 'Academic Research Agent',
    description: 'Scholarly articles and peer-reviewed research',
    engines: ['arxiv', 'google scholar', 'pubmed', 'semantic scholar', 'crossref'],
    categories: ['science', 'it'],
    searchOptions: {
        safesearch: 0, // No filtering for academic content
        pageno: 1,
        language: 'en',
        time_range: 'year' // Focus on recent research
    },
    queryOptimization: {
        prefixes: ['research on', 'study of', 'analysis of', 'review of'],
        suffixes: ['research', 'study', 'analysis', 'paper', 'article', 'journal'],
        excludeTerms: ['blog', 'opinion', 'news', 'commercial'],
        includeTerms: ['peer-reviewed', 'journal', 'research', 'study', 'academic']
    },
    resultFiltering: {
        minContentLength: 200,
        maxResults: 15,
        scoreThreshold: 0.4,
        requiredFields: ['title', 'url', 'content']
    }
};
// Computational Agent Configuration
const COMPUTATIONAL_RESEARCH_CONFIG = {
    name: 'Computational Agent',
    description: 'Mathematical and computational analysis using Wolfram Alpha',
    engines: ['wolframalpha', 'wikipedia'],
    categories: ['science', 'it'],
    searchOptions: {
        safesearch: 0,
        pageno: 1,
        language: 'en'
    },
    queryOptimization: {
        prefixes: ['calculate', 'compute', 'solve', 'formula for', 'equation for'],
        suffixes: ['formula', 'equation', 'calculation', 'algorithm', 'computation'],
        excludeTerms: ['tutorial', 'guide', 'explanation'],
        includeTerms: ['mathematical', 'formula', 'equation', 'algorithm', 'computation']
    },
    resultFiltering: {
        minContentLength: 50,
        maxResults: 10,
        scoreThreshold: 0.5,
        requiredFields: ['title', 'url']
    }
};
// Video Learning Agent Configuration
const VIDEO_LEARNING_CONFIG = {
    name: 'Video Learning Agent',
    description: 'Educational videos and visual explanations',
    engines: ['youtube', 'vimeo', 'dailymotion'],
    categories: ['videos'],
    searchOptions: {
        safesearch: 1,
        pageno: 1,
        language: 'en',
        time_range: 'year' // Focus on recent videos
    },
    queryOptimization: {
        prefixes: ['tutorial', 'how to', 'learn', 'explained', 'course on'],
        suffixes: ['tutorial', 'explained', 'course', 'lesson', 'guide', 'walkthrough'],
        excludeTerms: ['music', 'entertainment', 'funny', 'meme'],
        includeTerms: ['tutorial', 'educational', 'learning', 'course', 'lesson']
    },
    resultFiltering: {
        minContentLength: 50,
        maxResults: 12,
        scoreThreshold: 0.3,
        requiredFields: ['title', 'url', 'thumbnail']
    }
};
// Community Discussion Agent Configuration
const COMMUNITY_DISCUSSION_CONFIG = {
    name: 'Community Discussion Agent',
    description: 'Real-world discussions and user experiences',
    engines: ['reddit', 'stackoverflow', 'stackexchange'],
    categories: ['social media'],
    searchOptions: {
        safesearch: 1,
        pageno: 1,
        language: 'en',
        time_range: 'year' // Focus on recent discussions
    },
    queryOptimization: {
        prefixes: ['discussion about', 'experience with', 'questions about', 'help with'],
        suffixes: ['discussion', 'experience', 'question', 'problem', 'issue', 'community'],
        excludeTerms: ['spam', 'advertisement', 'promotion'],
        includeTerms: ['discussion', 'community', 'experience', 'question', 'help']
    },
    resultFiltering: {
        minContentLength: 100,
        maxResults: 15,
        scoreThreshold: 0.2,
        requiredFields: ['title', 'url', 'content']
    }
};
// Agent configuration registry
export const AGENT_SEARCH_CONFIGS = {
    general: GENERAL_RESEARCH_CONFIG,
    academic: ACADEMIC_RESEARCH_CONFIG,
    computational: COMPUTATIONAL_RESEARCH_CONFIG,
    video: VIDEO_LEARNING_CONFIG,
    community: COMMUNITY_DISCUSSION_CONFIG
};
// Utility functions for working with agent configurations
export class AgentConfigManager {
    /**
     * Get configuration for a specific agent
     */
    static getConfig(agentName) {
        const config = AGENT_SEARCH_CONFIGS[agentName];
        if (!config) {
            throw new Error(`Unknown agent configuration: ${agentName}`);
        }
        return config;
    }
    /**
     * Get all available agent configurations
     */
    static getAllConfigs() {
        return Object.values(AGENT_SEARCH_CONFIGS);
    }
    /**
     * Get agent names
     */
    static getAgentNames() {
        return Object.keys(AGENT_SEARCH_CONFIGS);
    }
    /**
     * Optimize query for a specific agent
     */
    static optimizeQuery(agentName, baseQuery, context) {
        const config = this.getConfig(agentName);
        const { prefixes, suffixes, includeTerms } = config.queryOptimization;
        const queries = [baseQuery]; // Always include original query
        // Add prefix variations
        prefixes.forEach(prefix => {
            queries.push(`${prefix} ${baseQuery}`);
        });
        // Add suffix variations
        suffixes.forEach(suffix => {
            queries.push(`${baseQuery} ${suffix}`);
        });
        // Add context-specific variations
        if (context?.userLevel) {
            const levelTerms = {
                beginner: ['basics', 'introduction', 'simple'],
                intermediate: ['guide', 'tutorial', 'overview'],
                advanced: ['advanced', 'detailed', 'comprehensive']
            };
            const terms = levelTerms[context.userLevel] || [];
            terms.forEach(term => {
                queries.push(`${term} ${baseQuery}`);
            });
        }
        // Add include terms variations
        includeTerms.slice(0, 2).forEach(term => {
            queries.push(`${baseQuery} ${term}`);
        });
        // Remove duplicates and limit to reasonable number
        return [...new Set(queries)].slice(0, 8);
    }
    /**
     * Filter results based on agent configuration
     */
    static filterResults(agentName, results) {
        const config = this.getConfig(agentName);
        const { minContentLength, maxResults, scoreThreshold, requiredFields } = config.resultFiltering;
        let filtered = results.filter(result => {
            // Check required fields
            const hasRequiredFields = requiredFields.every(field => result[field] && result[field].toString().trim().length > 0);
            if (!hasRequiredFields) {
                return false;
            }
            // Check minimum content length
            if (minContentLength && result.content) {
                const contentLength = result.content.toString().length;
                if (contentLength < minContentLength) {
                    return false;
                }
            }
            // Check score threshold
            if (scoreThreshold && result.score !== undefined) {
                if (result.score < scoreThreshold) {
                    return false;
                }
            }
            return true;
        });
        // Apply exclude terms filter
        const excludeTerms = config.queryOptimization.excludeTerms;
        if (excludeTerms.length > 0) {
            filtered = filtered.filter(result => {
                const text = `${result.title || ''} ${result.content || ''}`.toLowerCase();
                return !excludeTerms.some(term => text.includes(term.toLowerCase()));
            });
        }
        // Limit results
        if (maxResults) {
            filtered = filtered.slice(0, maxResults);
        }
        return filtered;
    }
    /**
     * Get search options for an agent
     */
    static getSearchOptions(agentName, overrides) {
        const config = this.getConfig(agentName);
        return {
            ...config.searchOptions,
            engines: config.engines,
            categories: config.categories,
            ...overrides
        };
    }
    /**
     * Validate agent configuration
     */
    static validateConfig(config) {
        try {
            // Check required fields
            if (!config.name || !config.description) {
                return false;
            }
            // Check engines array
            if (!Array.isArray(config.engines)) {
                return false;
            }
            // Check search options
            if (!config.searchOptions || typeof config.searchOptions !== 'object') {
                return false;
            }
            // Check query optimization
            if (!config.queryOptimization ||
                !Array.isArray(config.queryOptimization.prefixes) ||
                !Array.isArray(config.queryOptimization.suffixes)) {
                return false;
            }
            // Check result filtering
            if (!config.resultFiltering ||
                !Array.isArray(config.resultFiltering.requiredFields)) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Config validation error:', error);
            return false;
        }
    }
}
// Export all configurations
export { GENERAL_RESEARCH_CONFIG, ACADEMIC_RESEARCH_CONFIG, COMPUTATIONAL_RESEARCH_CONFIG, VIDEO_LEARNING_CONFIG, COMMUNITY_DISCUSSION_CONFIG };
//# sourceMappingURL=agentConfigs.js.map