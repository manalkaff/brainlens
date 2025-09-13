import type { Topic } from 'wasp/entities';
import type { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import type { LearningPath } from '../components/ui/StartingPointRecommendation';
export interface EnhancedAssessmentResult extends AssessmentResult {
    interests: string[];
    priorKnowledge: string[];
    goals: string[];
    topicSpecificQuestions?: Record<string, any>;
}
export interface GeneratedLearningPath extends LearningPath {
    content: {
        introduction: string;
        sections: Array<{
            id: string;
            title: string;
            content: string;
            estimatedTime: number;
            difficulty: 'beginner' | 'intermediate' | 'advanced';
            prerequisites?: string[];
        }>;
        nextSteps: string[];
        resources: Array<{
            title: string;
            type: 'article' | 'video' | 'interactive' | 'documentation';
            url?: string;
            description: string;
        }>;
    };
    metadata: {
        generatedAt: Date;
        tokensUsed: number;
        personalizedFor: string;
    };
}
export interface StartingPointRecommendation {
    title: string;
    description: string;
    rationale: string;
    content: string;
    estimatedDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    keyTopics: string[];
    learningObjectives: string[];
    adaptedFor: {
        knowledgeLevel: number;
        learningStyles: string[];
        preferences: AssessmentResult['preferences'];
    };
}
/**
 * Assessment Content Generator
 * Generates personalized learning content based on knowledge assessment results
 */
export declare class AssessmentContentGenerator {
    /**
     * Generate personalized learning path based on assessment results
     */
    generatePersonalizedLearningPath(topic: Topic, assessment: AssessmentResult): Promise<GeneratedLearningPath>;
    /**
     * Generate starting point recommendation with detailed content
     */
    generateStartingPointRecommendation(topic: Topic, assessment: AssessmentResult): Promise<StartingPointRecommendation>;
    /**
     * Stream personalized content generation
     */
    streamPersonalizedContent(streamId: string, topic: Topic, assessment: AssessmentResult): Promise<void>;
    /**
     * Generate adaptive content that adjusts to user's knowledge level
     */
    generateAdaptiveContent(topic: Topic, assessment: AssessmentResult, contentType: 'introduction' | 'overview' | 'deep-dive' | 'practical'): Promise<{
        content: string;
        adaptations: string[];
        difficulty: string;
        estimatedReadTime: number;
    }>;
    /**
     * Generate learning objectives based on assessment
     */
    generateLearningObjectives(topic: Topic, assessment: AssessmentResult): string[];
    private convertAssessmentForAI;
    private mapKnowledgeLevelToUserLevel;
    private mapKnowledgeLevelToDifficulty;
    private generatePathTitle;
    private generatePathDescription;
    private generateStartingPointTitle;
    private generateStartingPointDescription;
    private generateStartingPointRationale;
    private calculateEstimatedDuration;
    private generateKeyTopics;
    private generateSectionContent;
    private generateLearningResources;
    private generateNextSteps;
    private inferInterests;
    private inferPriorKnowledge;
    private inferLearningGoals;
    private generateContentAdaptations;
    private getTokensForContentType;
    private calculateReadTime;
}
export declare const assessmentContentGenerator: AssessmentContentGenerator;
//# sourceMappingURL=assessmentContentGenerator.d.ts.map