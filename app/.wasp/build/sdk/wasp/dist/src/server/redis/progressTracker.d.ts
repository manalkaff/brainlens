import type { ProgressUpdate, ResearchProgressData, SubtopicProgress } from '../../shared/progressTypes';
/**
 * Store or update research progress in Redis
 */
export declare function updateResearchProgress(topicId: string, update: ProgressUpdate): Promise<boolean>;
/**
 * Complete a research step with timing information
 */
export declare function completeResearchStep(topicId: string, stepNumber: number, stepName: string, result: any, duration: number): Promise<boolean>;
/**
 * Mark main topic research as completed
 */
export declare function completeMainTopic(topicId: string, result: any): Promise<boolean>;
/**
 * Update subtopic research progress
 */
export declare function updateSubtopicProgress(topicId: string, subtopicProgress: SubtopicProgress[]): Promise<boolean>;
/**
 * Get current research progress for a topic
 */
export declare function getResearchProgress(topicId: string): Promise<ResearchProgressData | null>;
/**
 * Check if research is currently in progress for a topic
 */
export declare function isResearchInProgress(topicId: string): Promise<boolean>;
/**
 * Get completed main topic result if available
 */
export declare function getCompletedMainTopic(topicId: string): Promise<any | null>;
/**
 * Initialize progress tracking for a new research session
 */
export declare function initializeProgress(topicId: string): Promise<boolean>;
/**
 * Set custom expiration time for progress data
 */
export declare function setProgressExpiration(topicId: string, ttlSeconds: number): Promise<boolean>;
/**
 * Clear all progress data for a topic
 */
export declare function clearResearchProgress(topicId: string): Promise<boolean>;
/**
 * Clean up expired progress entries (for maintenance)
 */
export declare function cleanupExpiredProgress(): Promise<number>;
/**
 * Get progress statistics for monitoring
 */
export declare function getProgressStats(): Promise<{
    totalActiveResearch: number;
    mainTopicResearch: number;
    subtopicResearch: number;
    completedResearch: number;
    erroredResearch: number;
}>;
/**
 * Update research step with start notification
 */
export declare function startResearchStep(topicId: string, stepNumber: number, message?: string): Promise<boolean>;
/**
 * Update research with error state
 */
export declare function setResearchError(topicId: string, error: string, currentStep?: number): Promise<boolean>;
/**
 * Mark all research as completed (including subtopics)
 */
export declare function completeAllResearch(topicId: string, mainTopicResult: any, message?: string): Promise<boolean>;
//# sourceMappingURL=progressTracker.d.ts.map