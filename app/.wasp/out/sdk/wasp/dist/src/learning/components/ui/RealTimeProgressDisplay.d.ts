import React from 'react';
export interface RealTimeProgressStep {
    number: number;
    name: string;
    description: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    progress: number;
    estimatedDuration?: number;
    result?: any;
}
export interface RealTimeProgressData {
    isActive: boolean;
    phase: 'main_topic' | 'subtopics' | 'completed';
    currentStep?: RealTimeProgressStep;
    completedSteps: RealTimeProgressStep[];
    overallProgress: number;
    mainTopicCompleted: boolean;
    subtopicsProgress?: Array<{
        title: string;
        status: 'pending' | 'in_progress' | 'completed' | 'error';
        progress: number;
    }>;
    estimatedTimeRemaining?: number;
    totalStepsCount?: number;
}
interface RealTimeProgressDisplayProps {
    progressData: RealTimeProgressData;
    topicTitle: string;
    onRetry?: () => void;
    onClear?: () => void;
    error?: string | null;
    className?: string;
}
export declare function RealTimeProgressDisplay({ progressData, topicTitle, onRetry, onClear, error, className }: RealTimeProgressDisplayProps): React.JSX.Element;
export default RealTimeProgressDisplay;
//# sourceMappingURL=RealTimeProgressDisplay.d.ts.map