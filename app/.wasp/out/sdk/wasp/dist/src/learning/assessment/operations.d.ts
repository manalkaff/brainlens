type GenerateAssessmentContentInput = {
    topicId: string;
    assessment: {
        knowledgeLevel: number;
        learningStyles: string[];
        startingPoint: 'basics' | 'intermediate' | 'advanced';
        preferences: {
            difficultyPreference: 'gentle' | 'moderate' | 'challenging';
            contentDepth: 'overview' | 'detailed' | 'comprehensive';
            pacePreference: 'slow' | 'moderate' | 'fast';
        };
    };
};
type GeneratePersonalizedPathInput = {
    topicId: string;
    assessment: GenerateAssessmentContentInput['assessment'];
    includeContent?: boolean;
};
type GenerateStartingPointInput = {
    topicId: string;
    assessment: GenerateAssessmentContentInput['assessment'];
};
type StreamAssessmentContentInput = {
    topicId: string;
    assessment: GenerateAssessmentContentInput['assessment'];
    streamId?: string;
};
type AssessmentContentOutput = {
    content: string;
    startingPoint: string;
    recommendedPath: string[];
    estimatedDuration: number;
    adaptations: string[];
    learningObjectives: string[];
    metadata: {
        generatedAt: string;
        tokensUsed: number;
        personalizedFor: string;
    };
};
type PersonalizedPathOutput = {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
    sections?: Array<{
        id: string;
        title: string;
        content?: string;
        estimatedTime: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        prerequisites?: string[];
    }>;
    resources: Array<{
        title: string;
        type: 'article' | 'video' | 'interactive' | 'documentation';
        description: string;
    }>;
    nextSteps: string[];
    metadata: {
        generatedAt: string;
        tokensUsed: number;
        personalizedFor: string;
    };
};
type StartingPointOutput = {
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
        preferences: GenerateAssessmentContentInput['assessment']['preferences'];
    };
};
type StreamAssessmentContentOutput = {
    streamId: string;
    status: 'started' | 'error';
    message: string;
};
/**
 * Generate personalized assessment content based on user's knowledge assessment
 */
export declare const generateAssessmentContent: (args: GenerateAssessmentContentInput, context: any) => Promise<AssessmentContentOutput>;
/**
 * Generate a complete personalized learning path
 */
export declare const generatePersonalizedPath: (args: GeneratePersonalizedPathInput, context: any) => Promise<PersonalizedPathOutput>;
/**
 * Generate detailed starting point recommendation
 */
export declare const generateStartingPoint: (args: GenerateStartingPointInput, context: any) => Promise<StartingPointOutput>;
/**
 * Stream assessment content generation for real-time display
 */
export declare const streamAssessmentContent: (args: StreamAssessmentContentInput, context: any) => Promise<StreamAssessmentContentOutput>;
export {};
//# sourceMappingURL=operations.d.ts.map