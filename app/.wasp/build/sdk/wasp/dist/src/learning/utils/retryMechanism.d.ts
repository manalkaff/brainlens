export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: Error) => boolean;
    onRetry?: (attempt: number, error: Error) => void;
}
export declare function withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
export declare class RetryableOperation<T> {
    private operation;
    private options;
    private currentAttempt;
    private isRunning;
    constructor(operation: () => Promise<T>, options?: RetryOptions);
    execute(): Promise<T>;
    getCurrentAttempt(): number;
    isExecuting(): boolean;
    getMaxAttempts(): number;
}
export declare const retryConfigs: {
    readonly contentGeneration: {
        readonly maxAttempts: 3;
        readonly baseDelay: 2000;
        readonly maxDelay: 15000;
        readonly backoffFactor: 2;
        readonly retryCondition: (error: Error) => boolean;
    };
    readonly topicSelection: {
        readonly maxAttempts: 2;
        readonly baseDelay: 500;
        readonly maxDelay: 2000;
        readonly backoffFactor: 2;
    };
    readonly apiRequest: {
        readonly maxAttempts: 3;
        readonly baseDelay: 1000;
        readonly maxDelay: 8000;
        readonly backoffFactor: 2;
    };
};
export declare function createRetryableOperation<T>(operation: () => Promise<T>, type: keyof typeof retryConfigs): RetryableOperation<T>;
//# sourceMappingURL=retryMechanism.d.ts.map