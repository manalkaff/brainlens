import type { CheckLearningCredits, GetUserUsageStats, GetUpgradeRecommendation, ConsumeLearningCredits, GetLearningAnalytics, UpdateUserLearningQuota } from 'wasp/server/operations';
import type { User } from 'wasp/entities';
import { CreditOperation, CreditCheckResult, UsageStats } from './operations';
type CheckLearningCreditsInput = {
    operation: CreditOperation;
};
export declare const checkLearningCredits: CheckLearningCredits<CheckLearningCreditsInput, CreditCheckResult>;
type UserUsageStatsOutput = UsageStats & {
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
    [key: string]: any;
};
export declare const getUserUsageStats: GetUserUsageStats<void, UserUsageStatsOutput>;
type UpgradeRecommendationOutput = {
    shouldUpgrade: boolean;
    recommendedPlan: string;
    reason: string;
    savings?: number;
    currentUsage: {
        topicsThisMonth: number;
        chatMessagesToday: number;
        quizzesThisWeek: number;
    };
};
export declare const getUpgradeRecommendation: GetUpgradeRecommendation<void, UpgradeRecommendationOutput>;
type ConsumeLearningCreditsInput = {
    operation: CreditOperation;
    metadata?: Record<string, any>;
};
export declare const consumeLearningCredits: ConsumeLearningCredits<ConsumeLearningCreditsInput, User>;
type LearningAnalyticsOutput = {
    totalUsers: number;
    activeUsers: number;
    subscribedUsers: number;
    totalTopics: number;
    totalChatMessages: number;
    totalQuizzes: number;
    averageTopicsPerUser: number;
    averageTimeSpentPerUser: number;
    topUsers: Array<{
        id: string;
        email?: string;
        topicsCreated: number;
        totalTimeSpent: number;
        subscriptionStatus?: string;
    }>;
    usageByPlan: Array<{
        plan: string;
        userCount: number;
        averageUsage: number;
    }>;
    monthlyGrowth: {
        newUsers: number;
        newTopics: number;
        newSubscriptions: number;
    };
};
export declare const getLearningAnalytics: GetLearningAnalytics<void, LearningAnalyticsOutput>;
type UpdateUserLearningQuotaInput = {
    userId: string;
    credits?: number;
    customLimits?: {
        topicsPerMonth?: number;
        chatMessagesPerDay?: number;
        quizzesPerWeek?: number;
    };
};
export declare const updateUserLearningQuota: UpdateUserLearningQuota<UpdateUserLearningQuotaInput, User>;
export {};
//# sourceMappingURL=waspOperations.d.ts.map