export interface SubtopicContentData {
    success: boolean;
    content?: string;
    metadata?: any;
    sources?: any[];
    topicId?: string;
    parentTopicId?: string;
    subtopicTitle?: string;
    fromDatabase?: boolean;
    generating?: boolean;
    progress?: {
        status: string;
        progress: number;
        message: string;
    };
    error?: string;
    message?: string;
    suggestion?: string;
}
export interface UseSubtopicContentOptions {
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningStyle?: 'textual' | 'visual' | 'interactive';
    pollInterval?: number;
    maxPollAttempts?: number;
}
export interface UseSubtopicContentReturn {
    content: SubtopicContentData | null;
    isLoading: boolean;
    isGenerating: boolean;
    error: string | null;
    progress: number;
    refetch: () => Promise<void>;
    clearError: () => void;
}
export declare function useSubtopicContent(mainTopicId: string | null, subtopicId: string | null, options?: UseSubtopicContentOptions): UseSubtopicContentReturn;
//# sourceMappingURL=useSubtopicContent.d.ts.map