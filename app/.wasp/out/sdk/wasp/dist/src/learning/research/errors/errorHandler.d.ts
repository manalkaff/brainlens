/**
 * Research Error Handler Module
 * Provides error handling, recovery strategies, and error types for the research system
 */
export declare enum ResearchErrorType {
    VECTOR_STORE_ERROR = "VECTOR_STORE_ERROR",
    AGENT_ERROR = "AGENT_ERROR",
    STREAMING_ERROR = "STREAMING_ERROR",
    PIPELINE_ERROR = "PIPELINE_ERROR",
    SEARXNG_ERROR = "SEARXNG_ERROR",
    AGGREGATION_ERROR = "AGGREGATION_ERROR",
    EMBEDDING_ERROR = "EMBEDDING_ERROR"
}
export declare class ResearchError extends Error {
    readonly type: ResearchErrorType;
    readonly code: string;
    readonly context?: Record<string, any>;
    readonly recoverable: boolean;
    readonly timestamp: Date;
    constructor(type: ResearchErrorType, message: string, code: string, context?: Record<string, any>, recoverable?: boolean);
}
export declare class AgentError extends ResearchError {
    constructor(message: string, agentName: string, context?: Record<string, any>);
}
export declare class VectorStoreError extends ResearchError {
    constructor(message: string, operation: string, context?: Record<string, any>);
}
export declare class StreamingError extends ResearchError {
    constructor(message: string, connectionId?: string, context?: Record<string, any>);
}
export interface ErrorRecoveryStrategy {
    canRecover: (error: ResearchError) => boolean;
    recover: (error: ResearchError, context?: any) => Promise<any>;
    maxRetries: number;
    retryDelay: number;
}
export declare function handleResearchError(error: Error, operation: string, context?: Record<string, any>): Promise<{
    handled: boolean;
    result?: any;
    shouldRetry: boolean;
    newError?: Error;
}>;
export declare function createRecoveryStrategy(errorType: ResearchErrorType, strategy: ErrorRecoveryStrategy): void;
export declare function formatErrorForUser(error: ResearchError): string;
declare class CircuitBreaker {
    private maxFailures;
    private timeout;
    private failures;
    private lastFailureTime;
    private state;
    constructor(maxFailures?: number, timeout?: number);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): string;
}
export declare const circuitBreakers: {
    vectorStore: CircuitBreaker;
    searxng: CircuitBreaker;
    agents: CircuitBreaker;
    embedding: CircuitBreaker;
};
export {};
//# sourceMappingURL=errorHandler.d.ts.map