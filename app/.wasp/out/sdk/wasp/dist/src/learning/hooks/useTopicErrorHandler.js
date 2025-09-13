import { useState, useCallback } from 'react';
const isRetryableError = (error) => {
    // Network errors, timeouts, and 5xx server errors are retryable
    const retryablePatterns = [
        /network/i,
        /timeout/i,
        /fetch/i,
        /5\d\d/,
        /rate limit/i,
        /temporarily unavailable/i
    ];
    return retryablePatterns.some(pattern => pattern.test(error.message) || pattern.test(error.name));
};
const getErrorMessage = (error, type) => {
    const baseMessages = {
        selection: 'Failed to select topic',
        content_generation: 'Failed to generate content',
        navigation: 'Navigation error occurred',
        api: 'API request failed'
    };
    // Check for specific error types
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return 'You need to be logged in to perform this action';
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
        return 'You don\'t have permission to access this content';
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
        return 'The requested content could not be found';
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
        return 'Too many requests. Please wait a moment and try again';
    }
    if (error.message.includes('500') || error.message.includes('internal server')) {
        return 'Server error occurred. Please try again later';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network connection error. Please check your internet connection';
    }
    // Return the original error message if it's user-friendly, otherwise use base message
    if (error.message && error.message.length < 100 && !error.message.includes('Error:')) {
        return error.message;
    }
    return baseMessages[type];
};
export function useTopicErrorHandler() {
    const [errors, setErrors] = useState([]);
    const hasError = useCallback((topicId) => {
        if (topicId) {
            return errors.some(error => error.topicId === topicId);
        }
        return errors.length > 0;
    }, [errors]);
    const getError = useCallback((topicId) => {
        if (topicId) {
            return errors.find(error => error.topicId === topicId) || null;
        }
        return errors[0] || null;
    }, [errors]);
    const clearError = useCallback((topicId) => {
        setErrors(prev => {
            if (topicId) {
                return prev.filter(error => error.topicId !== topicId);
            }
            return [];
        });
    }, []);
    const clearAllErrors = useCallback(() => {
        setErrors([]);
    }, []);
    const handleError = useCallback((error, context) => {
        const topicError = {
            type: context.type,
            message: getErrorMessage(error, context.type),
            topicId: context.topicId,
            retryable: isRetryableError(error),
            timestamp: new Date(),
            retryCount: 0
        };
        setErrors(prev => {
            // Remove any existing error for this topic/type combination
            const filtered = prev.filter(e => !(e.topicId === context.topicId && e.type === context.type));
            return [...filtered, topicError];
        });
        // Log error for debugging
        console.error(`Topic ${context.type} error:`, {
            error,
            context,
            timestamp: topicError.timestamp
        });
    }, []);
    const retryOperation = useCallback(async (topicId, operation) => {
        const existingError = getError(topicId);
        const retryCount = (existingError?.retryCount || 0) + 1;
        try {
            clearError(topicId);
            await operation();
        }
        catch (error) {
            const updatedError = {
                type: existingError?.type || 'api',
                message: getErrorMessage(error, existingError?.type || 'api'),
                topicId,
                retryable: isRetryableError(error),
                timestamp: new Date(),
                retryCount
            };
            setErrors(prev => {
                const filtered = prev.filter(e => e.topicId !== topicId);
                return [...filtered, updatedError];
            });
            throw error;
        }
    }, [getError, clearError]);
    return {
        errors,
        hasError,
        getError,
        clearError,
        clearAllErrors,
        handleError,
        retryOperation
    };
}
//# sourceMappingURL=useTopicErrorHandler.js.map