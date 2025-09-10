// Redis infrastructure exports
export * from './client';
export * from './progressTracker';

// Re-export shared types for convenience (avoid conflicts)
export type {
  ProgressUpdate,
  ResearchProgressData,
  SubtopicProgress,
  CompletedStep,
  ResearchStatus,
  StepDetails,
  SubtopicStatus,
  ResearchStep
} from '../../shared/progressTypes';

export {
  RESEARCH_STEPS,
  createInitialProgress,
  createStepStartProgress,
  createStepCompleteProgress,
  createMainTopicCompleteProgress,
  createSubtopicProgress,
  createErrorProgress,
  createCompleteProgress,
  calculateOverallProgress,
  isResearchComplete,
  isResearchError,
  isMainTopicComplete,
  getProgressKey,
  getProgressLockKey,
  getProgressExpirationKey
} from '../../shared/progressTypes';