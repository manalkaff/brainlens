import type { User } from 'wasp/entities';
import { PaymentPlanId } from '../../payment/plans';
export declare const CREDIT_COSTS: {
    readonly TOPIC_RESEARCH: 2;
    readonly AI_CHAT_MESSAGE: 1;
    readonly QUIZ_GENERATION: 1;
    readonly CONTENT_GENERATION: 1;
    readonly VECTOR_SEARCH: 0;
};
export declare const FREE_TIER_LIMITS: {
    readonly TOPICS_PER_MONTH: 3;
    readonly CHAT_MESSAGES_PER_DAY: 10;
    readonly QUIZZES_PER_WEEK: 2;
    readonly TOTAL_CREDITS_PER_MONTH: 10;
};
export declare const PREMIUM_TIER_LIMITS: {
    readonly TOPICS_PER_MONTH: 50;
    readonly CHAT_MESSAGES_PER_DAY: 200;
    readonly QUIZZES_PER_WEEK: 50;
    readonly TOTAL_CREDITS_PER_MONTH: 500;
};
export type CreditOperation = keyof typeof CREDIT_COSTS;
export interface CreditCheckResult {
    hasCredits: boolean;
    currentCredits: number;
    requiredCredits: number;
    isSubscribed: boolean;
    subscriptionPlan?: string;
    upgradeRequired: boolean;
    limitType?: 'credits' | 'feature_limit';
    resetDate?: Date;
    [key: string]: any;
}
export interface UsageStats {
    topicsThisMonth: number;
    chatMessagesToday: number;
    quizzesThisWeek: number;
    creditsUsedThisMonth: number;
    lastResetDate: Date;
    [key: string]: any;
}
/**
 * Check if user has sufficient credits and permissions for an operation
 */
export declare function checkUserCredits(userId: string, operation: CreditOperation, context: {
    entities: {
        User: any;
        Topic?: any;
        Message?: any;
        Quiz?: any;
    };
}): Promise<CreditCheckResult>;
/**
 * Consume credits for an operation
 */
export declare function consumeCredits(userId: string, operation: CreditOperation, context: {
    entities: {
        User: any;
        Topic?: any;
        Message?: any;
        Quiz?: any;
    };
}, metadata?: Record<string, any>): Promise<User>;
/**
 * Check if user has admin privileges for learning platform management
 */
export declare function checkLearningAdminAccess(user: User): boolean;
/**
 * Get upgrade recommendation based on user's usage patterns
 */
export declare function getUpgradeRecommendation(userId: string, context: {
    entities: {
        User: any;
        Topic?: any;
        Message?: any;
        Quiz?: any;
    };
}): Promise<{
    shouldUpgrade: boolean;
    recommendedPlan: PaymentPlanId;
    reason: string;
    savings?: number;
}>;
//# sourceMappingURL=operations.d.ts.map