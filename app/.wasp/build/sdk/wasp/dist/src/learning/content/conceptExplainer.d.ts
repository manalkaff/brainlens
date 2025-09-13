import type { Topic } from "wasp/entities";
import type { AssessmentResult } from "../components/ui/KnowledgeAssessment";
export interface ConceptExplanation {
    concept: string;
    definition: string;
    simpleExplanation: string;
    detailedExplanation: string;
    examples: string[];
    analogies: string[];
    visualDescriptions: string[];
    commonMisconceptions: string[];
    relatedConcepts: RelatedConcept[];
    applications: string[];
    difficulty: "basic" | "intermediate" | "advanced";
    estimatedReadTime: number;
    tags: string[];
}
export interface RelatedConcept {
    name: string;
    relationship: "prerequisite" | "builds_on" | "similar_to" | "contrasts_with" | "applies_to";
    description: string;
    importance: "high" | "medium" | "low";
}
export interface ConceptNode {
    id: string;
    name: string;
    definition: string;
    level: number;
    connections: ConceptConnection[];
    mastery: number;
    prerequisites: string[];
    unlocks: string[];
}
export interface ConceptConnection {
    targetConceptId: string;
    relationship: RelatedConcept["relationship"];
    strength: number;
    description: string;
}
export interface ConceptMap {
    topicId: string;
    concepts: ConceptNode[];
    learningPaths: string[][];
    criticalPath: string[];
    userProgress: Record<string, number>;
}
export interface ExplanationOptions {
    userLevel: "beginner" | "intermediate" | "advanced";
    learningStyle: string[];
    previousKnowledge: string[];
    preferredDepth: "brief" | "detailed" | "comprehensive";
    includeExamples: boolean;
    includeAnalogies: boolean;
    includeVisuals: boolean;
}
/**
 * Concept Explainer Service
 * Generates intelligent explanations for concepts based on user context
 */
export declare class ConceptExplainer {
    private model;
    private conceptCache;
    private conceptMaps;
    /**
     * Generate personalized explanation for a concept
     */
    explainConcept(concept: string, topicContext: Topic, userAssessment: AssessmentResult, options?: Partial<ExplanationOptions>): Promise<ConceptExplanation>;
    /**
     * Generate explanation with context from surrounding content
     */
    explainConceptInContext(concept: string, surroundingContent: string, topicContext: Topic, userAssessment: AssessmentResult): Promise<ConceptExplanation>;
    /**
     * Build concept map for a topic showing relationships
     */
    buildConceptMap(topic: Topic, researchResults?: any[], userAssessment?: AssessmentResult): Promise<ConceptMap>;
    /**
     * Get related concepts for exploration
     */
    getRelatedConcepts(concept: string, topicContext: Topic, relationshipTypes?: RelatedConcept["relationship"][]): Promise<RelatedConcept[]>;
    /**
     * Check prerequisites for understanding a concept
     */
    checkPrerequisites(concept: string, topicContext: Topic, userKnowledge?: string[]): Promise<{
        prerequisites: string[];
        missing: string[];
        readyToLearn: boolean;
        recommendations: string[];
    }>;
    /**
     * Generate progressive explanations (basic -> advanced)
     */
    generateProgressiveExplanations(concept: string, topicContext: Topic, levels?: ("basic" | "intermediate" | "advanced")[]): Promise<Record<string, ConceptExplanation>>;
    private generateConceptExplanation;
    private buildExplanationPrompt;
    private buildContextualExplanationPrompt;
    private extractTopicConcepts;
    private buildConceptNodes;
    private generateQuickDefinition;
    private buildConceptConnections;
    private generateLearningPaths;
    private generatePrimaryPath;
    private generatePracticalPath;
    private generateTheoreticalPath;
    private identifyCriticalPath;
    private parseExplanationResponse;
    private generateFallbackExplanation;
    private generateFallbackRelatedConcepts;
    private generateFallbackConcepts;
    private mapKnowledgeLevel;
    private generateCacheKey;
}
export declare const conceptExplainer: ConceptExplainer;
//# sourceMappingURL=conceptExplainer.d.ts.map