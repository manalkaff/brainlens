import type { UserTopicProgress } from 'wasp/entities';
export interface DetailedProgressMetrics {
    overall: OverallProgress;
    conceptual: ConceptualProgress;
    behavioral: BehavioralMetrics;
    temporal: TemporalMetrics;
    performance: PerformanceMetrics;
    engagement: EngagementMetrics;
    learning: LearningMetrics;
}
export interface OverallProgress {
    completion: number;
    sectionsCompleted: number;
    totalSections: number;
    timeSpent: number;
    estimatedTimeRemaining: number;
    currentStreak: number;
    longestStreak: number;
    lastActivity: Date;
    startDate: Date;
    projectedCompletionDate?: Date;
}
export interface ConceptualProgress {
    conceptsMastered: number;
    totalConcepts: number;
    masteryDistribution: Record<string, number>;
    knowledgeGaps: string[];
    strengths: string[];
    prerequisites: {
        met: string[];
        missing: string[];
    };
    depthOfUnderstanding: number;
    breadthOfKnowledge: number;
}
export interface BehavioralMetrics {
    studyPatterns: {
        averageSessionLength: number;
        preferredStudyTimes: number[];
        sessionFrequency: number;
        consistencyScore: number;
    };
    interactionPatterns: {
        conceptExpansions: number;
        questionsAsked: number;
        resourcesAccessed: number;
        reviewSessions: number;
    };
    learningStyle: {
        detected: string[];
        effectiveness: Record<string, number>;
        preferences: Record<string, number>;
    };
}
export interface TemporalMetrics {
    dailyProgress: Record<string, number>;
    weeklyTrends: {
        week: string;
        hoursStudied: number;
        conceptsLearned: number;
        averageScore: number;
    }[];
    monthlyGoals: {
        target: number;
        achieved: number;
        trend: 'improving' | 'declining' | 'stable';
    };
    optimalLearningTimes: number[];
    burnoutRisk: number;
}
export interface PerformanceMetrics {
    assessmentScores: {
        current: number;
        highest: number;
        lowest: number;
        trend: 'improving' | 'declining' | 'stable';
        history: Array<{
            date: Date;
            score: number;
            topic: string;
        }>;
    };
    skillProgression: {
        conceptual: number;
        practical: number;
        analytical: number;
        synthesis: number;
    };
    difficultyAdaptation: {
        currentLevel: number;
        adaptationHistory: Array<{
            date: Date;
            from: number;
            to: number;
            reason: string;
        }>;
    };
}
export interface EngagementMetrics {
    motivationLevel: number;
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    sessionCompletionRate: number;
    voluntaryExtensions: number;
    helpSeekingBehavior: number;
    exploratoryBehavior: number;
    socialInteraction: number;
}
export interface LearningMetrics {
    retentionRate: number;
    transferLearning: number;
    metacognition: number;
    adaptability: number;
    efficiency: number;
    curiosity: number;
}
export interface ProgressMilestone {
    id: string;
    name: string;
    description: string;
    achievedAt: Date;
    criteria: string[];
    rewards: string[];
    difficulty: 'easy' | 'medium' | 'hard' | 'epic';
    category: 'time' | 'mastery' | 'exploration' | 'consistency' | 'achievement';
}
export interface Achievement {
    id: string;
    title: string;
    description: string;
    iconName: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    category: string;
    requirements: string[];
    progress: number;
    unlockedAt?: Date;
    rarity: number;
}
export interface LearningInsight {
    type: 'strength' | 'improvement' | 'pattern' | 'recommendation' | 'warning';
    title: string;
    description: string;
    actionable: boolean;
    priority: 'low' | 'medium' | 'high';
    recommendations: string[];
    data: any;
    generatedAt: Date;
}
/**
 * Advanced Progress Tracking System
 * Provides comprehensive analytics and insights for learning progress
 */
declare class AdvancedProgressTracker {
    private progressHistory;
    private milestones;
    private achievements;
    private insights;
    /**
     * Calculate comprehensive progress metrics
     */
    calculateDetailedMetrics(userId: string, topicId: string, userProgress: UserTopicProgress, sessionData: any[], assessmentData: any[]): DetailedProgressMetrics;
    /**
     * Generate personalized learning insights
     */
    generateLearningInsights(metrics: DetailedProgressMetrics, historicalData: DetailedProgressMetrics[]): LearningInsight[];
    /**
     * Track and evaluate achievements
     */
    updateAchievements(userId: string, metrics: DetailedProgressMetrics, sessionData: any[]): Achievement[];
    /**
     * Generate personalized recommendations
     */
    generatePersonalizedRecommendations(metrics: DetailedProgressMetrics, insights: LearningInsight[]): {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    private calculateOverallProgress;
    private calculateConceptualProgress;
    private analyzeBehavioralPatterns;
    private analyzeTemporalPatterns;
    private analyzePerformanceMetrics;
    private calculateEngagementMetrics;
    private assessLearningEffectiveness;
    private calculateCurrentStreak;
    private updateProgressHistory;
    private getAchievementTemplates;
    private calculateAchievementProgress;
    private identifyStrengths;
    private identifyImprovementAreas;
    private generateImprovementRecommendations;
    private identifyLearningPatterns;
    private countCompletedSections;
    private estimateRemainingTime;
    private projectCompletionDate;
    private calculateDepthScore;
    private findPreferredTimes;
    private calculateConsistencyScore;
    private calculateWeeklyFrequency;
    private countInteractions;
    private detectLearningStyles;
    private calculateStyleEffectiveness;
    private inferStylePreferences;
    private calculateDailyProgress;
    private calculateWeeklyTrends;
    private identifyOptimalLearningTimes;
    private assessBurnoutRisk;
    private calculateMonthlyHours;
    private calculateMonthlyTrend;
    private calculateTrend;
    private inferCurrentDifficultyLevel;
    private trackDifficultyAdaptations;
    private calculateMotivationLevel;
    private calculateEngagementTrend;
    private calculateRetentionRate;
    private assessTransferLearning;
    private assessMetacognition;
    private assessAdaptability;
    private assessCuriosity;
    private calculateLongestStreak;
}
export { AdvancedProgressTracker };
export declare const advancedProgressTracker: AdvancedProgressTracker;
export default AdvancedProgressTracker;
//# sourceMappingURL=progressTracker.d.ts.map