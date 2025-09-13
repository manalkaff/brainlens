/**
 * Client-side input validation utilities for the learning platform
 */
import { LearningPlatformError } from '../errors/errorTypes';
export interface ValidationResult {
    isValid: boolean;
    error?: LearningPlatformError;
    sanitizedValue?: any;
}
export declare function validateTopicTitle(title: string): ValidationResult;
export declare function validateChatMessage(message: string): ValidationResult;
export declare function validateQuizAnswer(answer: string, questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'CODE_CHALLENGE'): ValidationResult;
export declare function validateSearchQuery(query: string): ValidationResult;
export declare function validateProgressUpdate(data: {
    timeSpent?: number;
    completed?: boolean;
    bookmarks?: string[];
    preferences?: Record<string, any>;
}): ValidationResult;
export declare function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): ValidationResult;
export declare function validateUrl(url: string): ValidationResult;
export declare function validateForm<T extends Record<string, any>>(data: T, validators: Record<keyof T, (value: any) => ValidationResult>): {
    isValid: boolean;
    errors: Record<keyof T, LearningPlatformError>;
    sanitizedData: Partial<T>;
};
export type ResearchComplexity = 'simple' | 'moderate' | 'complex';
export interface ResearchInputValidation {
    isValid: boolean;
    sanitizedQuery: string;
    complexity: ResearchComplexity;
    keywords: string[];
    estimatedDuration: number;
    errors: string[];
}
export declare function validateResearchInput(input: string, context?: {
    userLevel?: string;
    topicDepth?: number;
}): ResearchInputValidation;
export declare function sanitizeSearchQuery(query: string): string;
export declare function extractTopicKeywords(topic: string): string[];
export declare function calculateResearchComplexity(topic: string, context?: {
    userLevel?: string;
    topicDepth?: number;
}): ResearchComplexity;
export declare function estimateResearchDuration(complexity: ResearchComplexity, keywordCount: number): number;
//# sourceMappingURL=inputValidation.d.ts.map