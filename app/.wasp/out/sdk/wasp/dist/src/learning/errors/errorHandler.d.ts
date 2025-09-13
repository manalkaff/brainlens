/**
 * Centralized error handling utilities for the learning platform
 */
export declare function handleServerError(error: Error, operation: string, context?: Record<string, any>): never;
export declare function withDatabaseErrorHandling<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<T>;
export declare function withAIServiceErrorHandling<T>(operation: () => Promise<T>, serviceName: string, context?: Record<string, any>): Promise<T>;
export declare function withVectorStoreErrorHandling<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<T>;
export declare function withResearchPipelineErrorHandling<T>(operation: () => Promise<T>, stage: string, context?: Record<string, any>): Promise<T>;
export declare function validateInput<T>(input: any, validator: (input: any) => T, fieldName: string, context?: Record<string, any>): T;
export declare function sanitizeInput(input: string, maxLength?: number, allowedCharacters?: RegExp): string;
export declare function withRetry<T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number, operationName?: string): Promise<T>;
declare class CircuitBreaker {
    private readonly failureThreshold;
    private readonly recoveryTimeout;
    private failures;
    private lastFailureTime;
    private state;
    constructor(failureThreshold?: number, recoveryTimeout?: number);
    execute<T>(operation: () => Promise<T>, serviceName: string): Promise<T>;
    private onSuccess;
    private onFailure;
}
export declare const circuitBreakers: {
    aiService: CircuitBreaker;
    vectorStore: CircuitBreaker;
    searchAPI: CircuitBreaker;
};
export declare function withGracefulDegradation<T>(primaryOperation: () => Promise<T>, fallbackOperation: () => Promise<T>, operationName: string): Promise<T>;
export {};
//# sourceMappingURL=errorHandler.d.ts.map