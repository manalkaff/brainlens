import type { ResearchResult, SearchResult } from './agents';
import type { AggregatedResult, SourceAttribution } from './aggregation';

// Types for source attribution system
export interface AttributionReport {
  totalResults: number;
  agentContributions: AgentContribution[];
  engineContributions: EngineContribution[];
  qualityDistribution: QualityDistribution;
  coverageAnalysis: CoverageAnalysis;
  redundancyAnalysis: RedundancyAnalysis;
  timestamp: Date;
}

export interface AgentContribution {
  agentName: string;
  totalResults: number;
  uniqueResults: number;
  duplicateResults: number;
  averageQuality: number;
  averageRelevance: number;
  successRate: number;
  topDomains: string[];
  contentTypes: string[];
  performance: {
    speed: number; // Results per second
    reliability: number; // Success rate
    uniqueness: number; // Unique content ratio
    quality: number; // Average quality score
  };
}

export interface EngineContribution {
  engineName: string;
  totalResults: number;
  uniqueResults: number;
  averageQuality: number;
  averageRelevance: number;
  agents: string[]; // Which agents use this engine
  domains: string[];
  contentCategories: string[];
}

export interface QualityDistribution {
  excellent: number; // 0.8-1.0
  good: number;      // 0.6-0.8
  fair: number;      // 0.4-0.6
  poor: number;      // 0.0-0.4
  averageScore: number;
  medianScore: number;
}

export interface CoverageAnalysis {
  topicCoverage: number; // How well the topic is covered
  aspectsCovered: string[]; // Different aspects found
  gapsIdentified: string[]; // Potential gaps in coverage
  diversityScore: number; // How diverse the sources are
  comprehensivenessScore: number; // How comprehensive the results are
}

export interface RedundancyAnalysis {
  totalDuplicates: number;
  duplicateRate: number; // Percentage of duplicate content
  mostDuplicatedContent: DuplicateGroup[];
  crossAgentDuplicates: number; // Duplicates found by multiple agents
  engineOverlap: EngineOverlap[];
}

export interface DuplicateGroup {
  content: string;
  count: number;
  agents: string[];
  engines: string[];
  urls: string[];
}

export interface EngineOverlap {
  engine1: string;
  engine2: string;
  overlapCount: number;
  overlapRate: number;
}

// Source attribution and analysis system
export class SourceAttributionAnalyzer {
  /**
   * Generate comprehensive attribution report
   */
  async generateAttributionReport(
    originalResults: ResearchResult[],
    aggregatedResults: AggregatedResult[],
    topic: string
  ): Promise<AttributionReport> {
    const agentContributions = this.analyzeAgentContributions(originalResults, aggregatedResults);
    const engineContributions = this.analyzeEngineContributions(originalResults, aggregatedResults);
    const qualityDistribution = this.analyzeQualityDistribution(aggregatedResults);
    const coverageAnalysis = await this.analyzeCoverage(aggregatedResults, topic);
    const redundancyAnalysis = this.analyzeRedundancy(originalResults, aggregatedResults);

    return {
      totalResults: aggregatedResults.length,
      agentContributions,
      engineContributions,
      qualityDistribution,
      coverageAnalysis,
      redundancyAnalysis,
      timestamp: new Date()
    };
  }

  /**
   * Analyze contributions by each research agent
   */
  private analyzeAgentContributions(
    originalResults: ResearchResult[],
    aggregatedResults: AggregatedResult[]
  ): AgentContribution[] {
    const contributions: AgentContribution[] = [];

    for (const agentResult of originalResults) {
      const agentName = agentResult.agent;
      const agentResults = agentResult.results || [];
      
      // Find aggregated results that include this agent
      const agentAggregatedResults = aggregatedResults.filter(result =>
        result.sources.includes(agentName)
      );

      // Calculate unique results (results only found by this agent)
      const uniqueResults = agentAggregatedResults.filter(result =>
        result.sources.length === 1 && result.sources[0] === agentName
      );

      // Calculate duplicate results
      const duplicateResults = agentAggregatedResults.filter(result =>
        result.sources.length > 1
      );

      // Calculate quality metrics
      const qualityScores = agentAggregatedResults.map(r => r.metadata.qualityMetrics.overall);
      const relevanceScores = agentAggregatedResults.map(r => r.relevanceScore);
      
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;
      
      const averageRelevance = relevanceScores.length > 0
        ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
        : 0;

      // Extract domains and content types
      const domains = this.extractDomains(agentResults);
      const contentTypes = this.extractContentTypes(agentResults);

      // Calculate performance metrics
      const performance = this.calculateAgentPerformance(
        agentResult,
        agentAggregatedResults,
        uniqueResults
      );

      contributions.push({
        agentName,
        totalResults: agentResults.length,
        uniqueResults: uniqueResults.length,
        duplicateResults: duplicateResults.length,
        averageQuality,
        averageRelevance,
        successRate: agentResult.status === 'success' ? 1 : 0,
        topDomains: domains.slice(0, 5),
        contentTypes,
        performance
      });
    }

    return contributions.sort((a, b) => b.totalResults - a.totalResults);
  }

