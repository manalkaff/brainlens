import React from 'react';
import { AlertTriangle, RefreshCw, X, Wifi, Lock, Search, Server } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import type { TopicError } from '../../hooks/useTopicErrorHandler';

interface ErrorDisplayProps {
  error: TopicError;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
}

const getErrorIcon = (error: TopicError) => {
  if (error.message.includes('network') || error.message.includes('connection')) {
    return <Wifi className="w-4 h-4" />;
  }
  if (error.message.includes('permission') || error.message.includes('unauthorized')) {
    return <Lock className="w-4 h-4" />;
  }
  if (error.message.includes('not found')) {
    return <Search className="w-4 h-4" />;
  }
  if (error.message.includes('server') || error.message.includes('internal')) {
    return <Server className="w-4 h-4" />;
  }
  return <AlertTriangle className="w-4 h-4" />;
};

const getErrorVariant = (error: TopicError): 'default' | 'destructive' => {
  if (error.type === 'api' || error.type === 'content_generation') {
    return 'destructive';
  }
  return 'default';
};

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  isRetrying = false,
  compact = false 
}: ErrorDisplayProps) {
  const icon = getErrorIcon(error);
  const variant = getErrorVariant(error);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm">
        {icon}
        <span className="flex-1 text-red-800">{error.message}</span>
        {error.retryable && onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-6 px-2 text-xs"
          >
            {isRetrying ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              'Retry'
            )}
          </Button>
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant={variant} className="mb-4">
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <AlertDescription className="mb-3">
            {error.message}
            {error.retryCount && error.retryCount > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                (Attempt {error.retryCount + 1})
              </span>
            )}
          </AlertDescription>
          
          <div className="flex items-center gap-2">
            {error.retryable && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
          
          {error.timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {error.timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
}

export function ErrorBoundaryFallback({ 
  error, 
  onRetry, 
  title = "Something went wrong" 
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function InlineError({ message, onRetry, isRetrying = false }: InlineErrorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          disabled={isRetrying}
          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          {isRetrying ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            'Retry'
          )}
        </Button>
      )}
    </div>
  );
}