import { useState, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import { checkLearningCredits, consumeLearningCredits, getUserUsageStats } from 'wasp/client/operations';
/**
 * Hook to check if user has sufficient credits for an operation
 */
export function useCreditCheck({ operation, enabled = true, onInsufficientCredits, onSuccess, onError }) {
    const [isChecking, setIsChecking] = useState(false);
    const { data: creditCheck, isLoading, error, refetch } = useQuery(checkLearningCredits, { operation }, {
        enabled,
        onSuccess: (data) => {
            if (!data.hasCredits && onInsufficientCredits) {
                onInsufficientCredits(data);
            }
            else if (data.hasCredits && onSuccess) {
                onSuccess();
            }
        },
        onError: (err) => {
            if (onError) {
                onError(err);
            }
        }
    });
    const checkCredits = useCallback(async () => {
        setIsChecking(true);
        try {
            const result = await refetch();
            return result.data || null;
        }
        catch (err) {
            if (onError) {
                onError(err);
            }
            return null;
        }
        finally {
            setIsChecking(false);
        }
    }, [refetch, onError]);
    return {
        creditCheck,
        isLoading: isLoading || isChecking,
        error,
        checkCredits,
        refetch
    };
}
/**
 * Hook to consume credits for an operation
 */
export function useConsumeCredits() {
    const [isConsuming, setIsConsuming] = useState(false);
    const consumeCredits = useCallback(async (operation, metadata) => {
        setIsConsuming(true);
        try {
            const result = await consumeLearningCredits({
                operation,
                metadata
            });
            return result;
        }
        catch (error) {
            throw error;
        }
        finally {
            setIsConsuming(false);
        }
    }, []);
    return {
        consumeCredits,
        isConsuming
    };
}
/**
 * Combined hook for checking and consuming credits
 */
export function useCredits(operation) {
    const [lastCheck, setLastCheck] = useState(null);
    const [error, setError] = useState(null);
    const { creditCheck, isLoading: isCheckingCredits, checkCredits } = useCreditCheck({
        operation,
        enabled: false, // Manual checking
        onInsufficientCredits: (result) => {
            setLastCheck(result);
        },
        onError: (err) => {
            setError(err);
        }
    });
    const { consumeCredits, isConsuming } = useConsumeCredits();
    const { data: usageStats, refetch: refetchUsage } = useQuery(getUserUsageStats);
    const checkAndConsumeCredits = useCallback(async (metadata) => {
        try {
            setError(null);
            // First check if user has credits
            const checkResult = await checkCredits();
            if (!checkResult) {
                throw new Error('Failed to check credits');
            }
            if (!checkResult.hasCredits) {
                setLastCheck(checkResult);
                return {
                    success: false,
                    error: new Error(checkResult.limitType === 'feature_limit'
                        ? 'Feature limit reached'
                        : 'Insufficient credits')
                };
            }
            // If check passes, consume credits
            const result = await consumeCredits(operation, metadata);
            // Refresh usage stats after consumption
            await refetchUsage();
            return { success: true, result };
        }
        catch (err) {
            const error = err;
            setError(error);
            return { success: false, error };
        }
    }, [checkCredits, consumeCredits, operation, refetchUsage]);
    const canPerformOperation = creditCheck?.hasCredits ?? false;
    const isLoading = isCheckingCredits || isConsuming;
    return {
        // Credit status
        canPerformOperation,
        creditCheck: creditCheck || lastCheck,
        usageStats,
        // Loading states
        isLoading,
        isCheckingCredits,
        isConsuming,
        // Actions
        checkCredits,
        consumeCredits,
        checkAndConsumeCredits,
        // Error handling
        error,
        clearError: () => setError(null)
    };
}
/**
 * Hook to get user's current usage statistics
 */
export function useUsageStats() {
    const { data: usageStats, isLoading, error, refetch } = useQuery(getUserUsageStats);
    const getUsagePercentage = useCallback((type) => {
        if (!usageStats)
            return 0;
        switch (type) {
            case 'topics':
                return (usageStats.topicsThisMonth / usageStats.limits.topicsPerMonth) * 100;
            case 'chat':
                return (usageStats.chatMessagesToday / usageStats.limits.chatMessagesPerDay) * 100;
            case 'quizzes':
                return (usageStats.quizzesThisWeek / usageStats.limits.quizzesPerWeek) * 100;
            default:
                return 0;
        }
    }, [usageStats]);
    const isNearLimit = useCallback((type, threshold = 80) => {
        return getUsagePercentage(type) >= threshold;
    }, [getUsagePercentage]);
    const getRemainingUsage = useCallback((type) => {
        if (!usageStats)
            return 0;
        switch (type) {
            case 'topics':
                return Math.max(0, usageStats.limits.topicsPerMonth - usageStats.topicsThisMonth);
            case 'chat':
                return Math.max(0, usageStats.limits.chatMessagesPerDay - usageStats.chatMessagesToday);
            case 'quizzes':
                return Math.max(0, usageStats.limits.quizzesPerWeek - usageStats.quizzesThisWeek);
            default:
                return 0;
        }
    }, [usageStats]);
    return {
        usageStats,
        isLoading,
        error,
        refetch,
        getUsagePercentage,
        isNearLimit,
        getRemainingUsage
    };
}
//# sourceMappingURL=useCredits.js.map