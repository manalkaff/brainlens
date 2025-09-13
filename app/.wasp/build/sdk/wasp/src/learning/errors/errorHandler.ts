/**
 * Centralized error handling utilities for the learning platform
 */

import { HttpError } from 'wasp/server';
import { 
  LearningPlatformError, 
  ErrorType, 
  ErrorSeverity, 
  classifyError, 
  logError,
  createLearningError,
  ERROR_CODES
} from './errorTypes';

// Server-side error handler
export function handleServerError(error: Error, operation: string, context?: Record<string, any>): never {
  const learningError = classifyError(error);
  
  // Log the error with context
  logError(learningError, { operation, ...context });
  
  // Convert to HttpError for Wasp
  const httpStatusCode = getHttpStatusCode(learningError);
  throw new HttpError(httpStatusCode, learningError.userMessage || learningError.message);
}

// Get appropriate HTTP status code for error type
function getHttpStatusCode(error: LearningPlatformError): number {
  switch (error.type) {
    case ErrorType.AUTHENTICATION_ERROR:
    case ErrorType.SESSION_EXPIRED:
      return 401;
    case ErrorType.AUTHORIZATION_ERROR:
      return 403;
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.INPUT_SANITIZATION_ERROR:
    case ErrorType.SCHEMA_VALIDATION_ERROR:
      return 400;
    case ErrorType.TOPIC_NOT_FOUND:
      return 404;
    case ErrorType.AI_RATE_LIMIT_ERROR:
    case ErrorType.AI_QUOTA_EXCEEDED:
      return 429;
    case ErrorType.SERVICE_UNAVAILABLE:
    case ErrorType.AI_API_ERROR:
    case ErrorType.VECTOR_STORE_ERROR:
      return 503;
    case ErrorType.TIMEOUT_ERROR:
      return 408;
    case ErrorType.DATABASE_CONNECTION_ERROR:
    case ErrorType.DATABASE_TIMEOUT_ERROR:
    case ErrorType.INTERNAL_SERVER_ERROR:
    case ErrorType.CONFIGURATION_ERROR:
      return 500;
    default:
      return 500;
  }
}

// Database operation wrapper with error handling
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes('connection')) {
        const dbError = createLearningError(
          ErrorType.DATABASE_CONNECTION_ERROR,
          ERROR_CODES.DB_CONNECTION_FAILED,
          `Database connection failed during ${operationName}`,
          {
            severity: ErrorSeverity.HIGH,
            recoverable: true,
            retryAfter: 5000,
            userMessage: 'Database connection error. Please try again.',
            technicalDetails: error.message,
            context,
            cause: error
          }
        );
        handleServerError(dbError, operationName, context);
      }
      
      if (error.message.includes('timeout')) {
        const timeoutError = createLearningError(
          ErrorType.DATABASE_TIMEOUT_ERROR,
          ERROR_CODES.DB_TIMEOUT,
          `Database timeout during ${operationName}`,
          {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 3000,
            userMessage: 'Database operation timed out. Please try again.',
            technicalDetails: error.message,
            context,
            cause: error
          }
        );
        handleServerError(timeoutError, operationName, context);
      }
      
      if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
        const constraintError = createLearningError(
          ErrorType.DATABASE_CONSTRAINT_ERROR,
          ERROR_CODES.DB_DUPLICATE_ENTRY,
          `Duplicate entry during ${operationName}`,
          {
            severity: ErrorSeverity.LOW,
            recoverable: false,
            userMessage: 'This item already exists.',
            technicalDetails: error.message,
            context,
            cause: error
          }
        );
        handleServerError(constraintError, operationName, context);
      }
    }
    
    // Generic database error
    handleServerError(error as Error, operationName, context);
  }
}

