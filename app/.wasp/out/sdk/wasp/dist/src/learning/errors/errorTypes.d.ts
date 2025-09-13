/**
 * Centralized error types and utilities for the learning platform
 */
export interface LearningPlatformError extends Error {
    code: string;
    type: ErrorType;
    severity: ErrorSeverity;
    recoverable: boolean;
    retryAfter?: number;
    context?: Record<string, any>;
    userMessage?: string;
    technicalDetails?: string;
}
export declare enum ErrorType {
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INPUT_SANITIZATION_ERROR = "INPUT_SANITIZATION_ERROR",
    SCHEMA_VALIDATION_ERROR = "SCHEMA_VALIDATION_ERROR",
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
    DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
    DATABASE_CONSTRAINT_ERROR = "DATABASE_CONSTRAINT_ERROR",
    DATABASE_TIMEOUT_ERROR = "DATABASE_TIMEOUT_ERROR",
    AI_API_ERROR = "AI_API_ERROR",
    AI_RATE_LIMIT_ERROR = "AI_RATE_LIMIT_ERROR",
    AI_QUOTA_EXCEEDED = "AI_QUOTA_EXCEEDED",
    AI_CONTENT_FILTER_ERROR = "AI_CONTENT_FILTER_ERROR",
    SEARCH_API_ERROR = "SEARCH_API_ERROR",
    VECTOR_STORE_ERROR = "VECTOR_STORE_ERROR",
    EMBEDDING_GENERATION_ERROR = "EMBEDDING_GENERATION_ERROR",
    VECTOR_SEARCH_ERROR = "VECTOR_SEARCH_ERROR",
    RESEARCH_PIPELINE_ERROR = "RESEARCH_PIPELINE_ERROR",
    AGENT_COORDINATION_ERROR = "AGENT_COORDINATION_ERROR",
    CONTENT_GENERATION_ERROR = "CONTENT_GENERATION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    CONNECTION_ERROR = "CONNECTION_ERROR",
    TOPIC_NOT_FOUND = "TOPIC_NOT_FOUND",
    QUIZ_GENERATION_ERROR = "QUIZ_GENERATION_ERROR",
    PROGRESS_UPDATE_ERROR = "PROGRESS_UPDATE_ERROR",
    CHAT_ERROR = "CHAT_ERROR",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    CLIENT_ERROR = "CLIENT_ERROR",
    PARSING_ERROR = "PARSING_ERROR",
    RENDERING_ERROR = "RENDERING_ERROR"
}
export declare enum ErrorSeverity {
    LOW = "LOW",// Minor issues, user can continue
    MEDIUM = "MEDIUM",// Significant issues, some functionality affected
    HIGH = "HIGH",// Major issues, core functionality affected
    CRITICAL = "CRITICAL"
}
export declare const ERROR_CODES: {
    readonly AUTH_REQUIRED: "AUTH_001";
    readonly AUTH_INVALID_TOKEN: "AUTH_002";
    readonly AUTH_SESSION_EXPIRED: "AUTH_003";
    readonly AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_004";
    readonly VALIDATION_REQUIRED_FIELD: "VAL_001";
    readonly VALIDATION_INVALID_FORMAT: "VAL_002";
    readonly VALIDATION_LENGTH_EXCEEDED: "VAL_003";
    readonly VALIDATION_INVALID_CHARACTERS: "VAL_004";
    readonly DB_CONNECTION_FAILED: "DB_001";
    readonly DB_QUERY_FAILED: "DB_002";
    readonly DB_CONSTRAINT_VIOLATION: "DB_003";
    readonly DB_TIMEOUT: "DB_004";
    readonly DB_RECORD_NOT_FOUND: "DB_005";
    readonly DB_DUPLICATE_ENTRY: "DB_006";
    readonly AI_API_UNAVAILABLE: "AI_001";
    readonly AI_RATE_LIMIT_EXCEEDED: "AI_002";
    readonly AI_QUOTA_EXCEEDED: "AI_003";
    readonly AI_INVALID_RESPONSE: "AI_004";
    readonly AI_CONTENT_FILTERED: "AI_005";
    readonly AI_MODEL_OVERLOADED: "AI_006";
    readonly VECTOR_CONNECTION_FAILED: "VEC_001";
    readonly VECTOR_EMBEDDING_FAILED: "VEC_002";
    readonly VECTOR_SEARCH_FAILED: "VEC_003";
    readonly VECTOR_STORAGE_FAILED: "VEC_004";
    readonly RESEARCH_INITIALIZATION_FAILED: "RES_001";
    readonly RESEARCH_AGENT_FAILED: "RES_002";
    readonly RESEARCH_COORDINATION_FAILED: "RES_003";
    readonly RESEARCH_CONTENT_GENERATION_FAILED: "RES_004";
    readonly RESEARCH_TIMEOUT: "RES_005";
    readonly TOPIC_CREATION_FAILED: "BIZ_001";
    readonly TOPIC_NOT_FOUND: "BIZ_002";
    readonly QUIZ_GENERATION_FAILED: "BIZ_003";
    readonly PROGRESS_UPDATE_FAILED: "BIZ_004";
    readonly CHAT_MESSAGE_FAILED: "BIZ_005";
    readonly SUBSCRIPTION_LIMIT_REACHED: "BIZ_006";
    readonly NETWORK_UNAVAILABLE: "NET_001";
    readonly REQUEST_TIMEOUT: "NET_002";
    readonly CONNECTION_LOST: "NET_003";
    readonly INTERNAL_ERROR: "SYS_001";
    readonly SERVICE_UNAVAILABLE: "SYS_002";
    readonly CONFIGURATION_ERROR: "SYS_003";
};
export declare function createLearningError(type: ErrorType, code: string, message: string, options?: {
    severity?: ErrorSeverity;
    recoverable?: boolean;
    retryAfter?: number;
    context?: Record<string, any>;
    userMessage?: string;
    technicalDetails?: string;
    cause?: Error;
}): LearningPlatformError;
export declare const createAuthenticationError: (message: string, context?: Record<string, any>) => LearningPlatformError;
export declare const createValidationError: (field: string, message: string, context?: Record<string, any>) => LearningPlatformError;
export declare const createDatabaseError: (operation: string, cause?: Error, context?: Record<string, any>) => LearningPlatformError;
export declare const createAIServiceError: (service: string, cause?: Error, context?: Record<string, any>) => LearningPlatformError;
export declare const createVectorStoreError: (operation: string, cause?: Error, context?: Record<string, any>) => LearningPlatformError;
export declare const createResearchPipelineError: (stage: string, cause?: Error, context?: Record<string, any>) => LearningPlatformError;
export declare function classifyError(error: Error): LearningPlatformError;
export declare function isLearningPlatformError(error: any): error is LearningPlatformError;
export declare function logError(error: LearningPlatformError, context?: Record<string, any>): void;
//# sourceMappingURL=errorTypes.d.ts.map