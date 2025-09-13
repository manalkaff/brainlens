export type ResearchStatus = 'idle' | 'researching_main' | 'researching_subtopics' | 'completed' | 'error';
export type SubtopicStatus = 'pending' | 'in_progress' | 'completed' | 'error';
export interface StepDetails {
    name: string;
    description: string;
    startTime?: Date;
    endTime?: Date;
    progress: number;
    result?: any;
    error?: string;
}
export interface CompletedStep {
    number: number;
    name: string;
    description: string;
    duration: number;
    result: any;
    startTime: Date;
    endTime: Date;
}
export interface SubtopicProgress {
    subtopicId: string;
    title: string;
    status: SubtopicStatus;
    progress: number;
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
    progress: number;
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
    totalProgress: number;
    lastUpdated: Date;
    error?: string;
}
export declare const RESEARCH_STEPS: readonly [{
    readonly number: 0;
    readonly name: "Understanding Topic";
    readonly description: "Analyzing and understanding the research topic";
}, {
    readonly number: 1;
    readonly name: "Planning Research";
    readonly description: "Creating a comprehensive research plan";
}, {
    readonly number: 2;
    readonly name: "Executing Research";
    readonly description: "Gathering information from multiple sources";
}, {
    readonly number: 3;
    readonly name: "Processing Information";
    readonly description: "Analyzing and processing collected data";
}, {
    readonly number: 4;
    readonly name: "Generating Content";
    readonly description: "Creating structured learning content";
}, {
    readonly number: 5;
    readonly name: "Finalizing Topic";
    readonly description: "Completing main topic research and content";
}];
export type ResearchStep = typeof RESEARCH_STEPS[number];
export declare function createInitialProgress(topicId: string): ProgressUpdate;
export declare function createStepStartProgress(topicId: string, stepNumber: number, message?: string): ProgressUpdate;
export declare function createStepCompleteProgress(topicId: string, stepNumber: number, result: any, duration: number, message?: string): ProgressUpdate;
export declare function createMainTopicCompleteProgress(topicId: string, result: any, message?: string): ProgressUpdate;
export declare function createSubtopicProgress(subtopicId: string, title: string, status: SubtopicStatus, progress: number, error?: string): SubtopicProgress;
export declare function createErrorProgress(topicId: string, error: string, currentStep?: number): ProgressUpdate;
export declare function createCompleteProgress(topicId: string, mainTopicResult: any, message?: string): ProgressUpdate;
export declare function calculateOverallProgress(mainTopicProgress: number, subtopicsProgress: SubtopicProgress[]): number;
export declare function isResearchInProgress(status: ResearchStatus): boolean;
export declare function isResearchComplete(status: ResearchStatus): boolean;
export declare function isResearchError(status: ResearchStatus): boolean;
export declare function isMainTopicComplete(progress: ResearchProgressData): boolean;
export declare function getProgressKey(topicId: string): string;
export declare function getProgressLockKey(topicId: string): string;
export declare function getProgressExpirationKey(topicId: string): string;
//# sourceMappingURL=progressTypes.d.ts.map