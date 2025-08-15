import type { AggregatedResult } from './aggregation';

// Types for scoring and ranking system
export interface ScoringConfig {
  weights: {
    relevance: number;
    confidence: number;
    quality: number;
    recency: number;
    uniqueness: number;
    sourceReliability: number;
    engagement: number; // For community content
  };
  contextBoosts: {
    userLevel: number;
    learningStyle: number;
    topicMatch: number;
    contentType: number;
  };
  penalties: {
    duplicateContent: number;
    lowQuality: number;
    outdated: number;
    irrelevant: number;
  };
}

const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    relevance: 0.25,
    confidence: 0.20,
    quality: 0.20,
    recency: 0.10,
    uniqueness: 0.10,
    sourceReliability: 0.10,
    engagement: 0.05
  },
  contextBoosts: {
    userLevel: 0.15,
    learningStyle: 0.10,
    topicMatch: 0.20,
    contentType: 0.10
  },
  penalties: {
    duplicateContent: 0.20,
    lowQuality: 0.25,
    outdated: 0.15,
    irrelevant: 0.30
  }
};

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

// Advanced scoring and ranking system
export class ResultScorer {
  private config: ScoringConfig;

  constructor(config?: Partial<ScoringConfig>) {
    this.config = this.mergeConfig(DEFAULT_SCORING_CONFIG, config);
  }

  /**
   * Score and rank aggregated results
   */
  async scoreAndRankResults(
    results: AggregatedResult[],
    context: RankingContext
  ): Promise<ScoredResult[]> {
    // Step 1: Calculate base scores for all results
    const scoredResults = await Promise.all(
      results.map(result => this.calculateScore(result, context))
    );

    // Step 2: Apply relative ranking adjustments
    const adjustedResults = this.applyRelativeAdjustments(scoredResults, context);

    // Step 3: Sort by final score
    adjustedResults.sort((a, b) => b.finalScore - a.finalScore);

    // Step 4: Assign rankings and tiers
    return this.assignRankingsAndTiers(adjustedResults);
  }

  /**
   * Calculate comprehensive score for a single result
   */
  private async calculateScore(
    result: AggregatedResult,
    context: RankingContext
  ): Promise<ScoredResult> {
    // Calculate base score using weighted metrics
    const baseScore = this.calculateBaseScore(result);

    // Calculate context-specific boosts
    const contextBoosts = this.calculateContextBoosts(result, context);

    // Calculate penalties
    const penalties = this.calculatePenalties(result, context);

    // Calculate final score
    const finalScore = Math.max(0, Math.min(1, baseScore + contextBoosts - penalties));

    // Create score breakdown for transparency
    const scoreBreakdown = {
      baseScore,
      contextBoosts,
      penalties,
      adjustments: {
        relevanceBoost: this.calculateRelevanceBoost(result, context),
        qualityBoost: this.calculateQualityBoost(result),
        recencyBoost: this.calculateRecencyBoost(result, context),
        sourceBoost: this.calculateSourceBoost(result),
        userLevelMatch: this.calculateUserLevelMatch(result, context),
        contentTypeMatch: this.calculateContentTypeMatch(result, context)
      }
    };

    return {
      ...result,
      finalScore,
      scoreBreakdown,
      ranking: 0, // Will be set later
      tier: 'fair' // Will be set later
    };
  }

  /**
   * Calculate base score using weighted metrics
   */
  private calculateBaseScore(result: AggregatedResult): number {
    const metrics = result.metadata.qualityMetrics;
    const weights = this.config.weights;

    return (
      result.relevanceScore * weights.relevance +
      result.confidenceScore * weights.confidence +
      metrics.overall * weights.quality +
      metrics.recency * weights.recency +
      metrics.uniqueness * weights.uniqueness +
      metrics.sourceReliability * weights.sourceReliability +
      this.calculateEngagementScore(result) * weights.engagement
    );
  }

  /**
   * Calculate context-specific boosts
   */
  private calculateContextBoosts(result: AggregatedResult, context: RankingContext): number {
    let totalBoost = 0;

    // User level matching boost
    totalBoost += this.calculateUserLevelMatch(result, context) * this.config.contextBoosts.userLevel;

    // Learning style matching boost
    totalBoost += this.calculateLearningStyleMatch(result, context) * this.config.contextBoosts.learningStyle;

    // Topic matching boost
    totalBoost += this.calculateTopicMatch(result, context) * this.config.contextBoosts.topicMatch;

    // Content type preference boost
    totalBoost += this.calculateContentTypeMatch(result, context) * this.config.contextBoosts.contentType;

    return totalBoost;
  }

  /**
   * Calculate penalties for various factors
   */
  private calculatePenalties(result: AggregatedResult, context: RankingContext): number {
    let totalPenalty = 0;

    // Duplicate content penalty
    if (result.duplicateCount > 2) {
      totalPenalty += this.config.penalties.duplicateContent * (result.duplicateCount / 10);
    }

    // Low quality penalty
    if (result.metadata.qualityMetrics.overall < 0.4) {
      totalPenalty += this.config.penalties.lowQuality;
    }

    // Outdated content penalty
    if (context.timePreference === 'recent' && result.metadata.qualityMetrics.recency < 0.3) {
      totalPenalty += this.config.penalties.outdated;
    }

    // Irrelevant content penalty
    if (this.isIrrelevant(result, context)) {
      totalPenalty += this.config.penalties.irrelevant;
    }

    return totalPenalty;
  }