// AI service operation wrapper with error handling
export async function withAIServiceErrorHandling<T>(
  operation: () => Promise<T>,
  serviceName: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('rate limit') || message.includes('429')) {
        const rateLimitError = createLearningError(
          ErrorType.AI_RATE_LIMIT_ERROR,
          ERROR_CODES.AI_RATE_LIMIT_EXCEEDED,
          `Rate limit exceeded for ${serviceName}`,
          {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 60000,
            userMessage: 'AI service rate limit exceeded. Please wait a moment.',
            technicalDetails: error.message,
            context: { service: serviceName, ...context },
            cause: error
          }
        );
        handleServerError(rateLimitError, `AI_${serviceName}`, context);
      }
      
      if (message.includes('quota') || message.includes('limit')) {
        const quotaError = createLearningError(
          ErrorType.AI_QUOTA_EXCEEDED,
          ERROR_CODES.AI_QUOTA_EXCEEDED,
          `Quota exceeded for ${serviceName}`,
          {
            severity: ErrorSeverity.HIGH,
            recoverable: false,
            userMessage: 'AI service quota exceeded. Please upgrade your plan.',
            technicalDetails: error.message,
            context: { service: serviceName, ...context },
            cause: error
          }
        );
        handleServerError(quotaError, `AI_${serviceName}`, context);
      }
      
      if (message.includes('content') && message.includes('filter')) {
        const contentFilterError = createLearningError(
          ErrorType.AI_CONTENT_FILTER_ERROR,
          ERROR_CODES.AI_CONTENT_FILTERED,
          `Content filtered by ${serviceName}`,
          {
            severity: ErrorSeverity.LOW,
            recoverable: false,
            userMessage: 'Content was filtered by AI safety systems. Please try a different topic.',
            technicalDetails: error.message,
            context: { service: serviceName, ...context },
            cause: error
          }
        );
        handleServerError(contentFilterError, `AI_${serviceName}`, context);
      }
    }
    
    // Generic AI service error
    const aiError = createLearningError(
      ErrorType.AI_API_ERROR,
      ERROR_CODES.AI_API_UNAVAILABLE,
      `AI service error: ${serviceName}`,
      {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryAfter: 10000,
        userMessage: 'AI service is temporarily unavailable. Please try again.',
        technicalDetails: error instanceof Error ? error.message : 'Unknown error',
        context: { service: serviceName, ...context },
        cause: error instanceof Error ? error : undefined
      }
    );
    handleServerError(aiError, `AI_${serviceName}`, context);
  }
}

// Vector store operation wrapper with error handling
export async function withVectorStoreErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('connection') || message.includes('connect')) {
        const connectionError = createLearningError(
          ErrorType.VECTOR_STORE_ERROR,
          ERROR_CODES.VECTOR_CONNECTION_FAILED,
          `Vector store connection failed during ${operationName}`,
          {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 5000,
            userMessage: 'Search functionality is temporarily unavailable.',
            technicalDetails: error.message,
            context,
            cause: error
          }
        );
        handleServerError(connectionError, `VECTOR_${operationName}`, context);
      }
      
      if (message.includes('embedding')) {
        const embeddingError = createLearningError(
          ErrorType.EMBEDDING_GENERATION_ERROR,
          ERROR_CODES.VECTOR_EMBEDDING_FAILED,
          `Embedding generation failed during ${operationName}`,
          {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 3000,
            userMessage: 'Content indexing failed. Please try again.',
            technicalDetails: error.message,
            context,
            cause: error
          }
        );
        handleServerError(embeddingError, `VECTOR_${operationName}`, context);
      }
    }
    
    // Generic vector store error
    const vectorError = createLearningError(
      ErrorType.VECTOR_STORE_ERROR,
      ERROR_CODES.VECTOR_SEARCH_FAILED,
      `Vector store operation failed: ${operationName}`,
      {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryAfter: 5000,
        userMessage: 'Search functionality encountered an error. Please try again.',
        technicalDetails: error instanceof Error ? error.message : 'Unknown error',
        context,
        cause: error instanceof Error ? error : undefined
      }
    );
    handleServerError(vectorError, `VECTOR_${operationName}`, context);
  }
}

// Research pipeline operation wrapper with error handling
export async function withResearchPipelineErrorHandling<T>(
  operation: () => Promise<T>,
  stage: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const researchError = createLearningError(
      ErrorType.RESEARCH_PIPELINE_ERROR,
      ERROR_CODES.RESEARCH_INITIALIZATION_FAILED,
      `Research pipeline error at stage: ${stage}`,
      {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryAfter: 15000,
        userMessage: 'Research pipeline encountered an error. Please try again.',
        technicalDetails: error instanceof Error ? error.message : 'Unknown error',
        context: { stage, ...context },
        cause: error instanceof Error ? error : undefined
      }
    );
    handleServerError(researchError, `RESEARCH_${stage}`, context);
  }
}

