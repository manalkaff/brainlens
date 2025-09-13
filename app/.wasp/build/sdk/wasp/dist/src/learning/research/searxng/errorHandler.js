import { HttpError } from 'wasp/server';
// Error types specific to SearXNG operations
export var SearxngErrorType;
(function (SearxngErrorType) {
    SearxngErrorType["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    SearxngErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    SearxngErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    SearxngErrorType["INVALID_QUERY_ERROR"] = "INVALID_QUERY_ERROR";
    SearxngErrorType["SERVER_ERROR"] = "SERVER_ERROR";
    SearxngErrorType["PARSING_ERROR"] = "PARSING_ERROR";
    SearxngErrorType["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    SearxngErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
})(SearxngErrorType || (SearxngErrorType = {}));
// Create specific SearXNG errors
export function createSearxngError(type, message, statusCode, context) {
    const error = new Error(message);
    error.type = type;
    error.statusCode = statusCode;
    error.context = context;
    // Determine if error is retryable
    error.retryable = isRetryableError(type, statusCode);
    return error;
}
// Determine if an error type is retryable
function isRetryableError(type, statusCode) {
    switch (type) {
        case SearxngErrorType.CONNECTION_ERROR:
        case SearxngErrorType.TIMEOUT_ERROR:
        case SearxngErrorType.NETWORK_ERROR:
            return true;
        case SearxngErrorType.RATE_LIMIT_ERROR:
            return true; // Can retry with backoff
        case SearxngErrorType.SERVER_ERROR:
            return statusCode ? statusCode >= 500 : true;
        case SearxngErrorType.INVALID_QUERY_ERROR:
        case SearxngErrorType.PARSING_ERROR:
        case SearxngErrorType.CONFIGURATION_ERROR:
            return false;
        default:
            return false;
    }
}
const DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true
};
// Circuit breaker for SearXNG operations
export class SearxngCircuitBreaker {
    failures = 0;
    lastFailureTime = null;
    state = 'closed';
    failureThreshold;
    recoveryTimeout;
    monitoringWindow;
    constructor(failureThreshold = 5, recoveryTimeout = 60000, // 1 minute
    monitoringWindow = 300000 // 5 minutes
    ) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
        this.monitoringWindow = monitoringWindow;
    }
    async execute(operation) {
        if (this.state === 'open') {
            if (this.shouldAttemptReset()) {
                this.state = 'half-open';
            }
            else {
                throw createSearxngError(SearxngErrorType.SERVER_ERROR, 'SearXNG service is temporarily unavailable (circuit breaker open)', 503, { circuitBreakerState: this.state, failures: this.failures });
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    shouldAttemptReset() {
        if (!this.lastFailureTime)
            return false;
        return Date.now() - this.lastFailureTime.getTime() > this.recoveryTimeout;
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'closed';
        this.lastFailureTime = null;
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = new Date();
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
        }
    }
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime
        };
    }
    reset() {
        this.failures = 0;
        this.state = 'closed';
        this.lastFailureTime = null;
    }
}
// Retry handler with exponential backoff
export class SearxngRetryHandler {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    }
    async execute(operation, context) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = this.normalizeError(error, context);
                // Don't retry non-retryable errors
                if (!lastError.retryable) {
                    throw lastError;
                }
                // Don't retry on last attempt
                if (attempt === this.config.maxAttempts) {
                    break;
                }
                // Calculate delay with exponential backoff
                const delay = this.calculateDelay(attempt);
                console.warn(`SearXNG operation failed (attempt ${attempt}/${this.config.maxAttempts}), retrying in ${delay}ms:`, lastError.message);
                await this.delay(delay);
            }
        }
        // All attempts failed
        throw createSearxngError(SearxngErrorType.SERVER_ERROR, `SearXNG operation failed after ${this.config.maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`, 503, { attempts: this.config.maxAttempts, lastError: lastError?.message });
    }
    normalizeError(error, context) {
        if (error.type && Object.values(SearxngErrorType).includes(error.type)) {
            return error;
        }
        // Convert common errors to SearxngError
        if (error instanceof HttpError) {
            const type = this.mapHttpErrorToSearxngError(error.statusCode);
            return createSearxngError(type, error.message, error.statusCode, context);
        }
        if (error.name === 'AbortError') {
            return createSearxngError(SearxngErrorType.TIMEOUT_ERROR, 'Request was aborted or timed out', 408, context);
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return createSearxngError(SearxngErrorType.CONNECTION_ERROR, `Connection failed: ${error.message}`, 503, context);
        }
        // Default to network error
        return createSearxngError(SearxngErrorType.NETWORK_ERROR, error.message || 'Unknown network error', 500, context);
    }
    mapHttpErrorToSearxngError(statusCode) {
        if (statusCode === 400)
            return SearxngErrorType.INVALID_QUERY_ERROR;
        if (statusCode === 408)
            return SearxngErrorType.TIMEOUT_ERROR;
        if (statusCode === 429)
            return SearxngErrorType.RATE_LIMIT_ERROR;
        if (statusCode >= 500)
            return SearxngErrorType.SERVER_ERROR;
        return SearxngErrorType.NETWORK_ERROR;
    }
    calculateDelay(attempt) {
        let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
        // Apply maximum delay limit
        delay = Math.min(delay, this.config.maxDelay);
        // Add jitter to prevent thundering herd
        if (this.config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        return Math.floor(delay);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return { ...this.config };
    }
}
// Global instances
export const searxngCircuitBreaker = new SearxngCircuitBreaker();
export const searxngRetryHandler = new SearxngRetryHandler();
// Error recovery strategies
export class SearxngErrorRecovery {
    /**
     * Handle SearXNG errors with appropriate recovery strategies
     */
    static async handleError(error, fallbackStrategy) {
        console.error('SearXNG error occurred:', {
            type: error.type,
            message: error.message,
            statusCode: error.statusCode,
            retryable: error.retryable,
            context: error.context
        });
        switch (error.type) {
            case SearxngErrorType.RATE_LIMIT_ERROR:
                return this.handleRateLimitError(error, fallbackStrategy);
            case SearxngErrorType.CONNECTION_ERROR:
            case SearxngErrorType.NETWORK_ERROR:
                return this.handleConnectionError(error, fallbackStrategy);
            case SearxngErrorType.TIMEOUT_ERROR:
                return this.handleTimeoutError(error, fallbackStrategy);
            case SearxngErrorType.INVALID_QUERY_ERROR:
                return this.handleInvalidQueryError(error);
            case SearxngErrorType.SERVER_ERROR:
                return this.handleServerError(error, fallbackStrategy);
            default:
                return this.handleGenericError(error, fallbackStrategy);
        }
    }
    static async handleRateLimitError(error, fallbackStrategy) {
        // For rate limits, we should wait and potentially use cache
        if (fallbackStrategy === 'cache') {
            return { results: [], suggestions: [], totalResults: 0, fromCache: true };
        }
        throw error; // Let retry handler deal with it
    }
    static async handleConnectionError(error, fallbackStrategy) {
        if (fallbackStrategy === 'mock') {
            return this.getMockResults();
        }
        if (fallbackStrategy === 'cache') {
            return { results: [], suggestions: [], totalResults: 0, fromCache: true };
        }
        throw error;
    }
    static async handleTimeoutError(error, fallbackStrategy) {
        if (fallbackStrategy === 'cache') {
            return { results: [], suggestions: [], totalResults: 0, fromCache: true };
        }
        throw error;
    }
    static async handleInvalidQueryError(error) {
        // For invalid queries, we can't really recover
        throw createSearxngError(SearxngErrorType.INVALID_QUERY_ERROR, 'Search query is invalid and cannot be processed', 400, error.context);
    }
    static async handleServerError(error, fallbackStrategy) {
        if (fallbackStrategy === 'mock') {
            return this.getMockResults();
        }
        throw error;
    }
    static async handleGenericError(error, fallbackStrategy) {
        if (fallbackStrategy === 'mock') {
            return this.getMockResults();
        }
        throw error;
    }
    static getMockResults() {
        return {
            results: [
                {
                    title: 'Search temporarily unavailable',
                    url: '#',
                    content: 'Search service is temporarily unavailable. Please try again later.',
                    engine: 'fallback'
                }
            ],
            suggestions: [],
            totalResults: 1,
            fromFallback: true
        };
    }
}
// Utility functions
export function isSearxngError(error) {
    return error && typeof error === 'object' && 'type' in error &&
        Object.values(SearxngErrorType).includes(error.type);
}
export function getSearxngErrorMessage(error) {
    const baseMessage = error.message || 'Unknown SearXNG error';
    switch (error.type) {
        case SearxngErrorType.CONNECTION_ERROR:
            return `Cannot connect to SearXNG service: ${baseMessage}`;
        case SearxngErrorType.TIMEOUT_ERROR:
            return `SearXNG request timed out: ${baseMessage}`;
        case SearxngErrorType.RATE_LIMIT_ERROR:
            return `SearXNG rate limit exceeded: ${baseMessage}`;
        case SearxngErrorType.INVALID_QUERY_ERROR:
            return `Invalid search query: ${baseMessage}`;
        case SearxngErrorType.SERVER_ERROR:
            return `SearXNG server error: ${baseMessage}`;
        default:
            return baseMessage;
    }
}
//# sourceMappingURL=errorHandler.js.map