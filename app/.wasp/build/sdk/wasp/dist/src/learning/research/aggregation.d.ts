import type { ResearchResult } from './agents';
export interface AggregatedResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    sources: string[];
    engines: string[];
    relevanceScore: number;
    confidenceScore: number;
    duplicateCount: number;
    metadata: {
        type: string[];
        categories: string[];
        publishedDate?: string;
        author?: string;
        contentLength?: number;
        sourceAttribution: SourceAttribution[];
        qualityMetrics: QualityMetrics;
    };
}
export interface SourceAttribution {
    agent: string;
    engine: string;
    originalScore: number;
    query: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface QualityMetrics {
    contentQuality: number;
    sourceReliability: number;
    recency: number;
    relevance: number;
    uniqueness: number;
    overall: number;
}
export interface AggregationConfig {
    duplicateThreshold: number;
    maxResults: number;
    minRelevanceScore: number;
    minConfidenceScore: number;
    boostFactors: {
        multipleAgents: number;
        highQualitySources: number;
        recentContent: number;
        uniqueContent: number;
    };
    penaltyFactors: {
        duplicateContent: number;
        lowQualitySources: number;
        outdatedContent: number;
    };
}
export declare class ContentAggregator {
    private config;
    constructor(config?: Partial<AggregationConfig>);
    /**
     * Aggregate results from multiple research agents
     */
    aggregateResults(agentResults: ResearchResult[], topic: string, context?: any): Promise<{
        aggregatedResults: AggregatedResult[];
        summary: AggregationSummary;
        sourceAttribution: Record<string, number>;
    }>;
    /**
     * Collect all search results from agent results
     */
    private collectAllResults;
    /**
     * Group duplicate results using similarity detection
     */
    private groupDuplicates;
    /**
     * Calculate similarity between two search results
     */
    private calculateSimilarity;
    /**
     * Calculate text similarity using simple token-based approach
     */
    private calculateTextSimilarity;
    /**
     * Calculate domain similarity
     */
    private calculateDomainSimilarity;
    /**
     * Tokenize text for similarity calculation
     */
    private tokenize;
    /**
     * Create aggregated results from grouped duplicates
     */
    private createAggregatedResults;
    /**
     * Calculate aggregated relevance score
     */
    private calculateAggregatedRelevance;
    /**
     * Calculate confidence score based on multiple factors
     */
    private calculateConfidenceScore;
    /**
     * Calculate comprehensive quality metrics
     */
    private calculateQualityMetrics;
    /**
     * Assess content quality based on various factors
     */
    private assessContentQuality;
    /**
     * Assess source reliability based on domain and engine
     */
    private assessSourceReliability;
    /**
     * Assess content recency
     */
    private assessRecency;
    /**
     * Assess relevance to the topic
     */
    private assessRelevance;
    /**
     * Assess content uniqueness
     */
    private assessUniqueness;
    /**
     * Score and rank aggregated results
     */
    private scoreAndRankResults;
    /**
     * Apply filters and limits to results
     */
    private applyFilters;
    /**
     * Select the best title from multiple results
     */
    private selectBestTitle;
    /**
     * Select the best snippet from multiple results
     */
    private selectBestSnippet;
    /**
     * Select the most recent publication date
     */
    private selectMostRecentDate;
    /**
     * Generate a unique ID for a result
     */
    private generateResultId;
    /**
     * Simple hash function for generating IDs
     */
    private simpleHash;
    /**
     * Generate aggregation summary
     */
    private generateSummary;
    /**
     * Generate source attribution statistics
     */
    private generateSourceAttribution;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AggregationConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): AggregationConfig;
}
export interface AggregationSummary {
    totalOriginalResults: number;
    totalAggregatedResults: number;
    duplicatesRemoved: number;
    successfulAgents: number;
    failedAgents: number;
    averageConfidence: number;
    averageQuality: number;
    processingTime: number;
}
export declare const defaultContentAggregator: ContentAggregator;
//# sourceMappingURL=aggregation.d.ts.map