  /**
   * Analyze contributions by search engines
   */
  private analyzeEngineContributions(
    originalResults: ResearchResult[],
    aggregatedResults: AggregatedResult[]
  ): EngineContribution[] {
    const engineMap = new Map<string, {
      results: SearchResult[];
      agents: Set<string>;
      aggregatedResults: AggregatedResult[];
    }>();

    // Collect results by engine
    for (const agentResult of originalResults) {
      if (agentResult.status === 'success' && agentResult.results) {
        for (const result of agentResult.results) {
          const engine = result.source;
          
          if (!engineMap.has(engine)) {
            engineMap.set(engine, {
              results: [],
              agents: new Set(),
              aggregatedResults: []
            });
          }
          
          const engineData = engineMap.get(engine)!;
          engineData.results.push(result);
          engineData.agents.add(agentResult.agent);
        }
      }
    }

    // Find aggregated results for each engine
    for (const aggregatedResult of aggregatedResults) {
      for (const engine of aggregatedResult.engines) {
        const engineData = engineMap.get(engine);
        if (engineData) {
          engineData.aggregatedResults.push(aggregatedResult);
        }
      }
    }

    // Create engine contributions
    const contributions: EngineContribution[] = [];
    
    for (const [engineName, data] of engineMap.entries()) {
      const uniqueResults = data.aggregatedResults.filter(result =>
        result.engines.length === 1 && result.engines[0] === engineName
      );

      const qualityScores = data.aggregatedResults.map(r => r.metadata.qualityMetrics.overall);
      const relevanceScores = data.aggregatedResults.map(r => r.relevanceScore);
      
      const averageQuality = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;
      
      const averageRelevance = relevanceScores.length > 0
        ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
        : 0;

      const domains = this.extractDomains(data.results);
      const categories = this.extractCategories(data.results);

      contributions.push({
        engineName,
        totalResults: data.results.length,
        uniqueResults: uniqueResults.length,
        averageQuality,
        averageRelevance,
        agents: Array.from(data.agents),
        domains: domains.slice(0, 10),
        contentCategories: categories
      });
    }

    return contributions.sort((a, b) => b.totalResults - a.totalResults);
  }

  /**
   * Analyze quality distribution of results
   */
  private analyzeQualityDistribution(results: AggregatedResult[]): QualityDistribution {
    if (results.length === 0) {
      return {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        averageScore: 0,
        medianScore: 0
      };
    }

    const qualityScores = results.map(r => r.metadata.qualityMetrics.overall);
    
    const excellent = qualityScores.filter(score => score >= 0.8).length;
    const good = qualityScores.filter(score => score >= 0.6 && score < 0.8).length;
    const fair = qualityScores.filter(score => score >= 0.4 && score < 0.6).length;
    const poor = qualityScores.filter(score => score < 0.4).length;

    const averageScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    const sortedScores = [...qualityScores].sort((a, b) => a - b);
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];

