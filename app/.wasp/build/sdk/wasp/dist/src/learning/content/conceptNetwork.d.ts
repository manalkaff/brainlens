import type { Topic } from 'wasp/entities';
import type { ConceptMap, ConceptNode, ConceptConnection, RelatedConcept } from './conceptExplainer';
export type { ConceptMap, ConceptNode, ConceptConnection, RelatedConcept };
export interface TraversalOptions {
    maxDepth: number;
    relationshipTypes: RelatedConcept['relationship'][];
    includeWeakConnections: boolean;
    userMasteryFilter?: 'all' | 'mastered' | 'unmastered' | 'ready_to_learn';
}
export interface LearningSequence {
    id: string;
    name: string;
    description: string;
    concepts: string[];
    estimatedTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
    learningObjectives: string[];
    rationale: string;
}
export interface MasteryProgress {
    conceptId: string;
    conceptName: string;
    currentLevel: number;
    targetLevel: number;
    timeSpent: number;
    assessmentScores: number[];
    lastAccessed: Date;
    strengthAreas: string[];
    improvementAreas: string[];
    nextSteps: string[];
}
export interface KnowledgeGap {
    conceptId: string;
    conceptName: string;
    gapType: 'missing_prerequisite' | 'weak_understanding' | 'no_exposure' | 'misconception';
    severity: 'critical' | 'important' | 'minor';
    prerequisites: string[];
    recommendations: string[];
    estimatedTimeToFill: number;
}
export interface RecommendationContext {
    currentConcept?: string;
    userMastery: Record<string, number>;
    learningGoals: string[];
    timeAvailable?: number;
    preferredDifficulty?: 'easier' | 'same' | 'harder';
    avoidConcepts?: string[];
}
/**
 * Concept Network Manager
 * Manages the network of concepts and their relationships for intelligent navigation
 */
export declare class ConceptNetworkManager {
    private conceptMaps;
    private masteryTracking;
    private learningSequences;
    /**
     * Initialize concept network for a topic
     */
    initializeNetwork(topic: Topic, researchResults?: any[], userMastery?: Record<string, number>): Promise<ConceptMap>;
    /**
     * Find optimal next concepts to learn
     */
    findNextConcepts(topicId: string, context: RecommendationContext, maxRecommendations?: number): {
        recommendations: ConceptNode[];
        rationale: Record<string, string>;
        alternatives: ConceptNode[];
    };
    /**
     * Analyze knowledge gaps in user's understanding
     */
    analyzeKnowledgeGaps(topicId: string, userMastery: Record<string, number>, targetConcepts?: string[]): {
        gaps: KnowledgeGap[];
        criticalPath: string[];
        recommendations: string[];
    };
    /**
     * Generate personalized learning sequences
     */
    generateLearningSequences(topicId: string, conceptMap: ConceptMap): Promise<LearningSequence[]>;
    /**
     * Track concept mastery progress
     */
    updateConceptMastery(topicId: string, conceptId: string, assessmentScore: number, timeSpent: number, strengthAreas?: string[], improvementAreas?: string[]): MasteryProgress;
    /**
     * Find concepts related to current focus
     */
    findRelatedConcepts(topicId: string, conceptId: string, options?: TraversalOptions): {
        related: ConceptNode[];
        path: string[][];
        relationships: Record<string, string>;
    };
    /**
     * Get optimal concept ordering for learning
     */
    optimizeConceptOrdering(topicId: string, concepts: string[], userMastery: Record<string, number>): {
        optimizedOrder: string[];
        reasoning: string[];
        alternatives: string[][];
    };
    private identifyLearningCandidates;
    private scoreConceptCandidates;
    private calculatePrerequisiteReadiness;
    private calculateDifficultyFit;
    private calculateGoalAlignment;
    private calculateTimeFit;
    private estimateConceptTime;
    private generateRecommendationRationale;
    private findPrerequisiteGaps;
    private estimateTimeToLearn;
    private deduplicateGaps;
    private generateCriticalLearningPath;
    private orderByPrerequisites;
    private generateGapRecommendations;
    private updateMasteryTracking;
    private generateNextSteps;
    private traverseConceptNetwork;
    private generateFoundationFirstSequence;
    private generateApplicationDrivenSequence;
    private generateSpiralSequence;
    private generateMasteryBasedSequence;
    private chunkConcepts;
    private buildDependencyGraph;
    private topologicalSort;
    private optimizeForLearning;
    private explainOrdering;
    private generateDifficultyBasedOrder;
    private generateInterestBasedOrder;
}
export declare const conceptNetworkManager: ConceptNetworkManager;
//# sourceMappingURL=conceptNetwork.d.ts.map