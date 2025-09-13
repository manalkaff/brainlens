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

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      resetTimeout: 30000, // 30 seconds
      ...config
    };

    this.state = {
      state: 'CLOSED',
      failureCount: 0
    };
  }

  isOpen(): boolean {
    return this.state.state === 'OPEN';
  }

  recordSuccess(): void {
    this.state.failureCount = 0;
    this.state.state = 'CLOSED';
    this.state.lastFailureTime = undefined;
    this.state.nextAttemptTime = undefined;
  }

  recordFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = new Date();

    if (this.state.failureCount >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    }
  }

  canAttempt(): boolean {
    if (this.state.state === 'CLOSED') {
      return true;
    }

    if (this.state.state === 'OPEN' && this.state.nextAttemptTime) {
      if (Date.now() >= this.state.nextAttemptTime.getTime()) {
        this.state.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    if (this.state.state === 'HALF_OPEN') {
      return true;
    }

    return false;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  getOrCreateBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(config));
    }
    return this.breakers.get(serviceName)!;
  }

  isOpen(serviceName: string): boolean {
    const breaker = this.breakers.get(serviceName);
    return breaker ? breaker.isOpen() : false;
  }

  recordSuccess(serviceName: string): void {
    const breaker = this.getOrCreateBreaker(serviceName);
    breaker.recordSuccess();
  }

  recordFailure(serviceName: string): void {
    const breaker = this.getOrCreateBreaker(serviceName);
    breaker.recordFailure();
  }

  canAttempt(serviceName: string): boolean {
    const breaker = this.breakers.get(serviceName);
    return breaker ? breaker.canAttempt() : true;
  }

  getStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.breakers.forEach((breaker, serviceName) => {
      status[serviceName] = breaker.getState();
    });
    return status;
  }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();