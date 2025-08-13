import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Layers,
  Activity,
  Pause,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import { useResearchStreaming } from '../../hooks/useResearchStreaming';
import { ResearchStatus, StreamingUtils } from '../../research/streaming';

interface ResearchStatusDisplayProps {
  topicId: string;
  topicTitle: string;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  className?: string;
  showDetailedProgress?: boolean;
  showAgentStatus?: boolean;
  showEstimatedTime?: boolean;
}

interface AgentStatusProps {
  agents: string[];
  activeAgents: string[];
  completedAgents: number;
  totalAgents: number;
}

// Agent status component
const AgentStatus: React.FC<AgentStatusProps> = ({
  agents,
  activeAgents,
  completedAgents,
  totalAgents,
}) => {
  const getAgentStatus = (agent: string) => {
    if (activeAgents.includes(agent)) return 'active';
    // Assume completed if not active and we have completed some agents
    const agentIndex = agents.indexOf(agent);
    return agentIndex < completedAgents ? 'completed' : 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Research Agents</h4>
        <span className="text-xs text-gray-500">
          {completedAgents}/{totalAgents} completed
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {agents.map((agent) => {
          const status = getAgentStatus(agent);
          return (
            <div
              key={agent}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(status)}`}
            >
              {getStatusIcon(status)}
              <span className="text-sm font-medium capitalize">{agent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main research status display component
export const ResearchStatusDisplay: React.FC<ResearchStatusDisplayProps> = ({
  topicId,
  topicTitle,
  onCancel,
  onPause,
  onResume,
  onRetry,
  className = '',
  showDetailedProgress = true,
  showAgentStatus = true,
  showEstimatedTime = true,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  
  const {
    isConnected,
    isReconnecting,
    connectionError,
    currentStatus,
    progress,
    errors,
    statusMessage,
    estimatedCompletion,
    isResearching,
    isComplete,
    hasErrors,
    reconnect,
    clearErrors,
  } = useResearchStreaming({
    topicId,
    onStatusUpdate: (status) => {
      console.log('Status update:', status);
    },
    onProgressUpdate: (progressData) => {
      console.log('Progress update:', progressData);
    },
    onError: (error) => {
      console.error('Research error:', error);
    },
    onComplete: (result) => {
      console.log('Research complete:', result);
    },
  });

  const handlePause = () => {
    setIsPaused(true);
    onPause?.();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume?.();
  };

  const getStatusIcon = () => {
    if (connectionError || hasErrors) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (isComplete) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (isResearching && !isPaused) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (isPaused) {
      return <Pause className="w-5 h-5 text-yellow-500" />;
    }
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (connectionError || hasErrors) return 'border-red-200 bg-red-50';
    if (isComplete) return 'border-green-200 bg-green-50';
    if (isResearching) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const duration = now.getTime() - startTime.getTime();
    return StreamingUtils.formatDuration(duration);
  };

  return (
    <Card className={`${className} ${getStatusColor()} transition-all duration-300`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg font-semibold">
                Researching: {topicTitle}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {statusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
            </Badge>

            {/* Control buttons */}
            {isResearching && (
              <div className="flex items-center gap-1">
                {!isPaused ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePause}
                    className="h-8 w-8 p-0"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResume}
                    className="h-8 w-8 p-0"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                
                {onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 w-8 p-0"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {(connectionError || hasErrors) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={connectionError ? reconnect : onRetry}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection error */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connection error: {connectionError}
              <Button
                variant="link"
                className="p-0 h-auto ml-2 text-red-600"
                onClick={reconnect}
              >
                Reconnect
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Research errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Research errors occurred:
              <ul className="mt-2 space-y-1">
                {errors.slice(-3).map((error, index) => (
                  <li key={index} className="text-sm">
                    • {error.error}
                  </li>
                ))}
              </ul>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-red-600"
                onClick={clearErrors}
              >
                Clear errors
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Overall progress */}
        {showDetailedProgress && currentStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{currentStatus.progress}%</span>
            </div>
            <Progress value={currentStatus.progress} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                <span>Depth: {currentStatus.currentDepth + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{currentStatus.completedAgents}/{currentStatus.totalAgents} agents</span>
              </div>
              {currentStatus.startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Duration: {formatDuration(currentStatus.startTime)}</span>
                </div>
              )}
              {showEstimatedTime && estimatedCompletion && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>ETA: {estimatedCompletion.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent status */}
        {showAgentStatus && currentStatus && (
          <AgentStatus
            agents={['general', 'academic', 'computational', 'video', 'community']}
            activeAgents={currentStatus.activeAgents}
            completedAgents={currentStatus.completedAgents}
            totalAgents={currentStatus.totalAgents}
          />
        )}

        {/* Completion message */}
        {isComplete && (
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Research completed successfully!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Topic research and content generation finished.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResearchStatusDisplay;