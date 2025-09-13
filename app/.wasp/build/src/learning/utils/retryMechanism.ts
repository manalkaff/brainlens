export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /5\d\d/,
      /rate limit/i,
      /temporarily unavailable/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i
    ];
    
    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  },
  onRetry: () => {}
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...defaultRetryOptions, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if this is the last attempt or if the error is not retryable
      if (attempt === config.maxAttempts || !config.retryCondition(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      // Add some jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      config.onRetry(attempt, lastError);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
}

export class RetryableOperation<T> {
  private operation: () => Promise<T>;
  private options: Required<RetryOptions>;
  private currentAttempt = 0;
  private isRunning = false;
  
  constructor(operation: () => Promise<T>, options: RetryOptions = {}) {
    this.operation = operation;
    this.options = { ...defaultRetryOptions, ...options };
  }
  
  async execute(): Promise<T> {
    if (this.isRunning) {
      throw new Error('Operation is already running');
    }
    
    this.isRunning = true;
    this.currentAttempt = 0;
    
    try {
      return await withRetry(this.operation, {
        ...this.options,
        onRetry: (attempt, error) => {
          this.currentAttempt = attempt;
          this.options.onRetry(attempt, error);
        }
      });
    } finally {
      this.isRunning = false;
    }
  }
  
  getCurrentAttempt(): number {
    return this.currentAttempt;
  }
  
  isExecuting(): boolean {
    return this.isRunning;
  }
  
  getMaxAttempts(): number {
    return this.options.maxAttempts;
  }
}

// Specific retry configurations for different operation types
export const retryConfigs = {
  contentGeneration: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      // Don't retry on authentication or permission errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      // Don't retry on client errors (4xx except rate limiting)
      if (error.message.includes('400') || error.message.includes('404')) {
        return false;
      }
      return defaultRetryOptions.retryCondition(error);
    }
  },
  
  topicSelection: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2
  },
  
  apiRequest: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2
  }
} as const;

// Utility function to create retryable operations with predefined configs
export function createRetryableOperation<T>(
  operation: () => Promise<T>,
  type: keyof typeof retryConfigs
): RetryableOperation<T> {
  return new RetryableOperation(operation, retryConfigs[type]);
}