  /**
   * Calculate engagement score (for community content)
   */
  private calculateEngagementScore(result: AggregatedResult): number {
    // Look for engagement indicators in metadata
    const attribution = result.metadata.sourceAttribution;
    let engagementScore = 0.5; // Base score

    for (const source of attribution) {
      if (source.metadata?.upvotes) {
        engagementScore += Math.min(0.3, source.metadata.upvotes / 1000);
      }
      if (source.metadata?.comments) {
        engagementScore += Math.min(0.2, source.metadata.comments / 100);
      }
      if (source.metadata?.views) {
        const views = this.parseViewCount(source.metadata.views);
        engagementScore += Math.min(0.2, views / 100000);
      }
    }

    return Math.min(1.0, engagementScore);
  }

  /**
   * Calculate user level matching score
   */
  private calculateUserLevelMatch(result: AggregatedResult, context: RankingContext): number {
    if (!context.userLevel) return 0.5;

    const content = (result.title + ' ' + result.snippet).toLowerCase();
    const userLevel = context.userLevel;

    // Check for level indicators in content
    const levelIndicators = {
      beginner: ['beginner', 'basic', 'introduction', 'getting started', '101', 'fundamentals'],
      intermediate: ['intermediate', 'guide', 'tutorial', 'overview', 'practical'],
      advanced: ['advanced', 'expert', 'deep dive', 'comprehensive', 'detailed', 'professional']
    };

    const indicators = levelIndicators[userLevel] || [];
    const matchCount = indicators.filter(indicator => content.includes(indicator)).length;

    // Base score for appropriate level
    let score = 0.5;

    // Boost for level-appropriate content
    if (matchCount > 0) {
      score += Math.min(0.5, matchCount * 0.1);
    }

    // Penalty for inappropriate level
    const inappropriateIndicators = Object.entries(levelIndicators)
      .filter(([level]) => level !== userLevel)
      .flatMap(([, indicators]) => indicators);

    const inappropriateCount = inappropriateIndicators.filter(indicator => content.includes(indicator)).length;
    if (inappropriateCount > matchCount) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate learning style matching score
   */
  private calculateLearningStyleMatch(result: AggregatedResult, context: RankingContext): number {
    if (!context.learningStyle) return 0.5;

    const learningStyle = context.learningStyle;
    let score = 0.5;

    // Check content types in sources
    const hasVideo = result.metadata.type.includes('video') || result.sources.includes('Video Learning Agent');
    const hasVisual = result.metadata.sourceAttribution.some(s => s.metadata?.thumbnail);
    const hasInteractive = result.metadata.type.includes('computational') || result.sources.includes('Computational Agent');
    const hasText = result.metadata.type.includes('academic') || result.metadata.type.includes('general');
    const hasCommunity = result.metadata.type.includes('community') || result.sources.includes('Community Discussion Agent');

    switch (learningStyle) {
      case 'visual':
        if (hasVideo || hasVisual) score += 0.3;
        break;
      case 'video':
        if (hasVideo) score += 0.4;
        break;
      case 'interactive':
        if (hasInteractive) score += 0.3;
        break;
      case 'textual':
        if (hasText) score += 0.3;
        break;
      case 'conversational':
        if (hasCommunity) score += 0.3;
        break;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate topic matching score
   */
  private calculateTopicMatch(result: AggregatedResult, context: RankingContext): number {
    const topic = context.topic.toLowerCase();
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();

    let score = 0;

    // Exact topic match in title
    if (title.includes(topic)) {
      score += 0.5;
    }

    // Topic keywords in title
    const topicWords = topic.split(/\s+/).filter(word => word.length > 2);
    const titleMatches = topicWords.filter(word => title.includes(word)).length;
    score += (titleMatches / topicWords.length) * 0.3;

    // Topic keywords in snippet
    const snippetMatches = topicWords.filter(word => snippet.includes(word)).length;
    score += (snippetMatches / topicWords.length) * 0.2;

    // Additional keywords boost
    if (context.keywords) {
      const keywordMatches = context.keywords.filter(keyword => 
        title.includes(keyword.toLowerCase()) || snippet.includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / context.keywords.length) * 0.2;
    }

    // Exclude keywords penalty
    if (context.excludeKeywords) {
      const excludeMatches = context.excludeKeywords.filter(keyword =>
        title.includes(keyword.toLowerCase()) || snippet.includes(keyword.toLowerCase())
      ).length;
      score -= excludeMatches * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate content type matching score
   */
  private calculateContentTypeMatch(result: AggregatedResult, context: RankingContext): number {
    if (!context.preferredContentTypes || context.preferredContentTypes.length === 0) {
      return 0.5;
    }

    const resultTypes = result.metadata.type;
    const preferredTypes = context.preferredContentTypes;

    const matches = resultTypes.filter(type => 
      preferredTypes.some(preferred => type.toLowerCase().includes(preferred.toLowerCase()))
    ).length;

    return matches / Math.max(preferredTypes.length, 1);
  }

  /**
   * Calculate relevance boost
   */
  private calculateRelevanceBoost(result: AggregatedResult, context: RankingContext): number {
    // Additional relevance boost based on multiple factors
    let boost = 0;

    // Multiple agent confirmation boost
    if (result.sources.length > 2) {
      boost += 0.1;
    }

    // High confidence boost
    if (result.confidenceScore > 0.8) {
      boost += 0.05;
    }

    return boost;
  }

  /**
   * Calculate quality boost
   */
  private calculateQualityBoost(result: AggregatedResult): number {
    const quality = result.metadata.qualityMetrics.overall;
    
    if (quality > 0.9) return 0.1;
    if (quality > 0.8) return 0.05;
    if (quality > 0.7) return 0.02;
    
    return 0;
  }

  /**
   * Calculate recency boost
   */
  private calculateRecencyBoost(result: AggregatedResult, context: RankingContext): number {
    if (context.timePreference !== 'recent') return 0;
    
    const recency = result.metadata.qualityMetrics.recency;
    
    if (recency > 0.9) return 0.1;
    if (recency > 0.7) return 0.05;
    
    return 0;
  }

  /**
   * Calculate source boost
   */
  private calculateSourceBoost(result: AggregatedResult): number {
    const reliability = result.metadata.qualityMetrics.sourceReliability;
    
    if (reliability > 0.9) return 0.1;
    if (reliability > 0.8) return 0.05;
    
    return 0;
  }

  /**
   * Check if result is irrelevant
   */
  private isIrrelevant(result: AggregatedResult, context: RankingContext): boolean {
    // Check for exclude keywords
    if (context.excludeKeywords) {
      const content = (result.title + ' ' + result.snippet).toLowerCase();
      return context.excludeKeywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
    }

    // Check quality threshold
    if (context.qualityThreshold && result.metadata.qualityMetrics.overall < context.qualityThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Apply relative adjustments based on result set
   */
  private applyRelativeAdjustments(
    results: ScoredResult[],
    context: RankingContext
  ): ScoredResult[] {
    if (results.length === 0) return results;

    // Calculate diversity bonus
    const diversityBonus = this.calculateDiversityBonus(results);
    
    // Apply diversity adjustments
    for (let i = 0; i < results.length; i++) {
      results[i].finalScore += diversityBonus[i];
      results[i].scoreBreakdown.adjustments.diversityBonus = diversityBonus[i];
    }

    return results;
  }

  /**
   * Calculate diversity bonus to promote varied results
   */
  private calculateDiversityBonus(results: ScoredResult[]): number[] {
    const bonuses = new Array(results.length).fill(0);
    
    // Track seen domains and content types
    const seenDomains = new Set<string>();
    const seenTypes = new Set<string>();
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      try {
        const domain = new URL(result.url).hostname;
        const types = result.metadata.type;
        
        // Bonus for new domain
        if (!seenDomains.has(domain)) {
          bonuses[i] += 0.02;
          seenDomains.add(domain);
        }
        
        // Bonus for new content type
        for (const type of types) {
          if (!seenTypes.has(type)) {
            bonuses[i] += 0.01;
            seenTypes.add(type);
          }
        }
        
      } catch {
        // Invalid URL, skip domain bonus
      }
    }
    
    return bonuses;
  }

  /**
   * Assign rankings and quality tiers
   */
  private assignRankingsAndTiers(results: ScoredResult[]): ScoredResult[] {
    for (let i = 0; i < results.length; i++) {
      results[i].ranking = i + 1;
      results[i].tier = this.determineTier(results[i].finalScore);
    }
    
    return results;
  }

  /**
   * Determine quality tier based on final score
   */
  private determineTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Parse view count string to number
   */
  private parseViewCount(viewStr: string): number {
    if (!viewStr) return 0;
    
    const str = viewStr.toLowerCase().replace(/[,\s]/g, '');
    const match = str.match(/(\d+(?:\.\d+)?)(k|m|b)?/);
    
    if (!match) return 0;
    
    const num = parseFloat(match[1]);
    const suffix = match[2];
    
    switch (suffix) {
      case 'k': return num * 1000;
      case 'm': return num * 1000000;
      case 'b': return num * 1000000000;
      default: return num;
    }
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(base: ScoringConfig, override?: Partial<ScoringConfig>): ScoringConfig {
    if (!override) return base;
    
    return {
      weights: { ...base.weights, ...override.weights },
      contextBoosts: { ...base.contextBoosts, ...override.contextBoosts },
      penalties: { ...base.penalties, ...override.penalties }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ScoringConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): ScoringConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}

// Export default instance
export const defaultResultScorer = new ResultScorer();