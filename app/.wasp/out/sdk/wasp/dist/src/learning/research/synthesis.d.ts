import { type ResearchResult } from "./agents";
import { type DeduplicationResult } from "./aggregation/deduplication";
import { type ScoredResult } from "./scoring";
export interface SynthesisConfig {
    maxTokens: number;
    temperature: number;
    summaryLength: "brief" | "moderate" | "detailed";
    includeSourceAttribution: boolean;
    emphasizePerspectives: boolean;
    factCheckingEnabled: boolean;
    biasDetection: boolean;
    learningStyleAdaptation: boolean;
}
export interface SynthesisResult {
    synthesizedContent: {
        summary: string;
        keyPoints: string[];
        perspectives: Perspective[];
        factualHighlights: FactualHighlight[];
    };
    metadata: {
        sourceCount: number;
        agentContributions: AgentContribution[];
        confidenceScore: number;
        biasAssessment: BiasAssessment;
        factualityScore: number;
        processingTime: number;
    };
    adaptedContent?: {
        userLevel?: AdaptedContent;
        learningStyle?: AdaptedContent;
    };
}
export interface Perspective {
    viewpoint: string;
    description: string;
    sources: string[];
    confidence: number;
    supportingEvidence: string[];
}
export interface FactualHighlight {
    fact: string;
    confidence: number;
    sources: string[];
    category: "statistic" | "definition" | "process" | "relationship" | "example";
}
export interface AgentContribution {
    agentName: string;
    contributionPercentage: number;
    uniqueInsights: string[];
    overlap: number;
}
export interface BiasAssessment {
    overallScore: number;
    detectedBiases: DetectedBias[];
    balanceScore: number;
}
export interface DetectedBias {
    type: "political" | "commercial" | "cultural" | "confirmation" | "availability";
    severity: "low" | "medium" | "high";
    evidence: string[];
    sources: string[];
}
export interface AdaptedContent {
    summary: string;
    explanation: string;
    examples: string[];
    recommendations: string[];
}
export declare class ContentSynthesisEngine {
    private config;
    constructor(config?: Partial<SynthesisConfig>);
    /**
     * Synthesize content from multiple research results using AI
     */
    synthesizeResearchResults(researchResults: ResearchResult[], deduplicationResult: DeduplicationResult, scoredResults: ScoredResult[], topic: string, context?: {
        userLevel?: "beginner" | "intermediate" | "advanced";
        learningStyle?: "visual" | "textual" | "interactive" | "video" | "conversational";
        specificQuestions?: string[];
        focusAreas?: string[];
    }): Promise<SynthesisResult>;
    /**
     * Prepare content from multiple agents for synthesis
     */
    private prepareContentForSynthesis;
    /**
     * Generate comprehensive synthesized content using AI
     */
    private generateSynthesizedContent;
    /**
     * Create synthesis prompt for OpenAI
     */
    private createSynthesisPrompt;
    /**
     * Get system prompt for synthesis
     */
    private getSynthesisSystemPrompt;
    /**
     * Get synthesis instructions
     */
    private getSynthesisInstructions;
    /**
     * Organize content by type/source
     */
    private organizeContentByType;
    /**
     * Classify agent type for content organization
     */
    private classifyAgentType;
    /**
     * Generate agent-specific summary
     */
    private generateAgentSummary;
    /**
     * Analyze contributions from each agent
     */
    private analyzeAgentContributions;
    /**
     * Extract unique insights from an agent's results
     */
    private extractUniqueInsights;
    /**
     * Check if sentence contains terms unique to the agent type
     */
    private hasUniqueTerms;
    /**
     * Calculate overlap score between agents
     */
    private calculateOverlapScore;
    /**
     * Check if two search results are similar
     */
    private areResultsSimilar;
    /**
     * Assess bias in synthesized content
     */
    private assessBias;
    /**
     * Detect simple bias patterns
     */
    private detectSimpleBias;
    /**
     * Calculate balance score based on perspective representation
     */
    private calculateBalanceScore;
    /**
     * Assess factuality of synthesized content
     */
    private assessFactuality;
    /**
     * Calculate overall confidence score
     */
    private calculateOverallConfidence;
    /**
     * Generate adapted content for specific contexts
     */
    private generateAdaptedContent;
    /**
     * Generate user level specific adaptation
     */
    private generateUserLevelAdaptation;
    /**
     * Generate learning style specific adaptation
     */
    private generateLearningStyleAdaptation;
    /**
     * Create user level adaptation prompt
     */
    private createUserLevelAdaptationPrompt;
    updateConfig(config: Partial<SynthesisConfig>): void;
    getConfig(): SynthesisConfig;
}
export declare const defaultContentSynthesizer: ContentSynthesisEngine;
//# sourceMappingURL=synthesis.d.ts.map