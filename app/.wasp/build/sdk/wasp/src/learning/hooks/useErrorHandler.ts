/**
 * React hooks for error handling in the learning platform
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  LearningPlatformError, 
  classifyError, 
  logError,
  isLearningPlatformError,
  ErrorSeverity,
  ErrorType
} from '../errors/errorTypes';

// Error state interface
export interface ErrorState {
  error: LearningPlatformError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  retryAfter?: number;
}

// Error handler options
export interface ErrorHandlerOptions {
  maxRetries?: number;
  enableAutoRetry?: boolean;
  retryDelay?: number;
  onError?: (error: LearningPlatformError) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: LearningPlatformError) => void;
}

// Main error handler hook
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    enableAutoRetry = false,
    retryDelay = 3000,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = useCallback((error: Error | LearningPlatformError, operation?: () => Promise<any>) => {
    const learningError = isLearningPlatformError(error) ? error : classifyError(error);
    
    // Log the error
    logError(learningError, { component: 'useErrorHandler' });
    
    // Store the operation for potential retry
    if (operation) {
      lastOperationRef.current = operation;
    }

    const canRetry = learningError.recoverable && errorState.retryCount < maxRetries;
    const retryAfter = learningError.retryAfter || retryDelay;

    setErrorState({
      error: learningError,
      isRetrying: false,
      retryCount: errorState.retryCount,
      canRetry,
      retryAfter
    });

    // Call error callback
    onError?.(learningError);

    // Auto-retry if enabled and possible
    if (enableAutoRetry && canRetry && retryAfter) {
      scheduleRetry(retryAfter);
    }

    // Check if max retries reached
    if (!canRetry && errorState.retryCount >= maxRetries) {
      onMaxRetriesReached?.(learningError);
    }
  }, [errorState.retryCount, maxRetries, enableAutoRetry, retryDelay, onError, onMaxRetriesReached]);

  const scheduleRetry = useCallback((delay: number) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));

    retryTimeoutRef.current = setTimeout(() => {
      retry();
    }, delay);
  }, []);

  const retry = useCallback(async () => {
    if (!lastOperationRef.current || !errorState.canRetry) {
      return;
    }

    const newRetryCount = errorState.retryCount + 1;
    
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: newRetryCount
    }));

    onRetry?.(newRetryCount);

    try {
      await lastOperationRef.current();
      
      // Success - clear error state
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: false
      });
    } catch (error) {
      // Retry failed - handle the new error
      handleError(error as Error);
    }
  }, [errorState.canRetry, errorState.retryCount, onRetry, handleError]);

  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false
    });

    lastOperationRef.current = null;
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error as Error, operation);
      return null;
    }
  }, [handleError, clearError]);

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    canRetry: errorState.canRetry,
    retryAfter: errorState.retryAfter,
    handleError,
    retry,
    clearError,
    executeWithErrorHandling
  };
}

// Specialized hook for API operations
export function useApiErrorHandler(options: ErrorHandlerOptions = {}) {
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    enableAutoRetry: false,
    ...options
  });

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    operationName?: string
  ): Promise<{ data: T | null; error: LearningPlatformError | null }> => {
    try {
      errorHandler.clearError();
      const data = await apiCall();
      return { data, error: null };
    } catch (error) {
      const learningError = isLearningPlatformError(error) ? error : classifyError(error as Error);
      errorHandler.handleError(learningError, apiCall);
      return { data: null, error: learningError };
    }
  }, [errorHandler]);

  return {
    ...errorHandler,
    executeApiCall
  };
}

// Hook for form validation errors
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, LearningPlatformError>>({});
  const [generalError, setGeneralError] = useState<LearningPlatformError | null>(null);

  const setFieldError = useCallback((field: string, error: LearningPlatformError) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFormError = useCallback((error: LearningPlatformError) => {
    setGeneralError(error);
  }, []);

  const clearFormError = useCallback(() => {
    setGeneralError(null);
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  const hasErrors = Object.keys(fieldErrors).length > 0 || generalError !== null;

  return {
    fieldErrors,
    generalError,
    hasErrors,
    setFieldError,
    clearFieldError,
    setFormError,
    clearFormError,
    clearAllErrors
  };
}

// Hook for streaming operations with error handling
export function useStreamingErrorHandler(options: ErrorHandlerOptions = {}) {
  const errorHandler = useErrorHandler(options);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<LearningPlatformError | null>(null);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamError(null);
    errorHandler.clearError();
  }, [errorHandler]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const handleStreamError = useCallback((error: Error | LearningPlatformError) => {
    const learningError = isLearningPlatformError(error) ? error : classifyError(error);
    setStreamError(learningError);
    setIsStreaming(false);
    errorHandler.handleError(learningError);
  }, [errorHandler]);

  const clearStreamError = useCallback(() => {
    setStreamError(null);
    errorHandler.clearError();
  }, [errorHandler]);

  return {
    ...errorHandler,
    isStreaming,
    streamError,
    startStreaming,
    stopStreaming,
    handleStreamError,
    clearStreamError
  };
}

// Hook for network-specific error handling
export function useNetworkErrorHandler() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState<LearningPlatformError | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError(classifyError(new Error('Network connection lost')));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkNetworkAndExecute = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!isOnline) {
      setNetworkError(classifyError(new Error('No network connection')));
      return null;
    }

    try {
      return await operation();
    } catch (error) {
      const learningError = classifyError(error as Error);
      if (learningError.type === ErrorType.NETWORK_ERROR) {
        setNetworkError(learningError);
      }
      throw error;
    }
  }, [isOnline]);

  return {
    isOnline,
    networkError,
    checkNetworkAndExecute
  };
}

// Hook for error recovery strategies
export function useErrorRecovery() {
  const [recoveryStrategies, setRecoveryStrategies] = useState<Map<string, () => Promise<void>>>(new Map());

  const registerRecoveryStrategy = useCallback((errorType: string, strategy: () => Promise<void>) => {
    setRecoveryStrategies(prev => new Map(prev).set(errorType, strategy));
  }, []);

  const executeRecovery = useCallback(async (error: LearningPlatformError): Promise<boolean> => {
    const strategy = recoveryStrategies.get(error.type);
    if (strategy) {
      try {
        await strategy();
        return true;
      } catch (recoveryError) {
        console.error('Recovery strategy failed:', recoveryError);
        return false;
      }
    }
    return false;
  }, [recoveryStrategies]);

  return {
    registerRecoveryStrategy,
    executeRecovery
  };
}