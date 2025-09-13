/**
 * Centralized error types and utilities for the learning platform
 */
// Error types
export var ErrorType;
(function (ErrorType) {
    // Authentication & Authorization
    ErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorType["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorType["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    // Validation Errors
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorType["INPUT_SANITIZATION_ERROR"] = "INPUT_SANITIZATION_ERROR";
    ErrorType["SCHEMA_VALIDATION_ERROR"] = "SCHEMA_VALIDATION_ERROR";
    // Database Errors
    ErrorType["DATABASE_CONNECTION_ERROR"] = "DATABASE_CONNECTION_ERROR";
    ErrorType["DATABASE_QUERY_ERROR"] = "DATABASE_QUERY_ERROR";
    ErrorType["DATABASE_CONSTRAINT_ERROR"] = "DATABASE_CONSTRAINT_ERROR";
    ErrorType["DATABASE_TIMEOUT_ERROR"] = "DATABASE_TIMEOUT_ERROR";
    // AI & External API Errors
    ErrorType["AI_API_ERROR"] = "AI_API_ERROR";
    ErrorType["AI_RATE_LIMIT_ERROR"] = "AI_RATE_LIMIT_ERROR";
    ErrorType["AI_QUOTA_EXCEEDED"] = "AI_QUOTA_EXCEEDED";
    ErrorType["AI_CONTENT_FILTER_ERROR"] = "AI_CONTENT_FILTER_ERROR";
    ErrorType["SEARCH_API_ERROR"] = "SEARCH_API_ERROR";
    // Vector Database Errors
    ErrorType["VECTOR_STORE_ERROR"] = "VECTOR_STORE_ERROR";
    ErrorType["EMBEDDING_GENERATION_ERROR"] = "EMBEDDING_GENERATION_ERROR";
    ErrorType["VECTOR_SEARCH_ERROR"] = "VECTOR_SEARCH_ERROR";
    // Research Pipeline Errors
    ErrorType["RESEARCH_PIPELINE_ERROR"] = "RESEARCH_PIPELINE_ERROR";
    ErrorType["AGENT_COORDINATION_ERROR"] = "AGENT_COORDINATION_ERROR";
    ErrorType["CONTENT_GENERATION_ERROR"] = "CONTENT_GENERATION_ERROR";
    // Network & Connection Errors
    ErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorType["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    // Business Logic Errors
    ErrorType["TOPIC_NOT_FOUND"] = "TOPIC_NOT_FOUND";
    ErrorType["QUIZ_GENERATION_ERROR"] = "QUIZ_GENERATION_ERROR";
    ErrorType["PROGRESS_UPDATE_ERROR"] = "PROGRESS_UPDATE_ERROR";
    ErrorType["CHAT_ERROR"] = "CHAT_ERROR";
    // System Errors
    ErrorType["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorType["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorType["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    // Client-side Errors
    ErrorType["CLIENT_ERROR"] = "CLIENT_ERROR";
    ErrorType["PARSING_ERROR"] = "PARSING_ERROR";
    ErrorType["RENDERING_ERROR"] = "RENDERING_ERROR";
})(ErrorType || (ErrorType = {}));
// Error severity levels
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL"; // System-breaking issues, immediate attention required
})(ErrorSeverity || (ErrorSeverity = {}));
// Error codes for specific scenarios
export const ERROR_CODES = {
    // Authentication
    AUTH_REQUIRED: 'AUTH_001',
    AUTH_INVALID_TOKEN: 'AUTH_002',
    AUTH_SESSION_EXPIRED: 'AUTH_003',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_004',
    // Validation
    VALIDATION_REQUIRED_FIELD: 'VAL_001',
    VALIDATION_INVALID_FORMAT: 'VAL_002',
    VALIDATION_LENGTH_EXCEEDED: 'VAL_003',
    VALIDATION_INVALID_CHARACTERS: 'VAL_004',
    // Database
    DB_CONNECTION_FAILED: 'DB_001',
    DB_QUERY_FAILED: 'DB_002',
    DB_CONSTRAINT_VIOLATION: 'DB_003',
    DB_TIMEOUT: 'DB_004',
    DB_RECORD_NOT_FOUND: 'DB_005',
    DB_DUPLICATE_ENTRY: 'DB_006',
    // AI Services
    AI_API_UNAVAILABLE: 'AI_001',
    AI_RATE_LIMIT_EXCEEDED: 'AI_002',
    AI_QUOTA_EXCEEDED: 'AI_003',
    AI_INVALID_RESPONSE: 'AI_004',
    AI_CONTENT_FILTERED: 'AI_005',
    AI_MODEL_OVERLOADED: 'AI_006',
    // Vector Database
    VECTOR_CONNECTION_FAILED: 'VEC_001',
    VECTOR_EMBEDDING_FAILED: 'VEC_002',
    VECTOR_SEARCH_FAILED: 'VEC_003',
    VECTOR_STORAGE_FAILED: 'VEC_004',
    // Research Pipeline
    RESEARCH_INITIALIZATION_FAILED: 'RES_001',
    RESEARCH_AGENT_FAILED: 'RES_002',
    RESEARCH_COORDINATION_FAILED: 'RES_003',
    RESEARCH_CONTENT_GENERATION_FAILED: 'RES_004',
    RESEARCH_TIMEOUT: 'RES_005',
    // Business Logic
    TOPIC_CREATION_FAILED: 'BIZ_001',
    TOPIC_NOT_FOUND: 'BIZ_002',
    QUIZ_GENERATION_FAILED: 'BIZ_003',
    PROGRESS_UPDATE_FAILED: 'BIZ_004',
    CHAT_MESSAGE_FAILED: 'BIZ_005',
    SUBSCRIPTION_LIMIT_REACHED: 'BIZ_006',
    // Network
    NETWORK_UNAVAILABLE: 'NET_001',
    REQUEST_TIMEOUT: 'NET_002',
    CONNECTION_LOST: 'NET_003',
    // System
    INTERNAL_ERROR: 'SYS_001',
    SERVICE_UNAVAILABLE: 'SYS_002',
    CONFIGURATION_ERROR: 'SYS_003'
};
// Error factory function
export function createLearningError(type, code, message, options = {}) {
    const error = new Error(message);
    error.code = code;
    error.type = type;
    error.severity = options.severity || ErrorSeverity.MEDIUM;
    error.recoverable = options.recoverable ?? true;
    error.retryAfter = options.retryAfter;
    error.context = options.context;
    error.userMessage = options.userMessage || message;
    error.technicalDetails = options.technicalDetails;
    if (options.cause) {
        error.cause = options.cause;
        error.stack = options.cause.stack;
    }
    return error;
}
// Predefined error creators
export const createAuthenticationError = (message, context) => createLearningError(ErrorType.AUTHENTICATION_ERROR, ERROR_CODES.AUTH_REQUIRED, message, {
    severity: ErrorSeverity.HIGH,
    recoverable: false,
    userMessage: 'Please log in to continue',
    context
});
export const createValidationError = (field, message, context) => createLearningError(ErrorType.VALIDATION_ERROR, ERROR_CODES.VALIDATION_REQUIRED_FIELD, `Validation failed for field: ${field}`, {
    severity: ErrorSeverity.LOW,
    recoverable: true,
    userMessage: message,
    context: { field, ...context }
});
export const createDatabaseError = (operation, cause, context) => createLearningError(ErrorType.DATABASE_QUERY_ERROR, ERROR_CODES.DB_QUERY_FAILED, `Database operation failed: ${operation}`, {
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryAfter: 3000,
    userMessage: 'A database error occurred. Please try again.',
    technicalDetails: cause?.message,
    context,
    cause
});
export const createAIServiceError = (service, cause, context) => createLearningError(ErrorType.AI_API_ERROR, ERROR_CODES.AI_API_UNAVAILABLE, `AI service error: ${service}`, {
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryAfter: 5000,
    userMessage: 'AI service is temporarily unavailable. Please try again.',
    technicalDetails: cause?.message,
    context,
    cause
});
export const createVectorStoreError = (operation, cause, context) => createLearningError(ErrorType.VECTOR_STORE_ERROR, ERROR_CODES.VECTOR_CONNECTION_FAILED, `Vector store operation failed: ${operation}`, {
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryAfter: 3000,
    userMessage: 'Search functionality is temporarily unavailable.',
    technicalDetails: cause?.message,
    context,
    cause
});
export const createResearchPipelineError = (stage, cause, context) => createLearningError(ErrorType.RESEARCH_PIPELINE_ERROR, ERROR_CODES.RESEARCH_INITIALIZATION_FAILED, `Research pipeline error at stage: ${stage}`, {
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryAfter: 10000,
    userMessage: 'Research is temporarily unavailable. Please try again.',
    technicalDetails: cause?.message,
    context,
    cause
});
// Error classification utility
export function classifyError(error) {
    if (isLearningPlatformError(error)) {
        return error;
    }
    // Classify based on error message patterns
    const message = error.message.toLowerCase();
    if (message.includes('unauthorized') || message.includes('401')) {
        return createAuthenticationError('Authentication required', { originalError: error.message });
    }
    if (message.includes('forbidden') || message.includes('403')) {
        return createLearningError(ErrorType.AUTHORIZATION_ERROR, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 'Insufficient permissions', {
            severity: ErrorSeverity.HIGH,
            recoverable: false,
            userMessage: 'You do not have permission to perform this action',
            cause: error
        });
    }
    if (message.includes('timeout') || message.includes('timed out')) {
        return createLearningError(ErrorType.TIMEOUT_ERROR, ERROR_CODES.REQUEST_TIMEOUT, 'Request timed out', {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 5000,
            userMessage: 'Request timed out. Please try again.',
            cause: error
        });
    }
    if (message.includes('network') || message.includes('fetch')) {
        return createLearningError(ErrorType.NETWORK_ERROR, ERROR_CODES.NETWORK_UNAVAILABLE, 'Network error', {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 3000,
            userMessage: 'Network error. Please check your connection and try again.',
            cause: error
        });
    }
    if (message.includes('rate limit') || message.includes('429')) {
        return createLearningError(ErrorType.AI_RATE_LIMIT_ERROR, ERROR_CODES.AI_RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', {
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryAfter: 60000,
            userMessage: 'Too many requests. Please wait a moment and try again.',
            cause: error
        });
    }
    // Default to internal server error
    return createLearningError(ErrorType.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred', {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        retryAfter: 5000,
        userMessage: 'An unexpected error occurred. Please try again.',
        technicalDetails: error.message,
        cause: error
    });
}
// Type guard
export function isLearningPlatformError(error) {
    return error && typeof error === 'object' && 'type' in error && 'code' in error;
}
// Error logging utility
export function logError(error, context) {
    const logData = {
        timestamp: new Date().toISOString(),
        type: error.type,
        code: error.code,
        message: error.message,
        severity: error.severity,
        recoverable: error.recoverable,
        context: { ...error.context, ...context },
        stack: error.stack,
        technicalDetails: error.technicalDetails
    };
    // Log based on severity
    switch (error.severity) {
        case ErrorSeverity.CRITICAL:
            console.error('CRITICAL ERROR:', logData);
            break;
        case ErrorSeverity.HIGH:
            console.error('HIGH SEVERITY ERROR:', logData);
            break;
        case ErrorSeverity.MEDIUM:
            console.warn('MEDIUM SEVERITY ERROR:', logData);
            break;
        case ErrorSeverity.LOW:
            console.info('LOW SEVERITY ERROR:', logData);
            break;
    }
}
//# sourceMappingURL=errorTypes.js.map