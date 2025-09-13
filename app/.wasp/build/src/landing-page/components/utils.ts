// Utility functions for landing page components
import type { InputValidation, FormError, LoadingState } from './types';

// Input validation constants
export const INPUT_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 500,
  PLACEHOLDER: 'Enter any topic you want to learn about...'
} as const;

// Validate topic input with enhanced feedback
export const validateTopicInput = (input: string): InputValidation => {
  const trimmedInput = input.trim();
  const warnings: string[] = [];
  
  if (trimmedInput.length === 0) {
    return {
      isValid: false,
      error: 'Please enter a topic to get started',
      minLength: INPUT_CONSTRAINTS.MIN_LENGTH,
      maxLength: INPUT_CONSTRAINTS.MAX_LENGTH,
      warnings
    };
  }
  
  if (trimmedInput.length < INPUT_CONSTRAINTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Topic must be at least ${INPUT_CONSTRAINTS.MIN_LENGTH} characters long`,
      minLength: INPUT_CONSTRAINTS.MIN_LENGTH,
      maxLength: INPUT_CONSTRAINTS.MAX_LENGTH,
      warnings
    };
  }
  
  if (trimmedInput.length > INPUT_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Topic must be less than ${INPUT_CONSTRAINTS.MAX_LENGTH} characters`,
      minLength: INPUT_CONSTRAINTS.MIN_LENGTH,
      maxLength: INPUT_CONSTRAINTS.MAX_LENGTH,
      warnings
    };
  }

  // Add warnings for edge cases
  if (trimmedInput.length < 10) {
    warnings.push('Consider adding more detail for better results');
  }
  
  if (trimmedInput.length > 300) {
    warnings.push('Very long topics may take longer to process');
  }

  // Check for potentially problematic content
  if (/^\d+$/.test(trimmedInput)) {
    warnings.push('Consider adding context to numbers');
  }

  if (trimmedInput.split(' ').length === 1 && trimmedInput.length > 20) {
    warnings.push('Consider breaking long single words into phrases');
  }
  
  return {
    isValid: true,
    minLength: INPUT_CONSTRAINTS.MIN_LENGTH,
    maxLength: INPUT_CONSTRAINTS.MAX_LENGTH,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

// Sanitize input for security
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, INPUT_CONSTRAINTS.MAX_LENGTH); // Ensure max length
};

// Smooth scroll utility
export const smoothScrollToSection = (sectionId: string): void => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// Keyboard shortcut detection
export const isSubmitShortcut = (event: KeyboardEvent): boolean => {
  return (event.metaKey || event.ctrlKey) && event.key === 'Enter';
};

// Responsive breakpoint utilities
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
} as const;

export const getBreakpoint = (): keyof typeof BREAKPOINTS => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

// Animation utilities
export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500
} as const;

// Focus management
export const trapFocus = (element: HTMLElement): void => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
};

// Debounce utility for input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Error classification and handling
export const classifyError = (error: any): { type: 'validation' | 'network' | 'server' | 'unknown'; message: string; retryable: boolean; details?: string } => {
  // Network errors
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      retryable: true,
      details: 'Unable to reach the server'
    };
  }

  // Timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
    return {
      type: 'network',
      message: 'Request timed out. Please try again.',
      retryable: true,
      details: 'Server took too long to respond'
    };
  }

  // Server errors (5xx)
  if (error?.status >= 500 && error?.status < 600) {
    return {
      type: 'server',
      message: 'Server error occurred. Please try again in a moment.',
      retryable: true,
      details: `Server returned ${error.status}`
    };
  }

  // Client errors (4xx)
  if (error?.status >= 400 && error?.status < 500) {
    return {
      type: 'validation',
      message: error?.message || 'Invalid request. Please check your input.',
      retryable: false,
      details: `Client error ${error.status}`
    };
  }

  // Authentication errors
  if (error?.status === 401 || error?.message?.includes('unauthorized')) {
    return {
      type: 'validation',
      message: 'Authentication required. Please log in and try again.',
      retryable: false,
      details: 'User not authenticated'
    };
  }

  // Rate limiting
  if (error?.status === 429) {
    return {
      type: 'server',
      message: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
      details: 'Rate limit exceeded'
    };
  }

  // Generic error fallback
  return {
    type: 'unknown',
    message: error?.message || 'An unexpected error occurred. Please try again.',
    retryable: true,
    details: 'Unknown error type'
  };
};

// Retry logic with exponential backoff
export const createRetryHandler = (maxRetries: number = 3) => {
  return async <T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: any) => void
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorInfo = classifyError(error);
        
        // Don't retry non-retryable errors
        if (!errorInfo.retryable || attempt === maxRetries) {
          throw error;
        }
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

// Loading state messages
export const getLoadingMessage = (stage: string, attempt?: number): string => {
  const messages = {
    validating: 'Validating your topic...',
    submitting: attempt && attempt > 1 ? `Retrying... (attempt ${attempt})` : 'Creating your learning path...',
    processing: 'Processing your request...',
    complete: 'Success! Redirecting...'
  };
  
  return messages[stage as keyof typeof messages] || 'Loading...';
};