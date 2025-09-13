import { type ResearchResult } from "./agents";
import { type SynthesisResult } from "./synthesis";
export interface SubtopicExtractionConfig {
    maxSubtopics: number;
    hierarchyLevels: 1 | 2 | 3;
    minConfidence: number;
    includePrerequisites: boolean;
    includeDifficulty: boolean;
    includeEstimatedTime: boolean;
    semanticGrouping: boolean;
}
export interface ExtractedSubtopic {
    id: string;
    title: string;
    description: string;
    level: number;
    parentId?: string;
    children?: ExtractedSubtopic[];
    metadata: {
        confidence: number;
        difficulty: "beginner" | "intermediate" | "advanced";
        estimatedTimeMinutes: number;
        prerequisites: string[];
        relatedConcepts: string[];
        sourceAgents: string[];
        keyTerms: string[];
        practicalApplications: string[];
    };
}
export interface SubtopicExtractionResult {
    hierarchicalTopics: ExtractedSubtopic[];
    flatTopics: ExtractedSubtopic[];
    metadata: {
        totalTopics: number;
        topicsByLevel: Record<number, number>;
        avgConfidence: number;
        coverage: {
            academic: number;
            practical: number;
            foundational: number;
            advanced: number;
        };
        processingTime: number;
    };
}
export interface TopicRelationship {
    parentTopic: string;
    childTopic: string;
    relationshipType: "prerequisite" | "component" | "related" | "application";
    strength: number;
}
export declare class SubtopicExtractor {
    private config;
    constructor(config?: Partial<SubtopicExtractionConfig>);
    /**
     * Extract hierarchical subtopics from research results and synthesis
     */
    extractSubtopics(researchResults: ResearchResult[], synthesisResult: SynthesisResult, mainTopic: string, context?: {
        userLevel?: "beginner" | "intermediate" | "advanced";
        focusAreas?: string[];
        excludeAreas?: string[];
        domainSpecific?: boolean;
    }): Promise<SubtopicExtractionResult>;
    /**
     * Extract candidate subtopics from research and synthesis results
     */
    private extractCandidateTopics;
    /**
     * Create extraction prompt for AI
     */
    private createExtractionPrompt;
    /**
     * Get system prompt for subtopic extraction
     */
    private getExtractionSystemPrompt;
    /**
     * Get extraction instructions
     */
    private getExtractionInstructions;
    /**
     * Parse extracted topics from AI response
     */
    private parseExtractedTopics;
    /**
     * Build topic relationships using semantic analysis
     */
    private buildTopicRelationships;
    /**
     * Analyze relationship between two topics
     */
    private analyzeTopicRelationship;
    /**
     * Build hierarchical structure from topics and relationships
     */
    private buildHierarchicalStructure;
    /**
     * Enhance topics with metadata from research results
     */
    private enhanceTopicsWithMetadata;
    /**
     * Find agents that contributed relevant content for a topic
     */
    private findRelevantAgents;
    /**
     * Extract related concepts from research results
     */
    private extractRelatedConcepts;
    /**
     * Adjust difficulty based on user level
     */
    private adjustDifficultyForUser;
    /**
     * Filter and validate topics based on configuration and context
     */
    private filterAndValidateTopics;
    /**
     * Enforce maximum topic limits
     */
    private enforceMaxTopics;
    private flattenHierarchy;
    private countTopicsByLevel;
    private calculateAverageConfidence;
    private calculateCoverageMetrics;
    updateConfig(config: Partial<SubtopicExtractionConfig>): void;
    getConfig(): SubtopicExtractionConfig;
}
export declare const defaultSubtopicExtractor: SubtopicExtractor;
//# sourceMappingURL=subtopicExtractor.d.ts.map