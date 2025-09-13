/**
 * Circuit breaker implementation for external service reliability
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    timeout: number;
    resetTimeout: number;
}
export interface CircuitBreakerState {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime?: Date;
    nextAttemptTime?: Date;
}
export declare class CircuitBreaker {
    private state;
    private config;
    constructor(config?: Partial<CircuitBreakerConfig>);
    isOpen(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
    canAttempt(): boolean;
    getState(): CircuitBreakerState;
}
export declare class CircuitBreakerManager {
    private breakers;
    getOrCreateBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
    isOpen(serviceName: string): boolean;
    recordSuccess(serviceName: string): void;
    recordFailure(serviceName: string): void;
    canAttempt(serviceName: string): boolean;
    getStatus(): Record<string, CircuitBreakerState>;
}
export declare const circuitBreakerManager: CircuitBreakerManager;
//# sourceMappingURL=circuitBreakers.d.ts.map