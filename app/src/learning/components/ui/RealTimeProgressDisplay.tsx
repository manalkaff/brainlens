import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Button } from '../../../components/ui/button';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Zap,
  AlertCircle,
  PlayCircle,
  Target,
  TrendingUp
} from 'lucide-react';

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

export function RealTimeProgressDisplay({ 
  progressData, 
  topicTitle, 
  onRetry, 
  onClear,
  error,
  className = '' 
}: RealTimeProgressDisplayProps) {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `~${seconds}s remaining`;
    if (seconds < 3600) return `~${Math.floor(seconds / 60)}m remaining`;
    return `~${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m remaining`;
  };

  const calculateElapsedTime = (startTime: string): number => {
    return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  };

  const getPhaseLabel = (phase: string): string => {
    switch (phase) {
      case 'main_topic': return 'Researching Main Topic';
      case 'subtopics': return 'Processing Subtopics';
      case 'completed': return 'Research Complete';
      default: return 'Processing';
    }
  };

  const totalSteps = progressData.totalStepsCount || 6;
  const currentStepNumber = progressData.currentStep?.number ?? 0;
  const completedStepsCount = progressData.completedSteps.length;

  return (
    <div className={`flex items-center justify-center h-[calc(100vh-200px)] bg-background ${className}`}>
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-6">
          {/* Header with Icon and Title */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              {error ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : progressData.phase === 'completed' ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">
                {error ? 'Research Error' : 
                 progressData.phase === 'completed' ? 'Research Complete' :
                 'AI Learning Engine at Work'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {error ? error :
                 progressData.phase === 'completed' ? 
                   `Successfully researched "${topicTitle}" with comprehensive AI analysis.` :
                   `Our AI agent is researching "${topicTitle}" comprehensively using multiple sources and learning iteratively.`}
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Research Failed</span>
              </div>
              <p className="text-sm">{error}</p>
              {onRetry && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Retry Research
                  </Button>
                  {onClear && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClear}
                      className="text-muted-foreground"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress Section */}
          {!error && (
            <>
              {/* Phase and Overall Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{getPhaseLabel(progressData.phase)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {completedStepsCount} of {totalSteps} steps completed
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${progressData.overallProgress}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progressData.overallProgress.toFixed(0)}% overall progress</span>
                    {progressData.estimatedTimeRemaining && progressData.estimatedTimeRemaining > 0 && (
                      <span>{formatTimeRemaining(progressData.estimatedTimeRemaining)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Step Details */}
              {progressData.currentStep && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">
                          Step {progressData.currentStep.number + 1}: {progressData.currentStep.name}
                        </h4>
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {progressData.currentStep.progress}%
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {progressData.currentStep.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progressData.currentStep.progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDuration(calculateElapsedTime(progressData.currentStep.startTime))} elapsed
                      </span>
                      {progressData.currentStep.estimatedDuration && (
                        <span>
                          ~{formatDuration(progressData.currentStep.estimatedDuration)} estimated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Steps */}
              {progressData.completedSteps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-sm">Completed Steps</h4>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {progressData.completedSteps.map((step) => (
                      <div key={step.number} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium">
                            Step {step.number + 1}: {step.name}
                          </span>
                        </div>
                        <div className="text-xs text-green-700">
                          {step.duration ? formatDuration(step.duration) : 'Completed'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtopics Progress (if in subtopics phase) */}
              {progressData.phase === 'subtopics' && progressData.subtopicsProgress && progressData.subtopicsProgress.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <h4 className="font-medium text-sm">Background Subtopic Processing</h4>
                  </div>
                  
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {progressData.subtopicsProgress.map((subtopic, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {subtopic.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : subtopic.status === 'in_progress' ? (
                            <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                          ) : subtopic.status === 'error' ? (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {subtopic.title}
                          </span>
                        </div>
                        <div className="text-xs text-purple-700">
                          {subtopic.progress}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Topic Completion Status */}
              {progressData.mainTopicCompleted && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Main topic research complete! Content is ready to view.
                    </span>
                  </div>
                  {progressData.phase === 'subtopics' && (
                    <p className="text-xs text-green-700 mt-1">
                      Subtopics are being processed in the background for enhanced learning.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeProgressDisplay;