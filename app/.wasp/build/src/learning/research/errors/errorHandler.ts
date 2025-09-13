/**
 * Research Error Handler Module
 * Provides error handling, recovery strategies, and error types for the research system
 */

import { HttpError } from 'wasp/server';

// Error types specific to research system
export enum ResearchErrorType {
  VECTOR_STORE_ERROR = 'VECTOR_STORE_ERROR',
  AGENT_ERROR = 'AGENT_ERROR', 
  STREAMING_ERROR = 'STREAMING_ERROR',
  PIPELINE_ERROR = 'PIPELINE_ERROR',
  SEARXNG_ERROR = 'SEARXNG_ERROR',
  AGGREGATION_ERROR = 'AGGREGATION_ERROR',
  EMBEDDING_ERROR = 'EMBEDDING_ERROR'
}

// Base research error class
export class ResearchError extends Error {
  public readonly type: ResearchErrorType;
  public readonly code: string;
  public readonly context?: Record<string, any>;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;

  constructor(
    type: ResearchErrorType,
    message: string,
    code: string,
    context?: Record<string, any>,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ResearchError';
    this.type = type;
    this.code = code;
    this.context = context;
    this.recoverable = recoverable;
    this.timestamp = new Date();
  }
}

// Specific error classes
export class AgentError extends ResearchError {
  constructor(message: string, agentName: string, context?: Record<string, any>) {
    super(
      ResearchErrorType.AGENT_ERROR,
      message,
      'AGENT_FAILURE',
      { agentName, ...context },
      true
    );
    this.name = 'AgentError';
  }
}

export class VectorStoreError extends ResearchError {
  constructor(message: string, operation: string, context?: Record<string, any>) {
    super(
      ResearchErrorType.VECTOR_STORE_ERROR,
      message,
      'VECTOR_STORE_FAILURE',
      { operation, ...context },
      true
    );
    this.name = 'VectorStoreError';
  }
}

export class StreamingError extends ResearchError {
  constructor(message: string, connectionId?: string, context?: Record<string, any>) {
    super(
      ResearchErrorType.STREAMING_ERROR,
      message,
      'STREAMING_FAILURE',
      { connectionId, ...context },
      true
    );
    this.name = 'StreamingError';
  }
}

// Error recovery strategy interface
export interface ErrorRecoveryStrategy {
  canRecover: (error: ResearchError) => boolean;
  recover: (error: ResearchError, context?: any) => Promise<any>;
  maxRetries: number;
  retryDelay: number;
}

// Recovery strategies
const defaultRecoveryStrategies: Map<ResearchErrorType, ErrorRecoveryStrategy> = new Map([
  [ResearchErrorType.AGENT_ERROR, {
    canRecover: (error) => error.recoverable && error.code !== 'AGENT_TIMEOUT',
    recover: async (error, context) => {
      console.log(`Attempting to recover from agent error: ${error.message}`);
      // Retry with different agent or fallback
      return null;
    },
    maxRetries: 2,
    retryDelay: 1000
  }],
  
  [ResearchErrorType.VECTOR_STORE_ERROR, {
    canRecover: (error) => error.recoverable,
    recover: async (error, context) => {
      console.log(`Attempting to recover from vector store error: ${error.message}`);
      // Retry connection or use fallback storage
      return null;
    },
    maxRetries: 3,
    retryDelay: 2000
  }],
  
  [ResearchErrorType.STREAMING_ERROR, {
    canRecover: (error) => error.recoverable,
    recover: async (error, context) => {
      console.log(`Attempting to recover from streaming error: ${error.message}`);
      // Reconnect or switch to polling
      return null;
    },
    maxRetries: 5,
    retryDelay: 1000
  }]
]);

// Main error handler function
export async function handleResearchError(
  error: Error,
  operation: string,
  context?: Record<string, any>
): Promise<{
  handled: boolean;
  result?: any;
  shouldRetry: boolean;
  newError?: Error;
}> {
  try {
    // Convert to research error if needed
    let researchError: ResearchError;
    
    if (error instanceof ResearchError) {
      researchError = error;
    } else {
      // Determine error type based on context or message
      const errorType = inferErrorType(error, operation, context);
      researchError = new ResearchError(
        errorType,
        error.message,
        'UNKNOWN_ERROR',
        { originalError: error.name, operation, ...context }
      );
    }

    // Log the error
    console.error(`Research error in ${operation}:`, {
      type: researchError.type,
      code: researchError.code,
      message: researchError.message,
      context: researchError.context,
      timestamp: researchError.timestamp
    });

    // Get recovery strategy
    const recoveryStrategy = defaultRecoveryStrategies.get(researchError.type);
    
    if (recoveryStrategy && recoveryStrategy.canRecover(researchError)) {
      try {
        const result = await recoveryStrategy.recover(researchError, context);
        return {
          handled: true,
          result,
          shouldRetry: true
        };
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        return {
          handled: false,
          shouldRetry: false,
          newError: new ResearchError(
            researchError.type,
            `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`,
            'RECOVERY_FAILED',
            { originalError: researchError, recoveryError },
            false
          )
        };
      }
    }

    // Cannot recover
    return {
      handled: false,
      shouldRetry: false,
      newError: researchError
    };

  } catch (handlerError) {
    console.error('Error in error handler:', handlerError);
    return {
      handled: false,
      shouldRetry: false,
      newError: new Error(`Error handling failed: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`)
    };
  }
}

// Infer error type from error and context
function inferErrorType(error: Error, operation: string, context?: Record<string, any>): ResearchErrorType {
  const message = error.message.toLowerCase();
  
  if (message.includes('vector') || message.includes('qdrant') || message.includes('embedding')) {
    return ResearchErrorType.VECTOR_STORE_ERROR;
  }
  
  if (message.includes('agent') || operation.includes('agent')) {
    return ResearchErrorType.AGENT_ERROR;
  }
  
  if (message.includes('stream') || message.includes('connection')) {
    return ResearchErrorType.STREAMING_ERROR;
  }
  
  if (message.includes('searx') || message.includes('search')) {
    return ResearchErrorType.SEARXNG_ERROR;
  }
  
  if (message.includes('aggregate') || message.includes('merge')) {
    return ResearchErrorType.AGGREGATION_ERROR;
  }
  
  return ResearchErrorType.PIPELINE_ERROR;
}

// Create recovery strategy
export function createRecoveryStrategy(
  errorType: ResearchErrorType,
  strategy: ErrorRecoveryStrategy
): void {
  defaultRecoveryStrategies.set(errorType, strategy);
}

// Error reporting utilities
export function formatErrorForUser(error: ResearchError): string {
  switch (error.type) {
    case ResearchErrorType.AGENT_ERROR:
      return 'Research agent encountered an issue. Retrying with alternative approach.';
    
    case ResearchErrorType.VECTOR_STORE_ERROR:
      return 'Database connection issue. Please try again in a moment.';
    
    case ResearchErrorType.STREAMING_ERROR:
      return 'Real-time updates temporarily unavailable. Research will continue.';
    
    case ResearchErrorType.SEARXNG_ERROR:
      return 'Search service temporarily unavailable. Using cached results.';
    
    default:
      return 'A temporary issue occurred during research. Please try again.';
  }
}

// Circuit breaker implementation for external services
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private maxFailures: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Export circuit breakers for different services
export const circuitBreakers = {
  vectorStore: new CircuitBreaker(3, 30000),
  searxng: new CircuitBreaker(5, 60000),
  agents: new CircuitBreaker(3, 45000),
  embedding: new CircuitBreaker(3, 30000)
};