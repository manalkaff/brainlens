interface StreamingContentOptions {
    topic: string;
    topicId: string;
    knowledgeLevel: number;
    learningStyles: string[];
    contentDepth: 'overview' | 'detailed' | 'comprehensive';
    difficultyPreference: 'gentle' | 'moderate' | 'challenging';
    enableRealTimeUpdates?: boolean;
}
interface ContentSection {
    id: string;
    title: string;
    content: string;
    isComplete: boolean;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    concepts: string[];
    isExpanded: boolean;
    agent?: string;
    progress?: number;
    isActive?: boolean;
}
export declare function useStreamingContent(): {
    sections: ContentSection[];
    currentSectionIndex: number;
    completion: string;
    isGenerating: boolean;
    isLoading: boolean;
    error: Error | null;
    progress: number;
    status: string;
    researchStreaming: {
        isConnected: boolean;
        currentStatus: import("../research/pipeline").ResearchStatus | null;
        statusMessage: string;
        hasErrors: boolean;
        errors: {
            error: string;
            agent?: string;
            recoverable: boolean;
        }[];
    } | null;
    generateContent: (options: StreamingContentOptions) => Promise<void>;
    regenerateSection: (sectionId: string, options: StreamingContentOptions) => Promise<void>;
    cancelGeneration: () => void;
    pauseGeneration: () => void;
    resumeGeneration: () => void;
    getEstimatedTimeRemaining: () => number;
    getCompletedSectionsCount: () => number;
};
export {};
//# sourceMappingURL=useStreamingContent.d.ts.map