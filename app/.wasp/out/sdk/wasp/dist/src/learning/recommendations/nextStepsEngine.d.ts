import type { DetailedProgressMetrics, LearningInsight } from '../analytics/progressTracker';
export interface NextStepRecommendation {
    id: string;
    type: 'concept' | 'practice' | 'review' | 'assessment' | 'break' | 'project' | 'help';
    title: string;
    description: string;
    reasoning: string;
    estimatedTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    priority: 'low' | 'medium' | 'high' | 'critical';
    prerequisites: string[];
    expectedOutcome: string;
    resources?: RecommendedResource[];
    actionData?: any;
}
export interface RecommendedResource {
    title: string;
    type: 'article' | 'video' | 'interactive' | 'practice' | 'documentation';
    url?: string;
    description: string;
    estimatedTime?: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}
export interface LearningContext {
    userId: string;
    topicId: string;
    currentSession: {
        timeSpent: number;
        conceptsExplored: string[];
        lastActivity: Date;
        performance: number;
        engagement: number;
    };
    recentHistory: {
        sessionsCompleted: number;
        averageScore: number;
        strugglingAreas: string[];
        strongAreas: string[];
        preferredLearningTimes: number[];
    };
    goals: {
        timeAvailable: number;
        targetCompletion?: Date;
        focusAreas: string[];
        skillLevel: 'beginner' | 'intermediate' | 'advanced';
    };
    preferences: {
        learningStyle: string[];
        difficultyPreference: 'adaptive' | 'challenging' | 'comfortable';
        contentTypes: string[];
        sessionLength: 'short' | 'medium' | 'long';
    };
}
export interface RecommendationStrategy {
    name: string;
    description: string;
    weight: number;
    conditions: (context: LearningContext, metrics: DetailedProgressMetrics) => boolean;
    generateRecommendations: (context: LearningContext, metrics: DetailedProgressMetrics) => NextStepRecommendation[];
}
/**
 * Next Steps Recommendation Engine
 * Provides intelligent, personalized learning recommendations
 */
declare class NextStepsEngine {
    private strategies;
    private conceptMaps;
    private userContexts;
    constructor();
    /**
     * Generate personalized next step recommendations
     */
    generateRecommendations(context: LearningContext, metrics: DetailedProgressMetrics, insights: LearningInsight[], maxRecommendations?: number): Promise<{
        primary: NextStepRecommendation;
        alternatives: NextStepRecommendation[];
        reasoning: string;
    }>;
    /**
     * Get adaptive recommendations based on real-time performance
     */
    getAdaptiveRecommendations(context: LearningContext, currentPerformance: {
        conceptId: string;
        score: number;
        timeSpent: number;
        attempts: number;
        hintsUsed: number;
    }): Promise<NextStepRecommendation[]>;
    /**
     * Generate learning path recommendations
     */
    generatePathRecommendations(context: LearningContext, currentPath: string[], completedConcepts: string[], metrics: DetailedProgressMetrics): Promise<{
        optimizedPath: string[];
        alternatives: string[][];
        reasoning: string[];
    }>;
    /**
     * Get contextual help recommendations
     */
    generateHelpRecommendations(context: LearningContext, strugglingConcept: string, metrics: DetailedProgressMetrics): NextStepRecommendation[];
    private initializeStrategies;
    private generatePerformanceBasedRecommendations;
    private generateTimeBasedRecommendations;
    private generateEngagementRecommendations;
    private generateMasteryRecommendations;
    private generateRecoveryRecommendations;
    private scoreRecommendations;
    private applyRecommendationBalance;
    private generateRecommendationReasoning;
    private getRemedialResources;
    private getAlternativeResources;
    private getInteractiveResources;
}
export { NextStepsEngine };
export declare const nextStepsEngine: NextStepsEngine;
export default NextStepsEngine;
//# sourceMappingURL=nextStepsEngine.d.ts.map