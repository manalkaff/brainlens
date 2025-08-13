import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StreamingResearchUpdate, 
  ResearchStatus, 
  ResearchProgressUpdate, 
  ResearchContentUpdate, 
  ResearchErrorUpdate, 
  ResearchCompleteUpdate,
  UseResearchStreamingOptions,
  ResearchStreamingState,
  StreamingUtils
} from '../research/streaming';

const DEFAULT_OPTIONS: Partial<UseResearchStreamingOptions> = {
  autoReconnect: true,
  reconnectDelay: 3000,
};

export function useResearchStreaming(options: UseResearchStreamingOptions) {
  const {
    topicId,
    onStatusUpdate,
    onProgressUpdate,
    onContentUpdate,
    onError,
    onComplete,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<ResearchStreamingState>({
    isConnected: false,
    isReconnecting: false,
    lastUpdate: null,
    connectionError: null,
    currentStatus: null,
    progress: null,
    latestContent: [],
    errors: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to the streaming endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState(prev => ({
      ...prev,
      isReconnecting: reconnectAttemptsRef.current > 0,
      connectionError: null,
    }));

    try {
      const eventSource = new EventSource(
        `/api/research/stream?topicId=${encodeURIComponent(topicId)}`
      );

      eventSource.onopen = () => {
        console.log('Research stream connected for topic:', topicId);
        reconnectAttemptsRef.current = 0;
        setState(prev => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          connectionError: null,
        }));
      };

      eventSource.onmessage = (event) => {
        try {
          const update: StreamingResearchUpdate = JSON.parse(event.data);
          
          if (!StreamingUtils.isValidUpdate(update)) {
            console.warn('Invalid streaming update received:', update);
            return;
          }

          // Update last update timestamp
          setState(prev => ({
            ...prev,
            lastUpdate: new Date(update.timestamp),
          }));

          // Handle different update types
          switch (update.type) {
            case 'status':
              const statusData = update.data as ResearchStatus;
              setState(prev => ({
                ...prev,
                currentStatus: statusData,
              }));
              onStatusUpdate?.(statusData);
              break;

            case 'progress':
              const progressData = update.data as ResearchProgressUpdate['data'];
              setState(prev => ({
                ...prev,
                progress: progressData,
              }));
              onProgressUpdate?.(progressData);
              break;

            case 'content':
              const contentData = update.data as ResearchContentUpdate['data'];
              setState(prev => ({
                ...prev,
                latestContent: [...(prev.latestContent || []), contentData],
              }));
              onContentUpdate?.(contentData);
              break;

            case 'error':
              const errorData = update.data as ResearchErrorUpdate['data'];
              setState(prev => ({
                ...prev,
                errors: [...prev.errors, errorData],
              }));
              onError?.(errorData);
              break;

            case 'complete':
              const completeData = update.data as ResearchCompleteUpdate['data'];
              setState(prev => ({
                ...prev,
                currentStatus: prev.currentStatus ? {
                  ...prev.currentStatus,
                  status: 'completed',
                  progress: 100,
                } : null,
              }));
              onComplete?.(completeData);
              break;

            case 'heartbeat':
              // Just update last update time for heartbeats
              break;

            default:
              console.warn('Unknown update type:', update.type);
          }

        } catch (error) {
          console.error('Error parsing streaming update:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Research stream error:', error);
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionError: 'Connection error occurred',
        }));

        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, reconnectDelay);
        } else {
          setState(prev => ({
            ...prev,
            connectionError: 'Max reconnection attempts reached',
          }));
        }
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionError: 'Failed to establish connection',
      }));
    }
  }, [topicId, autoReconnect, reconnectDelay, onStatusUpdate, onProgressUpdate, onContentUpdate, onError, onComplete]);

  // Disconnect from the stream
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isReconnecting: false,
    }));
  }, []);

  // Manually trigger reconnection
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
    }));
  }, []);

  // Clear content history
  const clearContent = useCallback(() => {
    setState(prev => ({
      ...prev,
      latestContent: [],
    }));
  }, []);

  // Get formatted status message
  const getStatusMessage = useCallback(() => {
    if (!state.currentStatus) return 'No status available';
    
    const { status, progress, currentDepth, activeAgents } = state.currentStatus;
    
    switch (status) {
      case 'initializing':
        return 'Initializing research...';
      case 'researching':
        return `Researching (${progress}%) - Active: ${activeAgents.join(', ')}`;
      case 'aggregating':
        return `Aggregating results (${progress}%)`;
      case 'completed':
        return 'Research completed successfully';
      case 'error':
        return 'Research encountered an error';
      default:
        return `Status: ${status}`;
    }
  }, [state.currentStatus]);

  // Get estimated completion time
  const getEstimatedCompletion = useCallback(() => {
    if (!state.currentStatus || !state.progress) return null;
    
    return StreamingUtils.calculateEstimatedCompletion(
      state.currentStatus.startTime,
      state.progress.progress
    );
  }, [state.currentStatus, state.progress]);

  // Connect on mount and when topicId changes
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    isConnected: state.isConnected,
    isReconnecting: state.isReconnecting,
    connectionError: state.connectionError,
    lastUpdate: state.lastUpdate,

    // Research state
    currentStatus: state.currentStatus,
    progress: state.progress,
    latestContent: state.latestContent,
    errors: state.errors,

    // Computed values
    statusMessage: getStatusMessage(),
    estimatedCompletion: getEstimatedCompletion(),
    hasErrors: state.errors.length > 0,
    isResearching: state.currentStatus?.status === 'researching',
    isComplete: state.currentStatus?.status === 'completed',

    // Actions
    connect,
    disconnect,
    reconnect,
    clearErrors,
    clearContent,
  };
}

// Hook for managing multiple research streams
export function useMultipleResearchStreams(topicIds: string[]) {
  const [streams, setStreams] = useState<Map<string, ReturnType<typeof useResearchStreaming>>>(new Map());

  const addStream = useCallback((topicId: string, options: Omit<UseResearchStreamingOptions, 'topicId'>) => {
    // This would need to be implemented differently since hooks can't be called conditionally
    // For now, this is a placeholder for the concept
    console.log('Adding stream for topic:', topicId);
  }, []);

  const removeStream = useCallback((topicId: string) => {
    setStreams(prev => {
      const newStreams = new Map(prev);
      const stream = newStreams.get(topicId);
      if (stream) {
        stream.disconnect();
        newStreams.delete(topicId);
      }
      return newStreams;
    });
  }, []);

  const getStreamStatus = useCallback((topicId: string) => {
    return streams.get(topicId);
  }, [streams]);

  return {
    streams,
    addStream,
    removeStream,
    getStreamStatus,
    activeStreamCount: streams.size,
  };
}