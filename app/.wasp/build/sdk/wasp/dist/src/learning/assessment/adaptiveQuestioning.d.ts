import type { Topic } from "wasp/entities";
export type QuestionType = "multiple_choice" | "true_false" | "scale" | "text_input" | "scenario";
export type DifficultyLevel = "basic" | "intermediate" | "advanced" | "expert";
export interface AdaptiveQuestion {
    id: string;
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer?: string | number;
    followUpQuestions?: AdaptiveQuestion[];
    metadata: {
        difficulty: DifficultyLevel;
        concept: string;
        purpose: "knowledge_check" | "depth_probe" | "style_detection" | "goal_setting";
        estimatedTime: number;
        adaptiveWeight: number;
    };
}
export interface AssessmentSession {
    sessionId: string;
    topicId: string;
    currentQuestionIndex: number;
    answers: Array<{
        questionId: string;
        answer: any;
        confidence: number;
        responseTime: number;
        timestamp: Date;
    }>;
    inferredKnowledge: {
        level: number;
        confidence: number;
        strongAreas: string[];
        weakAreas: string[];
    };
    adaptiveState: {
        shouldIncreaseComplexity: boolean;
        shouldDecreaseComplexity: boolean;
        focusAreas: string[];
        timeSpent: number;
    };
}
export interface QuestionGenerationOptions {
    currentKnowledgeLevel: number;
    focusAreas?: string[];
    questionCount: number;
    includeFollowUps: boolean;
    adaptToPerformance: boolean;
}
/**
 * Adaptive Questioning System
 * Generates intelligent questions that adapt based on user responses
 */
export declare class AdaptiveQuestioningSystem {
    private model;
    private questionBank;
    /**
     * Generate initial assessment questions for a topic
     */
    generateInitialQuestions(topic: Topic, options: QuestionGenerationOptions): Promise<AdaptiveQuestion[]>;
    /**
     * Generate adaptive follow-up questions based on previous answers
     */
    generateAdaptiveFollowUp(session: AssessmentSession, topic: Topic, previousAnswer: any): Promise<AdaptiveQuestion | null>;
    /**
     * Analyze user responses to determine knowledge level and adjust questioning
     */
    analyzeResponsePattern(session: AssessmentSession): {
        inferredLevel: number;
        confidence: number;
        strongAreas: string[];
        weakAreas: string[];
        needsFollowUp: boolean;
        recommendedDirection: "increase_difficulty" | "decrease_difficulty" | "probe_deeper" | "continue";
    };
    /**
     * Create personalized question based on learning style detection
     */
    generateLearningStyleQuestion(topic: Topic, currentResponses: any[]): AdaptiveQuestion;
    /**
     * Generate scenario-based questions for deeper assessment
     */
    generateScenarioQuestion(topic: Topic, knowledgeLevel: number): Promise<AdaptiveQuestion>;
    private buildInitialQuestionsPrompt;
    private buildAdaptiveFollowUpPrompt;
    private parseGeneratedQuestions;
    private evaluateResponse;
    private calculateConfidence;
    private calculateConsistency;
    private calculateVariance;
    private identifyStrongAreas;
    private identifyWeakAreas;
    private inferPreferredQuestionTypes;
    private generateFallbackQuestion;
    private cacheQuestions;
}
export declare const adaptiveQuestioningSystem: AdaptiveQuestioningSystem;
//# sourceMappingURL=adaptiveQuestioning.d.ts.map