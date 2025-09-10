import { safeRedisOperationWithCircuitBreaker } from './client';
import type {
  ProgressUpdate,
  ResearchProgressData,
  SubtopicProgress,
  CompletedStep,
  ResearchStatus,
  StepDetails
} from '../../shared/progressTypes';
import {
  getProgressKey,
  getProgressLockKey,
  RESEARCH_STEPS,
  calculateOverallProgress,
  createInitialProgress
} from '../../shared/progressTypes';

const DEFAULT_PROGRESS_TTL = parseInt(process.env.PROGRESS_TTL_SECONDS || '3600'); // 1 hour
const LOCK_TTL = 30; // 30 seconds for operation locks

/**
 * Store or update research progress in Redis
 */
export async function updateResearchProgress(
  topicId: string,
  update: ProgressUpdate
): Promise<boolean> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    const lockKey = getProgressLockKey(topicId);
    
    // Try to acquire lock for atomic updates
    const lockAcquired = await client.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
    if (!lockAcquired) {
      console.warn(`Progress update skipped for topic ${topicId}: lock not acquired`);
      return false;
    }

    try {
      // Get existing progress data
      const existingData = await client.hgetall(key);
      let currentData: ResearchProgressData;

      if (Object.keys(existingData).length === 0) {
        // Initialize new progress data
        currentData = {
          status: 'idle',
          currentStep: -1,
          stepDetails: {
            name: 'Initializing',
            description: 'Starting research process',
            progress: 0
          },
          completedSteps: [],
          mainTopicCompleted: false,
          subtopicsProgress: [],
          subtopicsInProgress: [],
          totalProgress: 0,
          lastUpdated: new Date()
        };
      } else {
        // Parse existing data
        currentData = {
          status: existingData.status as ResearchStatus,
          currentStep: parseInt(existingData.currentStep || '-1'),
          stepDetails: JSON.parse(existingData.stepDetails || '{}'),
          completedSteps: JSON.parse(existingData.completedSteps || '[]'),
          mainTopicCompleted: existingData.mainTopicCompleted === 'true',
          mainTopicResult: existingData.mainTopicResult ? JSON.parse(existingData.mainTopicResult) : undefined,
          subtopicsProgress: JSON.parse(existingData.subtopicsProgress || '[]'),
          subtopicsInProgress: JSON.parse(existingData.subtopicsInProgress || '[]'),
          totalProgress: parseInt(existingData.totalProgress || '0'),
          lastUpdated: new Date(existingData.lastUpdated || Date.now()),
          error: existingData.error
        };
      }

      // Update with new data
      if (update.status !== undefined) currentData.status = update.status;
      if (update.currentStep !== undefined) currentData.currentStep = update.currentStep;
      if (update.error !== undefined) currentData.error = update.error;
      if (update.mainTopicResult !== undefined) {
        currentData.mainTopicResult = update.mainTopicResult;
        currentData.mainTopicCompleted = true;
      }
      if (update.subtopicsProgress !== undefined) {
        currentData.subtopicsProgress = update.subtopicsProgress;
      }

      // Update step details
      if (update.stepName || update.stepDescription || update.stepStartTime || update.stepEndTime) {
        currentData.stepDetails = {
          ...currentData.stepDetails,
          name: update.stepName || currentData.stepDetails.name,
          description: update.stepDescription || currentData.stepDetails.description,
          progress: update.progress || currentData.stepDetails.progress,
          startTime: update.stepStartTime || currentData.stepDetails.startTime,
          endTime: update.stepEndTime || currentData.stepDetails.endTime,
          result: update.stepResult || currentData.stepDetails.result,
          error: update.stepError || currentData.stepDetails.error
        };
      }

      // Calculate overall progress
      currentData.totalProgress = calculateOverallProgress(
        update.progress || currentData.totalProgress,
        currentData.subtopicsProgress
      );

      currentData.lastUpdated = new Date();

      // Store updated data
      const dataToStore = {
        status: currentData.status,
        currentStep: currentData.currentStep.toString(),
        stepDetails: JSON.stringify(currentData.stepDetails),
        completedSteps: JSON.stringify(currentData.completedSteps),
        mainTopicCompleted: currentData.mainTopicCompleted.toString(),
        mainTopicResult: currentData.mainTopicResult ? JSON.stringify(currentData.mainTopicResult) : '',
        subtopicsProgress: JSON.stringify(currentData.subtopicsProgress),
        subtopicsInProgress: JSON.stringify(currentData.subtopicsInProgress),
        totalProgress: currentData.totalProgress.toString(),
        lastUpdated: currentData.lastUpdated.toISOString(),
        error: currentData.error || ''
      };

      await client.hmset(key, dataToStore);
      await client.expire(key, DEFAULT_PROGRESS_TTL);

      console.log(`Progress updated for topic ${topicId}: ${update.message || 'No message'}`);
      return true;
    } finally {
      // Always release the lock
      await client.del(lockKey);
    }
  }, false) ?? false;
}

