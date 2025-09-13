import type { Topic } from "wasp/entities";
import type { ResearchResult } from "../research/agents";
export interface TopicDomain {
    primary: DomainType;
    secondary: DomainType[];
    confidence: number;
    characteristics: DomainCharacteristics;
}
export declare enum DomainType {
    TECHNOLOGY = "technology",
    BUSINESS = "business",
    SCIENCE = "science",
    MATHEMATICS = "mathematics",
    ARTS_HUMANITIES = "arts_humanities",
    HEALTH_MEDICINE = "health_medicine",
    EDUCATION = "education",
    SOCIAL_SCIENCES = "social_sciences",
    ENGINEERING = "engineering",
    FINANCE = "finance"
}
export interface DomainCharacteristics {
    requiresCodeExamples: boolean;
    emphasizesTheory: boolean;
    focusesOnPractical: boolean;
    needsVisualExplanations: boolean;
    benefitsFromCommunity: boolean;
    requiresFormulas: boolean;
    includesResearch: boolean;
    hasIndustryApplications: boolean;
}
export interface EnhancedResearchResult extends ResearchResult {
    processedSources: ProcessedSource[];
    agentWeight: number;
    domainRelevance: number;
}
export interface ProcessedSource {
    id: string;
    title: string;
    url: string;
    content: string;
    agentType: string;
    relevanceScore: number;
    metadata: SourceMetadata;
    contentType: "overview" | "detailed" | "example" | "tutorial" | "research" | "discussion";
}
export interface SourceMetadata {
    citations?: number;
    author?: string;
    venue?: string;
    year?: number;
    duration?: string;
    views?: string;
    educationalValue?: boolean;
    difficulty?: "beginner" | "intermediate" | "advanced";
    upvotes?: number;
    comments?: number;
    subreddit?: string;
    sentiment?: "positive" | "negative" | "neutral";
    practicalValue?: "high" | "medium" | "low";
    hasFormulas?: boolean;
    hasAlgorithms?: boolean;
    complexity?: "basic" | "intermediate" | "advanced";
    trustScore?: number;
    recency?: number;
}
export interface MultiAgentContent {
    content: string;
    metadata: {
        domain: TopicDomain;
        agentContributions: AgentContribution[];
        totalSources: number;
        generationStrategy: string;
        sectionsGenerated: string[];
        estimatedReadTime: number;
    };
}
export interface AgentContribution {
    agentName: string;
    agentType: string;
    sourcesUsed: number;
    sectionsCreated: string[];
    confidenceScore: number;
}
/**
 * Domain Classification System
 * Intelligently classifies topics to determine optimal content structure
 */
export declare class TopicDomainClassifier {
    private model;
    classifyTopic(topic: Topic, researchResults: ResearchResult[]): Promise<TopicDomain>;
    private fallbackClassification;
}
/**
 * Research Result Processor
 * Enhances research results with domain-aware processing and source organization
 */
export declare class ResearchResultProcessor {
    processResearchResults(researchResults: ResearchResult[], domain: TopicDomain): EnhancedResearchResult[];
    private enhanceResearchResult;
    private calculateAgentWeight;
    private calculateDomainRelevance;
    private processSource;
    /**
     * Normalize legacy agent types to proper agent names
     */
    private normalizeAgentType;
    private classifySourceContent;
    private extractSourceMetadata;
    private calculateTrustScore;
    private calculateRecency;
}
/**
 * Base class for specialized content generators
 */
export declare abstract class BaseContentGenerator {
    protected model: import("@ai-sdk/provider").LanguageModelV2;
    abstract generateContent(topic: Topic, sources: ProcessedSource[], domain: TopicDomain, context?: any): Promise<string>;
    protected buildSourceContext(sources: ProcessedSource[], maxSources?: number): string;
    protected buildSourceAttribution(sources: ProcessedSource[]): string;
}
/**
 * Comprehensive Overview Generator
 * Uses General Research Agent results to create foundational content
 */
export declare class OverviewContentGenerator extends BaseContentGenerator {
    generateContent(topic: Topic, sources: ProcessedSource[], domain: TopicDomain, context?: any): Promise<string>;
}
/**
 * Academic Evidence Synthesizer
 * Leverages academic papers with proper citations and credibility
 */
export declare class AcademicContentGenerator extends BaseContentGenerator {
    generateContent(topic: Topic, sources: ProcessedSource[], domain: TopicDomain, context?: any): Promise<string>;
}
/**
 * Technical Deep-Dive Generator
 * Uses computational data for formulas, algorithms, technical specifications
 */
export declare class TechnicalContentGenerator extends BaseContentGenerator {
    generateContent(topic: Topic, sources: ProcessedSource[], domain: TopicDomain, context?: any): Promise<string>;
}
/**
 * Visual Learning Creator
 * Integrates video content with educational scaffolding
 */
export declare class VisualContentGenerator extends BaseContentGenerator {
    generateContent(topic: Topic, sources: ProcessedSource[], domain: TopicDomain, context?: any): Promise<string>;
}
/**
 * Real-World Application Builder
 * Uses community insights for practical applications and common questions
 */
export declare class PracticalContentGenerator extends BaseContentGenerator {
    generateContent(topic: Topic, sources: ProcessedSource[], domain: TopicDomain, context?: any): Promise<string>;
}
/**
 * Multi-Agent Content Orchestrator
 * Coordinates all specialized content generators to create comprehensive exploration content
 */
export declare class MultiAgentContentOrchestrator {
    private domainClassifier;
    private resultProcessor;
    private generators;
    constructor();
    /**
     * Generate comprehensive exploration content using multi-agent approach
     */
    generateExplorationContent(topic: Topic, subtopics: string[], researchResults: ResearchResult[], context?: any): Promise<MultiAgentContent>;
    /**
     * Generate individual content sections using specialized generators
     */
    private generateContentSections;
    /**
     * Create a plan for which generators to use and with which sources
     */
    private createGeneratorPlan;
    /**
     * Synthesize all content sections into final comprehensive content
     */
    private synthesizeContent;
    /**
     * Build MDX frontmatter
     */
    private buildFrontmatter;
    /**
     * Determine optimal content section order based on domain
     */
    private determineContentOrder;
    /**
     * Build subtopic exploration section
     */
    private buildSubtopicSection;
    /**
     * Build comprehensive source attribution section
     */
    private buildSourceSection;
    /**
     * Build metadata badges for source attribution
     */
    private buildMetadataBadges;
    /**
     * Build content metadata for the response
     */
    private buildContentMetadata;
    /**
     * Get sections that each agent contributed to
     */
    private getSectionsForAgent;
    /**
     * Estimate reading time based on content length
     */
    private estimateReadTime;
    /**
     * Generate relevant tags based on domain and content
     */
    private generateTags;
    /**
     * Determine content difficulty level
     */
    private determineDifficulty;
    /**
     * Fallback content generation if main system fails
     */
    private generateFallbackContent;
}
export declare const multiAgentContentOrchestrator: MultiAgentContentOrchestrator;
//# sourceMappingURL=multiAgentContentGenerator.d.ts.map