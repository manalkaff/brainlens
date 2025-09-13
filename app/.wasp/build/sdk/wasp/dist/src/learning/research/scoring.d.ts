import type { AggregatedResult } from './aggregation';
export interface ScoringConfig {
    weights: {
        relevance: number;
        confidence: number;
        quality: number;
        recency: number;
        uniqueness: number;
        sourceReliability: number;
        engagement: number;
        credibility: number;
        authorityScore: number;
        factualAccuracy: number;
    };
    contextBoosts: {
        userLevel: number;
        learningStyle: number;
        topicMatch: number;
        contentType: number;
        domainExpertise: number;
        peerValidation: number;
    };
    penalties: {
        duplicateContent: number;
        lowQuality: number;
        outdated: number;
        irrelevant: number;
        suspiciousContent: number;
        biasIndicators: number;
    };
    credibilityFactors: {
        domainWeights: Record<string, number>;
        sourceTypes: Record<string, number>;
        authorityIndicators: string[];
        qualityMarkers: string[];
        suspiciousPatterns: string[];
    };
}
export interface RankingContext {
    topic: string;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningStyle?: 'visual' | 'textual' | 'interactive' | 'video' | 'conversational';
    preferredContentTypes?: string[];
    keywords?: string[];
    excludeKeywords?: string[];
    timePreference?: 'recent' | 'any' | 'historical';
    qualityThreshold?: number;
}
export interface ScoredResult extends AggregatedResult {
    finalScore: number;
    scoreBreakdown: {
        baseScore: number;
        contextBoosts: number;
        penalties: number;
        adjustments: Record<string, number>;
    };
    ranking: number;
    tier: 'excellent' | 'good' | 'fair' | 'poor';
}
export declare class ResultScorer {
    private config;
    constructor(config?: Partial<ScoringConfig>);
    /**
     * Score and rank aggregated results
     */
    scoreAndRankResults(results: AggregatedResult[], context: RankingContext): Promise<ScoredResult[]>;
    /**
     * Calculate comprehensive score for a single result
     */
    private calculateScore;
    /**
     * Calculate base score using weighted metrics
     */
    private calculateBaseScore;
    /**
     * Calculate context-specific boosts
     */
    private calculateContextBoosts;
    /**
     * Calculate penalties for various factors
     */
    private calculatePenalties;
    /**
     * Calculate engagement score (for community content)
     */
    private calculateEngagementScore;
    /**
     * Calculate user level matching score
     */
    private calculateUserLevelMatch;
    /**
     * Calculate learning style matching score
     */
    private calculateLearningStyleMatch;
    /**
     * Calculate topic matching score
     */
    private calculateTopicMatch;
    /**
     * Calculate content type matching score
     */
    private calculateContentTypeMatch;
    /**
     * Calculate relevance boost
     */
    private calculateRelevanceBoost;
    /**
     * Calculate quality boost
     */
    private calculateQualityBoost;
    /**
     * Calculate recency boost
     */
    private calculateRecencyBoost;
    /**
     * Calculate source boost
     */
    private calculateSourceBoost;
    /**
     * Check if result is irrelevant
     */
    private isIrrelevant;
    /**
     * Apply relative adjustments based on result set
     */
    private applyRelativeAdjustments;
    /**
     * Calculate diversity bonus to promote varied results
     */
    private calculateDiversityBonus;
    /**
     * Assign rankings and quality tiers
     */
    private assignRankingsAndTiers;
    /**
     * Determine quality tier based on final score
     */
    private determineTier;
    /**
     * Parse view count string to number
     */
    private parseViewCount;
    /**
     * Merge configuration objects
     */
    private mergeConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ScoringConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): ScoringConfig;
    /**
     * Calculate credibility score based on source and content analysis
     */
    private calculateCredibilityScore;
    /**
     * Calculate authority score based on author and institutional indicators
     */
    private calculateAuthorityScore;
    /**
     * Calculate factual accuracy score based on content analysis
     */
    private calculateFactualAccuracyScore;
    /**
     * Get domain-specific credibility score
     */
    private getDomainCredibilityScore;
    /**
     * Get source type credibility
     */
    private getSourceTypeCredibility;
    /**
     * Analyze content for credibility indicators
     */
    private analyzeContentCredibility;
    /**
     * Detect authority indicators in content
     */
    private detectAuthorityIndicators;
    /**
     * Enhanced context boost calculation with new factors
     */
    private calculateEnhancedContextBoosts;
    /**
     * Check if result demonstrates domain expertise
     */
    private hasDomainExpertise;
    /**
     * Check if result has peer validation
     */
    private hasPeerValidation;
    /**
     * Count technical terms relevant to the topic
     */
    private countTechnicalTerms;
    /**
     * Enhanced penalty calculation with new factors
     */
    private calculateEnhancedPenalties;
    /**
     * Detect suspicious content patterns
     */
    private hasSuspiciousContent;
    /**
     * Detect bias indicators in content
     */
    private detectBiasIndicators;
}
export declare const defaultResultScorer: ResultScorer;
//# sourceMappingURL=scoring.d.ts.map