/**
 * Complete a research step with timing information
 */
export async function completeResearchStep(
  topicId: string,
  stepNumber: number,
  stepName: string,
  result: any,
  duration: number
): Promise<boolean> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    const existingData = await client.hgetall(key);
    
    if (Object.keys(existingData).length === 0) {
      console.error(`No progress data found for topic ${topicId} when completing step ${stepNumber}`);
      return false;
    }

    const completedSteps: CompletedStep[] = JSON.parse(existingData.completedSteps || '[]');
    const stepDetails: StepDetails = JSON.parse(existingData.stepDetails || '{}');
    
    // Create completed step entry
    const completedStep: CompletedStep = {
      number: stepNumber,
      name: stepName,
      description: stepDetails.description || `Step ${stepNumber}: ${stepName}`,
      duration,
      result,
      startTime: stepDetails.startTime || new Date(),
      endTime: new Date()
    };

    // Add to completed steps (avoid duplicates)
    const existingStepIndex = completedSteps.findIndex(step => step.number === stepNumber);
    if (existingStepIndex >= 0) {
      completedSteps[existingStepIndex] = completedStep;
    } else {
      completedSteps.push(completedStep);
    }

    // Update progress
    const progress = Math.round(((stepNumber + 1) / RESEARCH_STEPS.length) * 100);
    
    const updateData = {
      completedSteps: JSON.stringify(completedSteps),
      totalProgress: progress.toString(),
      lastUpdated: new Date().toISOString()
    };

    await client.hmset(key, updateData);
    await client.expire(key, DEFAULT_PROGRESS_TTL);

    console.log(`Step ${stepNumber} completed for topic ${topicId} in ${duration}s`);
    return true;
  }, false) ?? false;
}

/**
 * Mark main topic research as completed
 */
export async function completeMainTopic(topicId: string, result: any): Promise<boolean> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    
    const updateData = {
      status: 'researching_subtopics',
      mainTopicCompleted: 'true',
      mainTopicResult: JSON.stringify(result),
      totalProgress: '100',
      lastUpdated: new Date().toISOString()
    };

    await client.hmset(key, updateData);
    await client.expire(key, DEFAULT_PROGRESS_TTL);

    console.log(`Main topic completed for ${topicId}`);
    return true;
  }, false) ?? false;
}

/**
 * Update subtopic research progress
 */
export async function updateSubtopicProgress(
  topicId: string,
  subtopicProgress: SubtopicProgress[]
): Promise<boolean> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    const existingData = await client.hgetall(key);
    
    if (Object.keys(existingData).length === 0) {
      console.error(`No progress data found for topic ${topicId} when updating subtopics`);
      return false;
    }

    // Get subtopics currently in progress
    const subtopicsInProgress = subtopicProgress
      .filter(sub => sub.status === 'in_progress')
      .map(sub => sub.subtopicId);

    // Calculate overall progress including subtopics
    const mainTopicProgress = parseInt(existingData.totalProgress || '0');
    const overallProgress = calculateOverallProgress(mainTopicProgress, subtopicProgress);

    const updateData = {
      subtopicsProgress: JSON.stringify(subtopicProgress),
      subtopicsInProgress: JSON.stringify(subtopicsInProgress),
      totalProgress: overallProgress.toString(),
      lastUpdated: new Date().toISOString()
    };

    await client.hmset(key, updateData);
    await client.expire(key, DEFAULT_PROGRESS_TTL);

    console.log(`Subtopic progress updated for ${topicId}: ${subtopicProgress.length} subtopics`);
    return true;
  }, false) ?? false;
}

/**
 * Get current research progress for a topic
 */
export async function getResearchProgress(topicId: string): Promise<ResearchProgressData | null> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    const data = await client.hgetall(key);
    
    if (Object.keys(data).length === 0) {
      return null;
    }

    return {
      status: data.status as ResearchStatus,
      currentStep: parseInt(data.currentStep || '-1'),
      stepDetails: JSON.parse(data.stepDetails || '{}'),
      completedSteps: JSON.parse(data.completedSteps || '[]'),
      mainTopicCompleted: data.mainTopicCompleted === 'true',
      mainTopicResult: data.mainTopicResult ? JSON.parse(data.mainTopicResult) : undefined,
      subtopicsProgress: JSON.parse(data.subtopicsProgress || '[]'),
      subtopicsInProgress: JSON.parse(data.subtopicsInProgress || '[]'),
      totalProgress: parseInt(data.totalProgress || '0'),
      lastUpdated: new Date(data.lastUpdated || Date.now()),
      error: data.error || undefined
    };
  }, null);
}

/**
 * Check if research is currently in progress for a topic
 */
export async function isResearchInProgress(topicId: string): Promise<boolean> {
  const progress = await getResearchProgress(topicId);
  if (!progress) return false;
  
  return progress.status === 'researching_main' || progress.status === 'researching_subtopics';
}

/**
 * Get completed main topic result if available
 */
