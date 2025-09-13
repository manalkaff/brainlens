export interface TopicError {
    type: 'selection' | 'content_generation' | 'navigation' | 'api';
    message: string;
    topicId?: string;
    retryable: boolean;
    timestamp: Date;
    retryCount?: number;
}
export interface UseTopicErrorHandlerReturn {
    errors: TopicError[];
    hasError: (topicId?: string) => boolean;
    getError: (topicId?: string) => TopicError | null;
    clearError: (topicId?: string) => void;
    clearAllErrors: () => void;
    handleError: (error: Error, context: {
        type: TopicError['type'];
        topicId?: string;
    }) => void;
    retryOperation: (topicId: string, operation: () => Promise<void>) => Promise<void>;
}
export declare function useTopicErrorHandler(): UseTopicErrorHandlerReturn;
//# sourceMappingURL=useTopicErrorHandler.d.ts.map