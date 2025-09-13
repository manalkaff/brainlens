export declare enum SearxngErrorType {
    CONNECTION_ERROR = "CONNECTION_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    INVALID_QUERY_ERROR = "INVALID_QUERY_ERROR",
    SERVER_ERROR = "SERVER_ERROR",
    PARSING_ERROR = "PARSING_ERROR",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR"
}
export interface SearxngError extends Error {
    type: SearxngErrorType;
    statusCode?: number;
    retryable: boolean;
    context?: Record<string, any>;
}
export declare function createSearxngError(type: SearxngErrorType, message: string, statusCode?: number, context?: Record<string, any>): SearxngError;
export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}
export declare class SearxngCircuitBreaker {
    private failures;
    private lastFailureTime;
    private state;
    private readonly failureThreshold;
    private readonly recoveryTimeout;
    private readonly monitoringWindow;
    constructor(failureThreshold?: number, recoveryTimeout?: number, // 1 minute
    monitoringWindow?: number);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private shouldAttemptReset;
    private onSuccess;
    private onFailure;
    getState(): {
        state: string;
        failures: number;
        lastFailureTime: Date | null;
    };
    reset(): void;
}
export declare class SearxngRetryHandler {
    private config;
    constructor(config?: Partial<RetryConfig>);
    execute<T>(operation: () => Promise<T>, context?: Record<string, any>): Promise<T>;
    private normalizeError;
    private mapHttpErrorToSearxngError;
    private calculateDelay;
    private delay;
    updateConfig(newConfig: Partial<RetryConfig>): void;
    getConfig(): RetryConfig;
}
export declare const searxngCircuitBreaker: SearxngCircuitBreaker;
export declare const searxngRetryHandler: SearxngRetryHandler;
export declare class SearxngErrorRecovery {
    /**
     * Handle SearXNG errors with appropriate recovery strategies
     */
    static handleError(error: SearxngError, fallbackStrategy?: 'cache' | 'mock' | 'alternative'): Promise<any>;
    private static handleRateLimitError;
    private static handleConnectionError;
    private static handleTimeoutError;
    private static handleInvalidQueryError;
    private static handleServerError;
    private static handleGenericError;
    private static getMockResults;
}
export declare function isSearxngError(error: any): error is SearxngError;
export declare function getSearxngErrorMessage(error: SearxngError): string;
//# sourceMappingURL=errorHandler.d.ts.map