export async function getCompletedMainTopic(topicId: string): Promise<any | null> {
  const progress = await getResearchProgress(topicId);
  if (!progress || !progress.mainTopicCompleted) return null;
  
  return progress.mainTopicResult || null;
}

/**
 * Initialize progress tracking for a new research session
 */
export async function initializeProgress(topicId: string): Promise<boolean> {
  const initialProgress = createInitialProgress(topicId);
  return await updateResearchProgress(topicId, initialProgress);
}

/**
 * Set custom expiration time for progress data
 */
export async function setProgressExpiration(topicId: string, ttlSeconds: number): Promise<boolean> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    const result = await client.expire(key, ttlSeconds);
    return result === 1;
  }, false) ?? false;
}

/**
 * Clear all progress data for a topic
 */
export async function clearResearchProgress(topicId: string): Promise<boolean> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const key = getProgressKey(topicId);
    const lockKey = getProgressLockKey(topicId);
    
    const result = await client.del(key, lockKey);
    console.log(`Progress cleared for topic ${topicId}`);
    return result > 0;
  }, false) ?? false;
}

/**
 * Clean up expired progress entries (for maintenance)
 */
export async function cleanupExpiredProgress(): Promise<number> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const pattern = 'research:progress:*';
    let cursor = '0';
    let deletedCount = 0;
    
    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      
      for (const key of keys) {
        const ttl = await client.ttl(key);
        if (ttl === -1) {
          // Key exists but has no expiration, set default TTL
          await client.expire(key, DEFAULT_PROGRESS_TTL);
        } else if (ttl === -2) {
          // Key doesn't exist or expired, should not happen in this scan but clean up anyway
          deletedCount++;
        }
      }
    } while (cursor !== '0');
    
    console.log(`Cleaned up expired progress entries: ${deletedCount} removed`);
    return deletedCount;
  }, 0) ?? 0;
}

/**
 * Get progress statistics for monitoring
 */
export async function getProgressStats(): Promise<{
  totalActiveResearch: number;
  mainTopicResearch: number;
  subtopicResearch: number;
  completedResearch: number;
  erroredResearch: number;
}> {
  return await safeRedisOperationWithCircuitBreaker(async (client) => {
    const pattern = 'research:progress:*';
    let cursor = '0';
    let stats = {
      totalActiveResearch: 0,
      mainTopicResearch: 0,
      subtopicResearch: 0,
      completedResearch: 0,
      erroredResearch: 0
    };
    
    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      
      for (const key of keys) {
        const status = await client.hget(key, 'status');
        if (status) {
          switch (status) {
            case 'researching_main':
              stats.mainTopicResearch++;
              stats.totalActiveResearch++;
              break;
            case 'researching_subtopics':
              stats.subtopicResearch++;
              stats.totalActiveResearch++;
              break;
            case 'completed':
              stats.completedResearch++;
              break;
            case 'error':
              stats.erroredResearch++;
              break;
          }
        }
      }
    } while (cursor !== '0');
    
    return stats;
  }, {
    totalActiveResearch: 0,
    mainTopicResearch: 0,
    subtopicResearch: 0,
    completedResearch: 0,
    erroredResearch: 0
  }) ?? {
    totalActiveResearch: 0,
    mainTopicResearch: 0,
    subtopicResearch: 0,
    completedResearch: 0,
    erroredResearch: 0
  };
}

/**
 * Update research step with start notification
 */
export async function startResearchStep(
  topicId: string,
  stepNumber: number,
  message?: string
): Promise<boolean> {
  const step = RESEARCH_STEPS[stepNumber];
  if (!step) {
    console.error(`Invalid step number: ${stepNumber}`);
    return false;
  }

  const update: ProgressUpdate = {
    topicId,
    status: 'researching_main',
    currentStep: stepNumber,
    stepName: step.name,
    stepDescription: step.description,
    stepStartTime: new Date(),
    progress: Math.round((stepNumber / RESEARCH_STEPS.length) * 100),
    message: message || `Starting ${step.name}`,
    lastUpdated: new Date()
  };

  return await updateResearchProgress(topicId, update);
}

/**
 * Update research with error state
 */
export async function setResearchError(
  topicId: string,
  error: string,
  currentStep?: number
): Promise<boolean> {
  const update: ProgressUpdate = {
    topicId,
    status: 'error',
    currentStep,
    progress: 0,
    message: `Research failed: ${error}`,
    error,
    stepError: error,
    lastUpdated: new Date()
  };

  return await updateResearchProgress(topicId, update);
}

/**
 * Mark all research as completed (including subtopics)
 */
export async function completeAllResearch(
  topicId: string,
  mainTopicResult: any,
  message?: string
): Promise<boolean> {
  const update: ProgressUpdate = {
    topicId,
    status: 'completed',
    progress: 100,
    mainTopicResult,
    message: message || 'All research completed successfully',
    lastUpdated: new Date()
  };

  return await updateResearchProgress(topicId, update);
}