// Input validation wrapper
export function validateInput<T>(
  input: any,
  validator: (input: any) => T,
  fieldName: string,
  context?: Record<string, any>
): T {
  try {
    return validator(input);
  } catch (error) {
    const validationError = createLearningError(
      ErrorType.VALIDATION_ERROR,
      ERROR_CODES.VALIDATION_INVALID_FORMAT,
      `Validation failed for field: ${fieldName}`,
      {
        severity: ErrorSeverity.LOW,
        recoverable: false,
        userMessage: error instanceof Error ? error.message : `Invalid ${fieldName}. Please check your input.`,
        technicalDetails: error instanceof Error ? error.message : 'Validation failed',
        context: { 
          field: fieldName, 
          input: typeof input === 'string' ? input : JSON.stringify(input),
          inputLength: typeof input === 'string' ? input.length : 'N/A',
          inputType: typeof input,
          ...context 
        },
        cause: error instanceof Error ? error : undefined
      }
    );
    handleServerError(validationError, 'INPUT_VALIDATION', context);
  }
}

// Sanitization wrapper
export function sanitizeInput(
  input: string,
  maxLength: number = 1000,
  allowedCharacters?: RegExp
): string {
  try {
    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }
    
    // Trim whitespace
    let sanitized = input.trim();
    
    // Check length
    if (sanitized.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    // Check allowed characters
    if (allowedCharacters && !allowedCharacters.test(sanitized)) {
      throw new Error('Input contains invalid characters');
    }
    
    // Basic HTML/script tag removal
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    return sanitized;
  } catch (error) {
    const sanitizationError = createLearningError(
      ErrorType.INPUT_SANITIZATION_ERROR,
      ERROR_CODES.VALIDATION_INVALID_CHARACTERS,
      'Input sanitization failed',
      {
        severity: ErrorSeverity.LOW,
        recoverable: false,
        userMessage: 'Invalid input format. Please check your input.',
        technicalDetails: error instanceof Error ? error.message : 'Sanitization failed',
        context: { input: input?.substring(0, 100) },
        cause: error instanceof Error ? error : undefined
      }
    );
    handleServerError(sanitizationError, 'INPUT_SANITIZATION');
  }
}

// Retry wrapper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      const learningError = classifyError(lastError);
      
      // Don't retry if error is not recoverable
      if (!learningError.recoverable) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = learningError.retryAfter || (baseDelay * Math.pow(2, attempt - 1));
      
      logError(learningError, { 
        attempt, 
        maxRetries, 
        nextRetryIn: delay,
        operation: operationName 
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted - lastError should be defined here
  if (!lastError) {
    lastError = new Error(`Operation failed after ${maxRetries} attempts: ${operationName}`);
  }
  
  const finalError = createLearningError(
    ErrorType.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    `Operation failed after ${maxRetries} attempts: ${operationName}`,
    {
      severity: ErrorSeverity.HIGH,
      recoverable: false,
      userMessage: 'Operation failed after multiple attempts. Please try again later.',
      technicalDetails: lastError.message,
      context: { attempts: maxRetries, operation: operationName },
      cause: lastError
    }
  );
  
  handleServerError(finalError, operationName);
}

// Circuit breaker pattern for external services
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>, serviceName: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw createLearningError(
          ErrorType.SERVICE_UNAVAILABLE,
          ERROR_CODES.SERVICE_UNAVAILABLE,
          `Service ${serviceName} is temporarily unavailable`,
          {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: this.recoveryTimeout - (Date.now() - this.lastFailureTime),
            userMessage: 'Service is temporarily unavailable. Please try again later.',
            context: { service: serviceName, circuitBreakerState: this.state }
          }
        );
      } else {
        this.state = 'HALF_OPEN';
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
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Global circuit breakers for different services
export const circuitBreakers = {
  aiService: new CircuitBreaker(5, 60000),
  vectorStore: new CircuitBreaker(3, 30000),
  searchAPI: new CircuitBreaker(5, 45000)
};

// Graceful degradation helper
export async function withGracefulDegradation<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await primaryOperation();
  } catch (error) {
    const learningError = classifyError(error as Error);
    
    logError(learningError, { 
      operation: operationName, 
      degradationTriggered: true 
    });
    
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      // If fallback also fails, throw original error
      throw error;
    }
  }
}