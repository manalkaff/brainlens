/**
 * Circuit breaker implementation for external service reliability
 */
export class CircuitBreaker {
    state;
    config;
    constructor(config = {}) {
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
    isOpen() {
        return this.state.state === 'OPEN';
    }
    recordSuccess() {
        this.state.failureCount = 0;
        this.state.state = 'CLOSED';
        this.state.lastFailureTime = undefined;
        this.state.nextAttemptTime = undefined;
    }
    recordFailure() {
        this.state.failureCount++;
        this.state.lastFailureTime = new Date();
        if (this.state.failureCount >= this.config.failureThreshold) {
            this.state.state = 'OPEN';
            this.state.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
        }
    }
    canAttempt() {
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
    getState() {
        return { ...this.state };
    }
}
export class CircuitBreakerManager {
    breakers = new Map();
    getOrCreateBreaker(serviceName, config) {
        if (!this.breakers.has(serviceName)) {
            this.breakers.set(serviceName, new CircuitBreaker(config));
        }
        return this.breakers.get(serviceName);
    }
    isOpen(serviceName) {
        const breaker = this.breakers.get(serviceName);
        return breaker ? breaker.isOpen() : false;
    }
    recordSuccess(serviceName) {
        const breaker = this.getOrCreateBreaker(serviceName);
        breaker.recordSuccess();
    }
    recordFailure(serviceName) {
        const breaker = this.getOrCreateBreaker(serviceName);
        breaker.recordFailure();
    }
    canAttempt(serviceName) {
        const breaker = this.breakers.get(serviceName);
        return breaker ? breaker.canAttempt() : true;
    }
    getStatus() {
        const status = {};
        this.breakers.forEach((breaker, serviceName) => {
            status[serviceName] = breaker.getState();
        });
        return status;
    }
}
// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
//# sourceMappingURL=circuitBreakers.js.map