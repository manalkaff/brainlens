export type ResearchStatus = 
  | 'idle'
  | 'researching_main'
  | 'researching_subtopics'
  | 'completed'
  | 'error';

export type SubtopicStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'error';

export interface StepDetails {
  name: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  progress: number; // 0-100
  result?: any;
  error?: string;
}

export interface CompletedStep {
  number: number;
  name: string;
  description: string;
  duration: number; // in seconds
  result: any;
  startTime: Date;
  endTime: Date;
}

export interface SubtopicProgress {
  subtopicId: string;
  title: string;
  status: SubtopicStatus;
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface ProgressUpdate {
  topicId: string;
  status: ResearchStatus;
  currentStep?: number;
  stepName?: string;
  stepDescription?: string;
  stepStartTime?: Date;
  stepEndTime?: Date;
  stepResult?: any;
  stepError?: string;
  progress: number; // 0-100 overall progress
  message: string;
  mainTopicResult?: any;
  subtopicsProgress?: SubtopicProgress[];
  error?: string;
  lastUpdated: Date;
}

export interface ResearchProgressData {
  status: ResearchStatus;
  currentStep: number;
  stepDetails: StepDetails;
  completedSteps: CompletedStep[];
  mainTopicCompleted: boolean;
  mainTopicResult?: any;
  subtopicsProgress: SubtopicProgress[];
  subtopicsInProgress: string[];
  totalProgress: number; // 0-100
  lastUpdated: Date;
  error?: string;
}

// Step definitions for the 6-step research process
export const RESEARCH_STEPS = [
  {
    number: 0,
    name: 'Understanding Topic',
    description: 'Analyzing and understanding the research topic'
  },
  {
    number: 1,
    name: 'Planning Research',
    description: 'Creating a comprehensive research plan'
  },
  {
    number: 2,
    name: 'Executing Research',
    description: 'Gathering information from multiple sources'
  },
  {
    number: 3,
    name: 'Processing Information',
    description: 'Analyzing and processing collected data'
  },
  {
    number: 4,
    name: 'Generating Content',
    description: 'Creating structured learning content'
  },
  {
    number: 5,
    name: 'Finalizing Topic',
    description: 'Completing main topic research and content'
  }
] as const;

export type ResearchStep = typeof RESEARCH_STEPS[number];

// Helper functions for working with progress data
export function createInitialProgress(topicId: string): ProgressUpdate {
  return {
    topicId,
    status: 'idle',
    progress: 0,
    message: 'Research initialized',
    lastUpdated: new Date()
  };
}

export function createStepStartProgress(
  topicId: string,
  stepNumber: number,
  message?: string
): ProgressUpdate {
  const step = RESEARCH_STEPS[stepNumber];
  return {
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
}

export function createStepCompleteProgress(
  topicId: string,
  stepNumber: number,
  result: any,
  duration: number,
  message?: string
): ProgressUpdate {
  const step = RESEARCH_STEPS[stepNumber];
  return {
    topicId,
    status: 'researching_main',
    currentStep: stepNumber,
    stepName: step.name,
    stepDescription: step.description,
    stepEndTime: new Date(),
    stepResult: result,
    progress: Math.round(((stepNumber + 1) / RESEARCH_STEPS.length) * 100),
    message: message || `Completed ${step.name} in ${duration}s`,
    lastUpdated: new Date()
  };
}

export function createMainTopicCompleteProgress(
  topicId: string,
  result: any,
  message?: string
): ProgressUpdate {
  return {
    topicId,
    status: 'researching_subtopics',
    progress: 100,
    mainTopicResult: result,
    message: message || 'Main topic research completed, processing subtopics',
    lastUpdated: new Date()
  };
}

export function createSubtopicProgress(
  subtopicId: string,
  title: string,
  status: SubtopicStatus,
  progress: number,
  error?: string
): SubtopicProgress {
  return {
    subtopicId,
    title,
    status,
    progress,
    startTime: status === 'in_progress' ? new Date() : undefined,
    endTime: status === 'completed' || status === 'error' ? new Date() : undefined,
    error
  };
}

export function createErrorProgress(
  topicId: string,
  error: string,
  currentStep?: number
): ProgressUpdate {
  return {
    topicId,
    status: 'error',
    currentStep,
    progress: 0,
    message: `Research failed: ${error}`,
    error,
    lastUpdated: new Date()
  };
}

export function createCompleteProgress(
  topicId: string,
  mainTopicResult: any,
  message?: string
): ProgressUpdate {
  return {
    topicId,
    status: 'completed',
    progress: 100,
    mainTopicResult,
    message: message || 'All research completed successfully',
    lastUpdated: new Date()
  };
}

// Utility function to calculate overall progress including subtopics
export function calculateOverallProgress(
  mainTopicProgress: number,
  subtopicsProgress: SubtopicProgress[]
): number {
  // Main topic is 70% of overall progress, subtopics are 30%
  const mainWeight = 0.7;
  const subtopicWeight = 0.3;
  
  const mainContribution = mainTopicProgress * mainWeight;
  
  let subtopicContribution = 0;
  if (subtopicsProgress.length > 0) {
    const avgSubtopicProgress = subtopicsProgress.reduce((sum, sub) => sum + sub.progress, 0) / subtopicsProgress.length;
    subtopicContribution = avgSubtopicProgress * subtopicWeight;
  }
  
  return Math.round(mainContribution + subtopicContribution);
}

// Type guards
export function isResearchInProgress(status: ResearchStatus): boolean {
  return status === 'researching_main' || status === 'researching_subtopics';
}

export function isResearchComplete(status: ResearchStatus): boolean {
  return status === 'completed';
}

export function isResearchError(status: ResearchStatus): boolean {
  return status === 'error';
}

export function isMainTopicComplete(progress: ResearchProgressData): boolean {
  return progress.mainTopicCompleted || progress.status === 'researching_subtopics' || progress.status === 'completed';
}

// Redis key helpers
export function getProgressKey(topicId: string): string {
  return `research:progress:${topicId}`;
}

export function getProgressLockKey(topicId: string): string {
  return `research:progress:lock:${topicId}`;
}

export function getProgressExpirationKey(topicId: string): string {
  return `research:progress:expire:${topicId}`;
}