import type { CreditOperation } from '../subscription/operations';
export interface CreditCheckResult {
    hasCredits: boolean;
    currentCredits: number;
    requiredCredits: number;
    isSubscribed: boolean;
    subscriptionPlan?: string;
    upgradeRequired: boolean;
    limitType?: 'credits' | 'feature_limit';
    resetDate?: Date;
}
export interface UseCreditCheckOptions {
    operation: CreditOperation;
    enabled?: boolean;
    onInsufficientCredits?: (result: CreditCheckResult) => void;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}
/**
 * Hook to check if user has sufficient credits for an operation
 */
export declare function useCreditCheck({ operation, enabled, onInsufficientCredits, onSuccess, onError }: UseCreditCheckOptions): {
    creditCheck: import("../subscription/operations").CreditCheckResult | undefined;
    isLoading: boolean;
    error: Error | null;
    checkCredits: () => Promise<CreditCheckResult | null>;
    refetch: <TPageData>(options?: (import("@tanstack/query-core").RefetchOptions & import("@tanstack/query-core").RefetchQueryFilters<TPageData>) | undefined) => Promise<import("@tanstack/query-core").QueryObserverResult<import("../subscription/operations").CreditCheckResult, Error>>;
};
/**
 * Hook to consume credits for an operation
 */
export declare function useConsumeCredits(): {
    consumeCredits: (operation: CreditOperation, metadata?: Record<string, any>) => Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        username: string | null;
        isAdmin: boolean;
        paymentProcessorUserId: string | null;
        lemonSqueezyCustomerPortalUrl: string | null;
        subscriptionStatus: string | null;
        subscriptionPlan: string | null;
        datePaid: Date | null;
        credits: number;
    }>;
    isConsuming: boolean;
};
/**
 * Combined hook for checking and consuming credits
 */
export declare function useCredits(operation: CreditOperation): {
    canPerformOperation: boolean;
    creditCheck: CreditCheckResult | null;
    usageStats: (import("../subscription/operations").UsageStats & {
        [key: string]: any;
        limits: {
            topicsPerMonth: number;
            chatMessagesPerDay: number;
            quizzesPerWeek: number;
            totalCreditsPerMonth: number;
        };
        subscriptionInfo: {
            isSubscribed: boolean;
            plan?: string;
            status?: string;
        };
    }) | undefined;
    isLoading: boolean;
    isCheckingCredits: boolean;
    isConsuming: boolean;
    checkCredits: () => Promise<CreditCheckResult | null>;
    consumeCredits: (operation: CreditOperation, metadata?: Record<string, any>) => Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        username: string | null;
        isAdmin: boolean;
        paymentProcessorUserId: string | null;
        lemonSqueezyCustomerPortalUrl: string | null;
        subscriptionStatus: string | null;
        subscriptionPlan: string | null;
        datePaid: Date | null;
        credits: number;
    }>;
    checkAndConsumeCredits: (metadata?: Record<string, any>) => Promise<{
        success: boolean;
        result?: any;
        error?: Error;
    }>;
    error: Error | null;
    clearError: () => void;
};
/**
 * Hook to get user's current usage statistics
 */
export declare function useUsageStats(): {
    usageStats: (import("../subscription/operations").UsageStats & {
        [key: string]: any;
        limits: {
            topicsPerMonth: number;
            chatMessagesPerDay: number;
            quizzesPerWeek: number;
            totalCreditsPerMonth: number;
        };
        subscriptionInfo: {
            isSubscribed: boolean;
            plan?: string;
            status?: string;
        };
    }) | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: <TPageData>(options?: (import("@tanstack/query-core").RefetchOptions & import("@tanstack/query-core").RefetchQueryFilters<TPageData>) | undefined) => Promise<import("@tanstack/query-core").QueryObserverResult<import("../subscription/operations").UsageStats & {
        [key: string]: any;
        limits: {
            topicsPerMonth: number;
            chatMessagesPerDay: number;
            quizzesPerWeek: number;
            totalCreditsPerMonth: number;
        };
        subscriptionInfo: {
            isSubscribed: boolean;
            plan?: string;
            status?: string;
        };
    }, Error>>;
    getUsagePercentage: (type: "topics" | "chat" | "quizzes") => number;
    isNearLimit: (type: "topics" | "chat" | "quizzes", threshold?: number) => boolean;
    getRemainingUsage: (type: "topics" | "chat" | "quizzes") => number;
};
//# sourceMappingURL=useCredits.d.ts.map