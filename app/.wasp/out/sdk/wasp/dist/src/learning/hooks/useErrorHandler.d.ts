/**
 * React hooks for error handling in the learning platform
 */
import { LearningPlatformError } from '../errors/errorTypes';
export interface ErrorState {
    error: LearningPlatformError | null;
    isRetrying: boolean;
    retryCount: number;
    canRetry: boolean;
    retryAfter?: number;
}
export interface ErrorHandlerOptions {
    maxRetries?: number;
    enableAutoRetry?: boolean;
    retryDelay?: number;
    onError?: (error: LearningPlatformError) => void;
    onRetry?: (attempt: number) => void;
    onMaxRetriesReached?: (error: LearningPlatformError) => void;
}
export declare function useErrorHandler(options?: ErrorHandlerOptions): {
    error: LearningPlatformError | null;
    isRetrying: boolean;
    retryCount: number;
    canRetry: boolean;
    retryAfter: number | undefined;
    handleError: (error: Error | LearningPlatformError, operation?: () => Promise<any>) => void;
    retry: () => Promise<void>;
    clearError: () => void;
    executeWithErrorHandling: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T | null>;
};
export declare function useApiErrorHandler(options?: ErrorHandlerOptions): {
    executeApiCall: <T>(apiCall: () => Promise<T>, operationName?: string) => Promise<{
        data: T | null;
        error: LearningPlatformError | null;
    }>;
    error: LearningPlatformError | null;
    isRetrying: boolean;
    retryCount: number;
    canRetry: boolean;
    retryAfter: number | undefined;
    handleError: (error: Error | LearningPlatformError, operation?: () => Promise<any>) => void;
    retry: () => Promise<void>;
    clearError: () => void;
    executeWithErrorHandling: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T | null>;
};
export declare function useFormErrorHandler(): {
    fieldErrors: Record<string, LearningPlatformError>;
    generalError: LearningPlatformError | null;
    hasErrors: boolean;
    setFieldError: (field: string, error: LearningPlatformError) => void;
    clearFieldError: (field: string) => void;
    setFormError: (error: LearningPlatformError) => void;
    clearFormError: () => void;
    clearAllErrors: () => void;
};
export declare function useStreamingErrorHandler(options?: ErrorHandlerOptions): {
    isStreaming: boolean;
    streamError: LearningPlatformError | null;
    startStreaming: () => void;
    stopStreaming: () => void;
    handleStreamError: (error: Error | LearningPlatformError) => void;
    clearStreamError: () => void;
    error: LearningPlatformError | null;
    isRetrying: boolean;
    retryCount: number;
    canRetry: boolean;
    retryAfter: number | undefined;
    handleError: (error: Error | LearningPlatformError, operation?: () => Promise<any>) => void;
    retry: () => Promise<void>;
    clearError: () => void;
    executeWithErrorHandling: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T | null>;
};
export declare function useNetworkErrorHandler(): {
    isOnline: boolean;
    networkError: LearningPlatformError | null;
    checkNetworkAndExecute: <T>(operation: () => Promise<T>) => Promise<T | null>;
};
export declare function useErrorRecovery(): {
    registerRecoveryStrategy: (errorType: string, strategy: () => Promise<void>) => void;
    executeRecovery: (error: LearningPlatformError) => Promise<boolean>;
};
//# sourceMappingURL=useErrorHandler.d.ts.map