    return {
      excellent,
      good,
      fair,
      poor,
      averageScore,
      medianScore
    };
  }

  /**
   * Analyze topic coverage
   */
  private async analyzeCoverage(
    results: AggregatedResult[],
    topic: string
  ): Promise<CoverageAnalysis> {
    const aspectsCovered = this.identifyAspectsCovered(results, topic);
    const gapsIdentified = this.identifyGaps(results, topic, aspectsCovered);
    const diversityScore = this.calculateDiversityScore(results);
    const comprehensivenessScore = this.calculateComprehensivenessScore(results, aspectsCovered);
    const topicCoverage = this.calculateTopicCoverage(results, topic);

    return {
      topicCoverage,
      aspectsCovered,
      gapsIdentified,
      diversityScore,
      comprehensivenessScore
    };
  }

  /**
   * Analyze redundancy in results
   */
  private analyzeRedundancy(
    originalResults: ResearchResult[],
    aggregatedResults: AggregatedResult[]
  ): RedundancyAnalysis {
    const totalOriginal = originalResults.reduce((sum, agent) => sum + (agent.results?.length || 0), 0);
    const totalAggregated = aggregatedResults.length;
    const totalDuplicates = totalOriginal - totalAggregated;
    const duplicateRate = totalOriginal > 0 ? (totalDuplicates / totalOriginal) * 100 : 0;

    const mostDuplicatedContent = this.findMostDuplicatedContent(aggregatedResults);
    const crossAgentDuplicates = aggregatedResults.filter(r => r.sources.length > 1).length;
    const engineOverlap = this.calculateEngineOverlap(aggregatedResults);

    return {
      totalDuplicates,
      duplicateRate,
      mostDuplicatedContent,
      crossAgentDuplicates,
      engineOverlap
    };
  }

  /**
   * Calculate agent performance metrics
   */
  private calculateAgentPerformance(
    agentResult: ResearchResult,
    aggregatedResults: AggregatedResult[],
    uniqueResults: AggregatedResult[]
  ): AgentContribution['performance'] {
    const totalResults = agentResult.results?.length || 0;
    const executionTime = 1; // This would be calculated from actual execution time
    
    const speed = totalResults / Math.max(executionTime, 1);
    const reliability = agentResult.status === 'success' ? 1 : 0;
    const uniqueness = totalResults > 0 ? uniqueResults.length / totalResults : 0;
    
    const qualityScores = aggregatedResults.map(r => r.metadata.qualityMetrics.overall);
    const quality = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    return {
      speed,
      reliability,
      uniqueness,
      quality
    };
  }

  /**
   * Extract domains from search results
   */
  private extractDomains(results: SearchResult[]): string[] {
    const domainCounts = new Map<string, number>();
    
    for (const result of results) {
      try {
        const domain = new URL(result.url).hostname.toLowerCase();
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      } catch {
        // Invalid URL, skip
      }
    }
    
    return Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain);
  }

  /**
   * Extract content types from search results
   */
  private extractContentTypes(results: SearchResult[]): string[] {
    const types = new Set<string>();
    
    for (const result of results) {
      if (result.metadata?.type) {
        types.add(result.metadata.type);
      }
    }
    
    return Array.from(types);
  }

  /**
   * Extract categories from search results
   */
  private extractCategories(results: SearchResult[]): string[] {
    const categories = new Set<string>();
    
    for (const result of results) {
      if (result.metadata?.category) {
        categories.add(result.metadata.category);
      }
    }
    
    return Array.from(categories);
  }

  /**
   * Identify aspects covered by the results
   */
  private identifyAspectsCovered(results: AggregatedResult[], topic: string): string[] {
    const aspects = new Set<string>();
    
    // Analyze content types
    for (const result of results) {
      aspects.add(`${result.metadata.type.join(', ')} content`);
      
      // Analyze source types
      for (const source of result.sources) {
        aspects.add(`${source} perspective`);
      }
      
      // Analyze content categories
      for (const category of result.metadata.categories) {
        aspects.add(`${category} information`);
      }
    }
    
    return Array.from(aspects).slice(0, 20); // Limit to top 20 aspects
  }

  /**
   * Identify potential gaps in coverage
   */
  private identifyGaps(
    results: AggregatedResult[],
    topic: string,
    aspectsCovered: string[]
  ): string[] {
    const gaps: string[] = [];
    
    // Check for missing agent types
    const agentTypes = new Set(results.flatMap(r => r.sources));
    const expectedAgents = ['General Research Agent', 'Academic Research Agent', 'Computational Agent', 'Video Learning Agent', 'Community Discussion Agent'];
    
    for (const expectedAgent of expectedAgents) {
      if (!agentTypes.has(expectedAgent)) {
        gaps.push(`Missing ${expectedAgent} perspective`);
      }
    }
    
    // Check for missing content types
    const contentTypes = new Set(results.flatMap(r => r.metadata.type));
    const expectedTypes = ['general', 'academic', 'computational', 'video', 'community'];
    
    for (const expectedType of expectedTypes) {
      if (!contentTypes.has(expectedType)) {
        gaps.push(`Missing ${expectedType} content`);
      }
    }
    
    // Check for recency gaps
    const hasRecentContent = results.some(r => r.metadata.qualityMetrics.recency > 0.8);
    if (!hasRecentContent) {
      gaps.push('Limited recent content');
    }
    
    return gaps;
  }

  /**
   * Calculate diversity score
   */
  private calculateDiversityScore(results: AggregatedResult[]): number {
    if (results.length === 0) return 0;
    
    // Calculate diversity across multiple dimensions
    const domainDiversity = this.calculateDomainDiversity(results);
    const sourceDiversity = this.calculateSourceDiversity(results);
    const contentTypeDiversity = this.calculateContentTypeDiversity(results);
    const qualityDiversity = this.calculateQualityDiversity(results);
    
    return (domainDiversity + sourceDiversity + contentTypeDiversity + qualityDiversity) / 4;
  }

  /**
   * Calculate comprehensiveness score
   */
  private calculateComprehensivenessScore(
    results: AggregatedResult[],
    aspectsCovered: string[]
  ): number {
    // Base score from number of results
    const resultScore = Math.min(1.0, results.length / 20); // Max score at 20+ results
    
    // Aspect coverage score
    const aspectScore = Math.min(1.0, aspectsCovered.length / 15); // Max score at 15+ aspects
    
    // Quality score
    const qualityScores = results.map(r => r.metadata.qualityMetrics.overall);
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;
    
    return (resultScore + aspectScore + avgQuality) / 3;
  }

  /**
   * Calculate topic coverage score
   */
  private calculateTopicCoverage(results: AggregatedResult[], topic: string): number {
    if (results.length === 0) return 0;
    
    const topicWords = topic.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    let totalCoverage = 0;
    
    for (const result of results) {
      const content = (result.title + ' ' + result.snippet).toLowerCase();
      const coveredWords = topicWords.filter(word => content.includes(word));
      const coverage = coveredWords.length / topicWords.length;
      totalCoverage += coverage;
    }
    
    return totalCoverage / results.length;
  }

  /**
   * Find most duplicated content
   */
  private findMostDuplicatedContent(results: AggregatedResult[]): DuplicateGroup[] {
    const duplicateGroups: DuplicateGroup[] = [];
    
    // Find results with high duplicate counts
    const highDuplicateResults = results
      .filter(r => r.duplicateCount > 1)
      .sort((a, b) => b.duplicateCount - a.duplicateCount)
      .slice(0, 10);
    
    for (const result of highDuplicateResults) {
      duplicateGroups.push({
        content: result.title,
        count: result.duplicateCount + 1, // +1 for the original
        agents: result.sources,
        engines: result.engines,
        urls: [result.url] // In a real implementation, this would include all duplicate URLs
      });
    }
    
    return duplicateGroups;
  }

  /**
   * Calculate engine overlap
   */
  private calculateEngineOverlap(results: AggregatedResult[]): EngineOverlap[] {
    const enginePairs = new Map<string, { count: number; total1: number; total2: number }>();
    const engineCounts = new Map<string, number>();
    
    // Count engine occurrences
    for (const result of results) {
      for (const engine of result.engines) {
        engineCounts.set(engine, (engineCounts.get(engine) || 0) + 1);
      }
    }
    
    // Count engine pair overlaps
    for (const result of results) {
      const engines = result.engines;
      for (let i = 0; i < engines.length; i++) {
        for (let j = i + 1; j < engines.length; j++) {
          const engine1 = engines[i];
          const engine2 = engines[j];
          const pairKey = [engine1, engine2].sort().join('-');
          
          if (!enginePairs.has(pairKey)) {
            enginePairs.set(pairKey, {
              count: 0,
              total1: engineCounts.get(engine1) || 0,
              total2: engineCounts.get(engine2) || 0
            });
          }
          
          enginePairs.get(pairKey)!.count++;
        }
      }
    }
    
    // Calculate overlap rates
    const overlaps: EngineOverlap[] = [];
    for (const [pairKey, data] of enginePairs.entries()) {
      const [engine1, engine2] = pairKey.split('-');
      const overlapRate = data.count / Math.min(data.total1, data.total2);
      
      overlaps.push({
        engine1,
        engine2,
        overlapCount: data.count,
        overlapRate
      });
    }
    
    return overlaps.sort((a, b) => b.overlapCount - a.overlapCount);
  }

  /**
   * Calculate domain diversity
   */
  private calculateDomainDiversity(results: AggregatedResult[]): number {
    const domains = new Set<string>();
    
    for (const result of results) {
      try {
        const domain = new URL(result.url).hostname;
        domains.add(domain);
      } catch {
        // Invalid URL, skip
      }
    }
    
    return Math.min(1.0, domains.size / Math.max(results.length * 0.7, 1));
  }

  /**
   * Calculate source diversity
   */
  private calculateSourceDiversity(results: AggregatedResult[]): number {
    const sources = new Set<string>();
    
    for (const result of results) {
      for (const source of result.sources) {
        sources.add(source);
      }
    }
    
    return Math.min(1.0, sources.size / 5); // Max diversity with all 5 agents
  }

  /**
   * Calculate content type diversity
   */
  private calculateContentTypeDiversity(results: AggregatedResult[]): number {
    const types = new Set<string>();
    
    for (const result of results) {
      for (const type of result.metadata.type) {
        types.add(type);
      }
    }
    
    return Math.min(1.0, types.size / 5); // Max diversity with all 5 content types
  }

  /**
   * Calculate quality diversity
   */
  private calculateQualityDiversity(results: AggregatedResult[]): number {
    if (results.length === 0) return 0;
    
    const qualityScores = results.map(r => r.metadata.qualityMetrics.overall);
    const mean = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const variance = qualityScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / qualityScores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalize standard deviation to 0-1 scale
    return Math.min(1.0, standardDeviation * 4); // Multiply by 4 to scale appropriately
  }
}

// Export default instance
export const defaultAttributionAnalyzer = new SourceAttributionAnalyzer();