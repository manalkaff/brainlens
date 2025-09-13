import { ContentAggregator, defaultContentAggregator, type AggregatedResult, type SourceAttribution, type QualityMetrics, type AggregationConfig, type AggregationSummary } from '../aggregation';
import { ResultScorer, defaultResultScorer, type ScoringConfig, type RankingContext, type ScoredResult } from '../scoring';
import { SourceAttributionAnalyzer, defaultAttributionAnalyzer, type AttributionReport, type AgentContribution, type EngineContribution, type QualityDistribution, type CoverageAnalysis, type RedundancyAnalysis } from '../attribution';
import type { ResearchResult } from '../agents';
export { ContentAggregator, defaultContentAggregator, type AggregatedResult, type SourceAttribution, type QualityMetrics, type AggregationConfig, type AggregationSummary, ResultScorer, defaultResultScorer, type ScoringConfig, type RankingContext, type ScoredResult, SourceAttributionAnalyzer, defaultAttributionAnalyzer, type AttributionReport, type AgentContribution, type EngineContribution, type QualityDistribution, type CoverageAnalysis, type RedundancyAnalysis };
export declare class ResearchAggregationPipeline {
    private aggregator;
    private scorer;
    private attributionAnalyzer;
    constructor(aggregationConfig?: Partial<AggregationConfig>, scoringConfig?: Partial<ScoringConfig>);
    /**
     * Complete aggregation pipeline: aggregate, score, rank, and analyze
     */
    processResearchResults(agentResults: ResearchResult[], topic: string, context?: RankingContext): Promise<{
        results: ScoredResult[];
        summary: AggregationSummary;
        attribution: AttributionReport;
        sourceAttribution: Record<string, number>;
    }>;
    /**
     * Quick aggregation for simple use cases
     */
    quickAggregate(agentResults: ResearchResult[], topic: string, maxResults?: number): Promise<AggregatedResult[]>;
    /**
     * Get configuration summary
     */
    getConfigSummary(): {
        aggregation: AggregationConfig;
        scoring: ScoringConfig;
    };
    /**
     * Update configurations
     */
    updateConfigs(aggregationConfig?: Partial<AggregationConfig>, scoringConfig?: Partial<ScoringConfig>): void;
}
export declare const AGGREGATION_PRESETS: {
    readonly quality: {
        readonly maxResults: 15;
        readonly minRelevanceScore: 0.6;
        readonly minConfidenceScore: 0.7;
        readonly boostFactors: {
            readonly multipleAgents: 0.3;
            readonly highQualitySources: 0.2;
            readonly recentContent: 0.15;
            readonly uniqueContent: 0.15;
        };
    };
    readonly comprehensive: {
        readonly maxResults: 50;
        readonly minRelevanceScore: 0.3;
        readonly minConfidenceScore: 0.4;
        readonly boostFactors: {
            readonly multipleAgents: 0.15;
            readonly highQualitySources: 0.1;
            readonly recentContent: 0.05;
            readonly uniqueContent: 0.2;
        };
    };
    readonly recent: {
        readonly maxResults: 25;
        readonly minRelevanceScore: 0.4;
        readonly minConfidenceScore: 0.5;
        readonly boostFactors: {
            readonly multipleAgents: 0.1;
            readonly highQualitySources: 0.1;
            readonly recentContent: 0.4;
            readonly uniqueContent: 0.1;
        };
    };
    readonly balanced: {
        readonly maxResults: 30;
        readonly minRelevanceScore: 0.4;
        readonly minConfidenceScore: 0.5;
        readonly boostFactors: {
            readonly multipleAgents: 0.2;
            readonly highQualitySources: 0.15;
            readonly recentContent: 0.1;
            readonly uniqueContent: 0.1;
        };
    };
};
export declare const SCORING_PRESETS: {
    readonly academic: {
        readonly weights: {
            readonly relevance: 0.15;
            readonly confidence: 0.15;
            readonly quality: 0.2;
            readonly recency: 0.05;
            readonly uniqueness: 0.08;
            readonly sourceReliability: 0.1;
            readonly engagement: 0;
            readonly credibility: 0.15;
            readonly authorityScore: 0.1;
            readonly factualAccuracy: 0.02;
        };
    };
    readonly general: {
        readonly weights: {
            readonly relevance: 0.2;
            readonly confidence: 0.15;
            readonly quality: 0.15;
            readonly recency: 0.08;
            readonly uniqueness: 0.08;
            readonly sourceReliability: 0.05;
            readonly engagement: 0.05;
            readonly credibility: 0.1;
            readonly authorityScore: 0.05;
            readonly factualAccuracy: 0.04;
        };
    };
    readonly community: {
        readonly weights: {
            readonly relevance: 0.2;
            readonly confidence: 0.1;
            readonly quality: 0.12;
            readonly recency: 0.1;
            readonly uniqueness: 0.08;
            readonly sourceReliability: 0.05;
            readonly engagement: 0.15;
            readonly credibility: 0.08;
            readonly authorityScore: 0.02;
            readonly factualAccuracy: 0.1;
        };
    };
    readonly video: {
        readonly weights: {
            readonly relevance: 0.25;
            readonly confidence: 0.15;
            readonly quality: 0.15;
            readonly recency: 0.1;
            readonly uniqueness: 0.05;
            readonly sourceReliability: 0.05;
            readonly engagement: 0.05;
            readonly credibility: 0.08;
            readonly authorityScore: 0.02;
            readonly factualAccuracy: 0.1;
        };
    };
};
export declare class AggregationUtils {
    /**
     * Create a pipeline with preset configurations
     */
    static createPresetPipeline(aggregationPreset: keyof typeof AGGREGATION_PRESETS, scoringPreset: keyof typeof SCORING_PRESETS): ResearchAggregationPipeline;
    /**
     * Get recommended configuration based on context
     */
    static getRecommendedConfig(context: {
        userLevel?: string;
        learningStyle?: string;
        contentFocus?: string;
        qualityPreference?: 'high' | 'balanced' | 'comprehensive';
    }): {
        aggregation: keyof typeof AGGREGATION_PRESETS;
        scoring: keyof typeof SCORING_PRESETS;
    };
    /**
     * Validate aggregation results
     */
    static validateResults(results: AggregatedResult[]): {
        valid: boolean;
        issues: string[];
        recommendations: string[];
    };
}
export declare const defaultAggregationPipeline: ResearchAggregationPipeline;
//# sourceMappingURL=index.d.ts.map