import type { AssessmentResult } from '../components/ui/KnowledgeAssessment';
interface AssessmentContentState {
    content: string | null;
    startingPoint: string | null;
    recommendedPath: string[];
    estimatedDuration: number;
    adaptations: string[];
    learningObjectives: string[];
    isLoading: boolean;
    error: string | null;
}
interface PersonalizedPathState {
    path: any | null;
    isLoading: boolean;
    error: string | null;
}
interface StartingPointState {
    recommendation: any | null;
    isLoading: boolean;
    error: string | null;
}
interface StreamingState {
    streamId: string | null;
    isStreaming: boolean;
    error: string | null;
}
/**
 * Hook for managing assessment content generation
 */
export declare function useAssessmentContent(): {
    assessmentContent: AssessmentContentState;
    personalizedPath: PersonalizedPathState;
    startingPoint: StartingPointState;
    streaming: StreamingState;
    generateContent: (topicId: string, assessment: AssessmentResult) => Promise<{
        content: string;
        startingPoint: string;
        recommendedPath: string[];
        estimatedDuration: number;
        adaptations: string[];
        learningObjectives: string[];
    }>;
    generatePath: (topicId: string, assessment: AssessmentResult, includeContent?: boolean) => Promise<{
        id: string;
        title: string;
        description: string;
        estimatedTime: string;
        difficulty: "intermediate";
        topics: string[];
    }>;
    generateStartingPointRecommendation: (topicId: string, assessment: AssessmentResult) => Promise<{
        title: string;
        description: string;
        rationale: string;
        content: string;
        estimatedDuration: number;
        difficulty: "beginner";
        keyTopics: string[];
        learningObjectives: string[];
    }>;
    startStreaming: (topicId: string, assessment: AssessmentResult, existingStreamId?: string) => Promise<{
        streamId: string;
        status: "started";
        message: string;
    }>;
    stopStreaming: () => void;
    reset: () => void;
    isAnyLoading: boolean;
    hasError: boolean;
    errors: (string | null)[];
};
/**
 * Hook for streaming assessment content with real-time updates
 */
export declare function useStreamingAssessmentContent(): {
    streamingContent: {
        content: string;
        isStreaming: boolean;
        isComplete: boolean;
        progress: number;
        currentSection: string;
        error: string | null;
    };
    connectToStream: (streamId: string) => () => void;
    resetStream: () => void;
};
export {};
//# sourceMappingURL=useAssessmentContent.d.ts.map