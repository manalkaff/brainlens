// Research Result Aggregation and Deduplication System
// This module provides comprehensive result aggregation, deduplication, scoring, and attribution
// Import types and classes from other modules
import { ContentAggregator, defaultContentAggregator } from '../aggregation';
import { ResultScorer, defaultResultScorer } from '../scoring';
import { SourceAttributionAnalyzer, defaultAttributionAnalyzer } from '../attribution';
// Re-export everything for convenience
export { ContentAggregator, defaultContentAggregator, ResultScorer, defaultResultScorer, SourceAttributionAnalyzer, defaultAttributionAnalyzer };
// Utility functions and integrated workflow
export class ResearchAggregationPipeline {
    aggregator;
    scorer;
    attributionAnalyzer;
    constructor(aggregationConfig, scoringConfig) {
        this.aggregator = new ContentAggregator(aggregationConfig);
        this.scorer = new ResultScorer(scoringConfig);
        this.attributionAnalyzer = new SourceAttributionAnalyzer();
    }
    /**
     * Complete aggregation pipeline: aggregate, score, rank, and analyze
     */
    async processResearchResults(agentResults, topic, context) {
        // Step 1: Aggregate and deduplicate results
        const aggregationResult = await this.aggregator.aggregateResults(agentResults, topic, context);
        // Step 2: Score and rank results
        const scoredResults = await this.scorer.scoreAndRankResults(aggregationResult.aggregatedResults, context || { topic });
        // Step 3: Generate attribution report
        const attributionReport = await this.attributionAnalyzer.generateAttributionReport(agentResults, aggregationResult.aggregatedResults, topic);
        return {
            results: scoredResults,
            summary: aggregationResult.summary,
            attribution: attributionReport,
            sourceAttribution: aggregationResult.sourceAttribution
        };
    }
    /**
     * Quick aggregation for simple use cases
     */
    async quickAggregate(agentResults, topic, maxResults = 20) {
        // Use default configuration with custom max results
        const customAggregator = new ContentAggregator({ maxResults });
        const result = await customAggregator.aggregateResults(agentResults, topic);
        return result.aggregatedResults;
    }
    /**
     * Get configuration summary
     */
    getConfigSummary() {
        return {
            aggregation: this.aggregator.getConfig(),
            scoring: this.scorer.getConfig()
        };
    }
    /**
     * Update configurations
     */
    updateConfigs(aggregationConfig, scoringConfig) {
        if (aggregationConfig) {
            this.aggregator.updateConfig(aggregationConfig);
        }
        if (scoringConfig) {
            this.scorer.updateConfig(scoringConfig);
        }
    }
}
// ResearchResult type is already imported above
// Export commonly used configurations
export const AGGREGATION_PRESETS = {
    // High quality, fewer results
    quality: {
        maxResults: 15,
        minRelevanceScore: 0.6,
        minConfidenceScore: 0.7,
        boostFactors: {
            multipleAgents: 0.3,
            highQualitySources: 0.2,
            recentContent: 0.15,
            uniqueContent: 0.15
        }
    },
    // Comprehensive coverage
    comprehensive: {
        maxResults: 50,
        minRelevanceScore: 0.3,
        minConfidenceScore: 0.4,
        boostFactors: {
            multipleAgents: 0.15,
            highQualitySources: 0.1,
            recentContent: 0.05,
            uniqueContent: 0.2
        }
    },
    // Recent content focus
    recent: {
        maxResults: 25,
        minRelevanceScore: 0.4,
        minConfidenceScore: 0.5,
        boostFactors: {
            multipleAgents: 0.1,
            highQualitySources: 0.1,
            recentContent: 0.4,
            uniqueContent: 0.1
        }
    },
    // Balanced approach
    balanced: {
        maxResults: 30,
        minRelevanceScore: 0.4,
        minConfidenceScore: 0.5,
        boostFactors: {
            multipleAgents: 0.2,
            highQualitySources: 0.15,
            recentContent: 0.1,
            uniqueContent: 0.1
        }
    }
};
export const SCORING_PRESETS = {
    // Academic focus
    academic: {
        weights: {
            relevance: 0.15,
            confidence: 0.15,
            quality: 0.2,
            recency: 0.05,
            uniqueness: 0.08,
            sourceReliability: 0.1,
            engagement: 0.0,
            credibility: 0.15,
            authorityScore: 0.1,
            factualAccuracy: 0.02
        }
    },
    // General learning
    general: {
        weights: {
            relevance: 0.2,
            confidence: 0.15,
            quality: 0.15,
            recency: 0.08,
            uniqueness: 0.08,
            sourceReliability: 0.05,
            engagement: 0.05,
            credibility: 0.1,
            authorityScore: 0.05,
            factualAccuracy: 0.04
        }
    },
    // Community-focused
    community: {
        weights: {
            relevance: 0.2,
            confidence: 0.1,
            quality: 0.12,
            recency: 0.1,
            uniqueness: 0.08,
            sourceReliability: 0.05,
            engagement: 0.15,
            credibility: 0.08,
            authorityScore: 0.02,
            factualAccuracy: 0.1
        }
    },
    // Video learning
    video: {
        weights: {
            relevance: 0.25,
            confidence: 0.15,
            quality: 0.15,
            recency: 0.1,
            uniqueness: 0.05,
            sourceReliability: 0.05,
            engagement: 0.05,
            credibility: 0.08,
            authorityScore: 0.02,
            factualAccuracy: 0.1
        }
    }
};
// Utility functions
export class AggregationUtils {
    /**
     * Create a pipeline with preset configurations
     */
    static createPresetPipeline(aggregationPreset, scoringPreset) {
        return new ResearchAggregationPipeline(AGGREGATION_PRESETS[aggregationPreset], SCORING_PRESETS[scoringPreset]);
    }
    /**
     * Get recommended configuration based on context
     */
    static getRecommendedConfig(context) {
        // Determine aggregation preset
        let aggregation = 'balanced';
        if (context.qualityPreference === 'high') {
            aggregation = 'quality';
        }
        else if (context.qualityPreference === 'comprehensive') {
            aggregation = 'comprehensive';
        }
        else if (context.contentFocus === 'recent') {
            aggregation = 'recent';
        }
        // Determine scoring preset
        let scoring = 'general';
        if (context.contentFocus === 'academic' || context.userLevel === 'advanced') {
            scoring = 'academic';
        }
        else if (context.learningStyle === 'video') {
            scoring = 'video';
        }
        else if (context.contentFocus === 'community') {
            scoring = 'community';
        }
        return { aggregation, scoring };
    }
    /**
     * Validate aggregation results
     */
    static validateResults(results) {
        const issues = [];
        const recommendations = [];
        // Check for empty results
        if (results.length === 0) {
            issues.push('No results returned');
            recommendations.push('Check search configuration and agent connectivity');
        }
        // Check for low quality results
        const lowQualityCount = results.filter(r => r.metadata.qualityMetrics.overall < 0.4).length;
        if (lowQualityCount > results.length * 0.5) {
            issues.push('High proportion of low-quality results');
            recommendations.push('Increase quality thresholds or improve source reliability');
        }
        // Check for lack of diversity
        const uniqueSources = new Set(results.flatMap(r => r.sources)).size;
        if (uniqueSources < 3) {
            issues.push('Limited source diversity');
            recommendations.push('Check agent connectivity and search engine availability');
        }
        // Check for excessive duplicates
        const highDuplicateCount = results.filter(r => r.duplicateCount > 5).length;
        if (highDuplicateCount > results.length * 0.3) {
            issues.push('High duplicate content rate');
            recommendations.push('Adjust duplicate detection threshold or improve query diversity');
        }
        return {
            valid: issues.length === 0,
            issues,
            recommendations
        };
    }
}
// Export default pipeline instance
export const defaultAggregationPipeline = new ResearchAggregationPipeline();
//# sourceMappingURL=index.js.map