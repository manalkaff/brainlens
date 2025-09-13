import type { ResearchResult } from './agents';
import type { AggregatedResult } from './aggregation';
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
        speed: number;
        reliability: number;
        uniqueness: number;
        quality: number;
    };
}
export interface EngineContribution {
    engineName: string;
    totalResults: number;
    uniqueResults: number;
    averageQuality: number;
    averageRelevance: number;
    agents: string[];
    domains: string[];
    contentCategories: string[];
}
export interface QualityDistribution {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    averageScore: number;
    medianScore: number;
}
export interface CoverageAnalysis {
    topicCoverage: number;
    aspectsCovered: string[];
    gapsIdentified: string[];
    diversityScore: number;
    comprehensivenessScore: number;
}
export interface RedundancyAnalysis {
    totalDuplicates: number;
    duplicateRate: number;
    mostDuplicatedContent: DuplicateGroup[];
    crossAgentDuplicates: number;
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
export declare class SourceAttributionAnalyzer {
    /**
     * Generate comprehensive attribution report
     */
    generateAttributionReport(originalResults: ResearchResult[], aggregatedResults: AggregatedResult[], topic: string): Promise<AttributionReport>;
    /**
     * Analyze contributions by each research agent
     */
    private analyzeAgentContributions;
    /**
     * Analyze contributions by search engines
     */
    private analyzeEngineContributions;
    /**
     * Analyze quality distribution of results
     */
    private analyzeQualityDistribution;
    /**
     * Analyze topic coverage
     */
    private analyzeCoverage;
    /**
     * Analyze redundancy in results
     */
    private analyzeRedundancy;
    /**
     * Calculate agent performance metrics
     */
    private calculateAgentPerformance;
    /**
     * Extract domains from search results
     */
    private extractDomains;
    /**
     * Extract content types from search results
     */
    private extractContentTypes;
    /**
     * Extract categories from search results
     */
    private extractCategories;
    /**
     * Identify aspects covered by the results
     */
    private identifyAspectsCovered;
    /**
     * Identify potential gaps in coverage
     */
    private identifyGaps;
    /**
     * Calculate diversity score
     */
    private calculateDiversityScore;
    /**
     * Calculate comprehensiveness score
     */
    private calculateComprehensivenessScore;
    /**
     * Calculate topic coverage score
     */
    private calculateTopicCoverage;
    /**
     * Find most duplicated content
     */
    private findMostDuplicatedContent;
    /**
     * Calculate engine overlap
     */
    private calculateEngineOverlap;
    /**
     * Calculate domain diversity
     */
    private calculateDomainDiversity;
    /**
     * Calculate source diversity
     */
    private calculateSourceDiversity;
    /**
     * Calculate content type diversity
     */
    private calculateContentTypeDiversity;
    /**
     * Calculate quality diversity
     */
    private calculateQualityDiversity;
}
export declare const defaultAttributionAnalyzer: SourceAttributionAnalyzer;
//# sourceMappingURL=attribution.d.ts.map