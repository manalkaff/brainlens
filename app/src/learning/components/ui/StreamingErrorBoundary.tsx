import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { AlertTriangle, RefreshCw, Bug, Wifi, WifiOff } from 'lucide-react';

interface StreamingErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  onReset?: () => void;
  showDetails?: boolean;
  className?: string;
}

interface StreamingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
  isRetrying: boolean;
}

// Error types for better error handling
export enum StreamingErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StreamingError extends Error {
  type: StreamingErrorType;
  recoverable: boolean;
  retryAfter?: number;
  details?: any;
}

// Utility function to classify errors
export const classifyStreamingError = (error: Error): StreamingError => {
  const streamingError = error as StreamingError;
  
  // If already classified, return as is
  if (streamingError.type) {
    return streamingError;
  }

  // Classify based on error message and properties
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      ...error,
      type: StreamingErrorType.CONNECTION_ERROR,
      recoverable: true,
      retryAfter: 3000
    } as StreamingError;
  }

  if (error.message.includes('timeout')) {
    return {
      ...error,
      type: StreamingErrorType.TIMEOUT_ERROR,
      recoverable: true,
      retryAfter: 5000
    } as StreamingError;
  }

  if (error.message.includes('401') || error.message.includes('unauthorized')) {
    return {
      ...error,
      type: StreamingErrorType.AUTHENTICATION_ERROR,
      recoverable: false
    } as StreamingError;
  }

  if (error.message.includes('429') || error.message.includes('rate limit')) {
    return {
      ...error,
      type: StreamingErrorType.RATE_LIMIT_ERROR,
      recoverable: true,
      retryAfter: 60000 // 1 minute
    } as StreamingError;
  }

  if (error.message.includes('5') && error.message.includes('server')) {
    return {
      ...error,
      type: StreamingErrorType.SERVER_ERROR,
      recoverable: true,
      retryAfter: 10000
    } as StreamingError;
  }

  if (error.message.includes('parse') || error.message.includes('JSON')) {
    return {
      ...error,
      type: StreamingErrorType.PARSING_ERROR,
      recoverable: false
    } as StreamingError;
  }

  return {
    ...error,
    type: StreamingErrorType.UNKNOWN_ERROR,
    recoverable: true,
    retryAfter: 5000
  } as StreamingError;
};

class StreamingErrorBoundary extends Component<StreamingErrorBoundaryProps, StreamingErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: StreamingErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<StreamingErrorBoundaryState> {
    return {
      hasError: true,
      error: classifyStreamingError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Streaming Error Boundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { error, retryCount } = this.state;
    const streamingError = error as StreamingError;
    
    if (!streamingError?.recoverable || retryCount >= 3) {
      return;
    }

    this.setState({ isRetrying: true });

    const retryDelay = streamingError.retryAfter || 3000;
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false
      });
      
      this.props.onRetry?.();
    }, retryDelay);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
    
    this.props.onReset?.();
  };

  getErrorIcon = (errorType: StreamingErrorType) => {
    switch (errorType) {
      case StreamingErrorType.CONNECTION_ERROR:
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case StreamingErrorType.TIMEOUT_ERROR:
        return <Wifi className="w-5 h-5 text-yellow-500" />;
      case StreamingErrorType.AUTHENTICATION_ERROR:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case StreamingErrorType.RATE_LIMIT_ERROR:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case StreamingErrorType.SERVER_ERROR:
        return <Bug className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  getErrorMessage = (error: StreamingError) => {
    switch (error.type) {
      case StreamingErrorType.CONNECTION_ERROR:
        return 'Connection lost. Please check your internet connection and try again.';
      case StreamingErrorType.TIMEOUT_ERROR:
        return 'Request timed out. The server is taking too long to respond.';
      case StreamingErrorType.AUTHENTICATION_ERROR:
        return 'Authentication failed. Please log in again.';
      case StreamingErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment before trying again.';
      case StreamingErrorType.SERVER_ERROR:
        return 'Server error occurred. Our team has been notified.';
      case StreamingErrorType.PARSING_ERROR:
        return 'Data parsing error. The response format was unexpected.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  getErrorSuggestions = (error: StreamingError) => {
    switch (error.type) {
      case StreamingErrorType.CONNECTION_ERROR:
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if active'
        ];
      case StreamingErrorType.TIMEOUT_ERROR:
        return [
          'Try again in a few moments',
          'Check server status',
          'Reduce request complexity'
        ];
      case StreamingErrorType.AUTHENTICATION_ERROR:
        return [
          'Log out and log back in',
          'Clear browser cache',
          'Check account status'
        ];
      case StreamingErrorType.RATE_LIMIT_ERROR:
        return [
          'Wait before making more requests',
          'Upgrade your plan for higher limits',
          'Reduce request frequency'
        ];
      default:
        return [
          'Try refreshing the page',
          'Contact support if problem persists',
          'Check browser console for details'
        ];
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;
    const { children, fallback, showDetails = false, className = '' } = this.props;

    if (hasError && error) {
      const streamingError = error as StreamingError;
      
      if (fallback) {
        return fallback;
      }

      return (
        <Card className={`border-red-200 bg-red-50 ${className}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {this.getErrorIcon(streamingError.type)}
              <CardTitle className="text-red-800">
                Streaming Error
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {this.getErrorMessage(streamingError)}
              </AlertDescription>
            </Alert>

            {/* Error suggestions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Suggestions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {this.getErrorSuggestions(streamingError).map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {streamingError.recoverable && retryCount < 3 && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  variant="outline"
                  size="sm"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry ({3 - retryCount} attempts left)
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
              >
                Reset
              </Button>
            </div>

            {/* Error details (for development) */}
            {showDetails && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                  <div><strong>Error Type:</strong> {streamingError.type}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  <div><strong>Recoverable:</strong> {streamingError.recoverable ? 'Yes' : 'No'}</div>
                  {streamingError.retryAfter && (
                    <div><strong>Retry After:</strong> {streamingError.retryAfter}ms</div>
                  )}
                  {errorInfo && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

export default StreamingErrorBoundary;