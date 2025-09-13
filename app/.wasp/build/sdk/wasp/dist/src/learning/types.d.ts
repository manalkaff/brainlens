export interface AssessmentResult {
    id?: string;
    overallScore: number;
    knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
    sectionScores?: Record<string, number>;
    strengths?: string[];
    weaknesses?: string[];
    recommendedPath?: string;
    personalizedFor?: string;
    completedAt?: Date;
    interests?: string[];
    priorKnowledge?: string[];
    goals?: string[];
    topicSpecificQuestions?: Record<string, any>;
}
export interface UserTopicProgress {
    id: string;
    userId: string;
    topicId: string;
    completed: boolean;
    timeSpent: number;
    lastAccessed: Date;
    preferences: any;
    bookmarks: string[];
    progress?: number;
    sectionProgress?: Record<string, number>;
    createdAt?: Date;
    learningPath?: any;
    assessmentResult?: AssessmentResult;
}
export interface Topic {
    id: string;
    title: string;
    description?: string;
    subtopics?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration?: number;
    prerequisites?: string[];
    learningObjectives?: string[];
}
export interface DetailedProgressMetrics {
    averageScore: number;
    recentScore: number;
    scoreImprovement: number;
    consistencyScore: number;
    learningVelocity: number;
    paceConsistency: number;
    adaptationRate: number;
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    averageEngagement: number;
    peakEngagement: number;
    attentionSpan: number;
    retentionRate: number;
    comprehensionDepth: number;
    transferAbility: number;
    timeMetrics: {
        totalTimeSpent: number;
        activeTime: number;
        averageSessionLength: number;
        sessionFrequency: number;
        peakActivityHours: number[];
    };
    performanceMetrics: {
        quickWins: number;
        strugglingAreas: number;
        masteredConcepts: number;
        reviewNeeded: number;
    };
    questionTypeBreakdown?: Record<string, {
        accuracy: number;
        averageTime: number;
        attempts: number;
    }>;
    behavioralPatterns: {
        preferredLearningTimes: string[];
        sessionLengthPreference: 'short' | 'medium' | 'long';
        interactionFrequency: number;
        helpSeekingBehavior: number;
    };
}
export interface LearningInsight {
    id: string;
    type: 'strength' | 'improvement' | 'recommendation' | 'achievement' | 'concern';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    relatedConcepts?: string[];
    supportingData?: Record<string, any>;
    recommendations?: string[];
    priority?: number;
    generatedAt: Date;
    expiresAt?: Date;
    relevanceScore?: number;
}
export interface InteractiveElement {
    type: 'example' | 'exercise' | 'reflection' | 'practical' | 'simulation';
    title: string;
    description: string;
    instructions: string;
    estimatedTime: number;
    difficultyLevel: number;
    learningStyle: string[];
}
export interface LearningSection {
    id: string;
    title: string;
    description: string;
    estimatedTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
    learningObjectives: string[];
    interactiveElements: InteractiveElement[];
    assessmentQuestions: any[];
    completionCriteria: {
        minAccuracy: number;
        requiredTime?: number;
        masteryLevel: number;
    };
    adaptationTriggers: string[];
}
export type { Topic as TopicEntity } from 'wasp/entities';
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'multimodal';
//# sourceMappingURL=types.d.ts.map