import type { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import type { DetailedLearningPath, LearningSection } from './pathGenerator';
export interface OptimizationMetrics {
    engagement: number;
    completion_rate: number;
    time_efficiency: number;
    knowledge_retention: number;
    user_satisfaction: number;
}
export interface UserProgressData {
    sectionsCompleted: string[];
    timeSpentPerSection: Record<string, number>;
    assessmentScores: Record<string, number>;
    interactionCounts: Record<string, number>;
    skipRequests: string[];
    strugglingIndicators: string[];
    fastCompletionAreas: string[];
    learningStyleEffectiveness: Record<string, number>;
    lastActivity: Date;
    totalTimeSpent: number;
}
export interface OptimizationRecommendation {
    type: 'add_section' | 'remove_section' | 'modify_section' | 'reorder_sections' | 'add_resources' | 'change_pace';
    priority: 'high' | 'medium' | 'low';
    description: string;
    rationale: string;
    implementation: any;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
}
export interface AdaptationContext {
    currentSection: string;
    recentPerformance: number[];
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    timeSpentTrend: 'faster' | 'slower' | 'on_track';
    strugglingAreas: string[];
    masteringAreas: string[];
    preferredInteractionTypes: string[];
    currentMood?: 'motivated' | 'frustrated' | 'neutral' | 'tired';
}
/**
 * Learning Path Optimizer
 * Optimizes learning paths in real-time based on user progress and performance
 */
export declare class LearningPathOptimizer {
    private optimizationHistory;
    private pathPerformance;
    /**
     * Analyze current path performance and suggest optimizations
     */
    optimizePath(currentPath: DetailedLearningPath, progressData: UserProgressData, assessment: AssessmentResult): Promise<{
        optimizedPath: DetailedLearningPath;
        recommendations: OptimizationRecommendation[];
        metrics: OptimizationMetrics;
    }>;
    /**
     * Real-time path adaptation based on current user context
     */
    adaptPathRealTime(currentPath: DetailedLearningPath, adaptationContext: AdaptationContext, assessment: AssessmentResult): Promise<{
        immediateActions: OptimizationRecommendation[];
        pathAdjustments: Partial<DetailedLearningPath>;
        nextSectionRecommendations: string[];
    }>;
    /**
     * Optimize section difficulty based on user performance
     */
    optimizeSectionDifficulty(section: LearningSection, progressData: UserProgressData, adaptationContext: AdaptationContext): LearningSection;
    /**
     * Identify prerequisite gaps and suggest remediation
     */
    identifyPrerequisiteGaps(progressData: UserProgressData, currentPath: DetailedLearningPath): {
        gaps: string[];
        recommendations: OptimizationRecommendation[];
    };
    /**
     * Generate personalized resource recommendations
     */
    generateResourceRecommendations(progressData: UserProgressData, assessment: AssessmentResult, currentPath: DetailedLearningPath): OptimizationRecommendation[];
    private calculateOptimizationMetrics;
    private generateOptimizationRecommendations;
    private generateImmediateActions;
    private generatePathAdjustments;
    private generateNextSectionRecommendations;
    private applyOptimizations;
    private applyModifySection;
    private applyAddSection;
    private applyAddResources;
    private applyChangePace;
    private optimizeInteractiveElements;
    private increaseDifficulty;
    private decreaseDifficulty;
}
export declare const learningPathOptimizer: LearningPathOptimizer;
//# sourceMappingURL=pathOptimizer.d.ts.map