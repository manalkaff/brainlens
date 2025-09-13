export interface StepInfo {
    stepNumber: number;
    name: string;
    description: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    result?: any;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress?: number;
    error?: string;
}
export interface SubtopicProgress {
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    startTime?: string;
    endTime?: string;
    duration?: number;
    result?: any;
    error?: string;
    topicId?: string;
}
export interface ResearchProgress {
    topicId: string;
    topicTitle: string;
    status: 'starting' | 'researching_main' | 'main_completed' | 'processing_subtopics' | 'completed' | 'failed';
    phase: 'initialization' | 'main_topic' | 'subtopics' | 'complete' | 'error';
    currentStep: number;
    totalSteps: number;
    overallProgress: number;
    message: string;
    startTime: string;
    lastUpdated: string;
    mainTopicCompleted: boolean;
    steps: StepInfo[];
    completedSteps: StepInfo[];
    subtopicsProgress: SubtopicProgress[];
    mainTopicResult?: any;
    estimatedTimeRemaining?: number;
    totalDuration?: number;
    error?: string;
}
export declare const RESEARCH_STEPS: Array<{
    stepNumber: number;
    name: string;
    description: string;
    estimatedDuration: number;
    progressWeight: number;
}>;
export declare class ProgressTracker {
    private readonly PROGRESS_TTL_SECONDS;
    private readonly KEY_PREFIX;
    private getProgressKey;
    initializeResearch(topicId: string, options: {
        topicTitle?: string;
        status?: string;
        message?: string;
    }): Promise<void>;
    startStep(topicId: string, stepNumber: number, customMessage?: string): Promise<void>;
    completeStep(topicId: string, stepNumber: number, stepName: string, result: any, duration: number): Promise<void>;
    completeMainTopic(topicId: string, result: any): Promise<void>;
    updatePhase(topicId: string, phase: ResearchProgress['phase'], message: string): Promise<void>;
    updateSubtopicProgress(topicId: string, subtopicTitle: string, subtopicProgress: Partial<SubtopicProgress>): Promise<void>;
    completeResearch(topicId: string): Promise<void>;
    setError(topicId: string, error: string): Promise<void>;
    getProgress(topicId: string): Promise<ResearchProgress | null>;
    setCompleted(topicId: string, message: string): Promise<void>;
    cleanupProgress(topicId: string): Promise<void>;
    isRedisAvailable(): Promise<boolean>;
    getProgressWithFallback(topicId: string): Promise<ResearchProgress | null>;
}
export declare const progressTracker: ProgressTracker;
//# sourceMappingURL=progressTracker.d.ts.map