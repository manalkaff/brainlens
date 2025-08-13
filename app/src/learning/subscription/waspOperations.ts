import { HttpError } from 'wasp/server';
import type { 
  CheckLearningCredits,
  GetUserUsageStats,
  GetUpgradeRecommendation,
  ConsumeLearningCredits,
  GetLearningAnalytics,
  UpdateUserLearningQuota
} from 'wasp/server/operations';
import type { User } from 'wasp/entities';
import { 
  checkUserCredits, 
  consumeCredits, 
  getUpgradeRecommendation as getUpgradeRec,
  checkLearningAdminAccess,
  CreditOperation,
  CreditCheckResult,
  UsageStats,
  CREDIT_COSTS,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS
} from './operations';
import { SubscriptionStatus } from '../../payment/plans';

// Check if user has credits for a specific learning operation
type CheckLearningCreditsInput = {
  operation: CreditOperation;
};

export const checkLearningCredits: CheckLearningCredits<CheckLearningCreditsInput, CreditCheckResult> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { operation } = args;

  if (!operation || !CREDIT_COSTS[operation]) {
    throw new HttpError(400, 'Invalid operation specified');
  }

  try {
    return await checkUserCredits(context.user.id, operation, context);
  } catch (error) {
    console.error('Failed to check learning credits:', error);
    throw new HttpError(500, 'Failed to check credit availability');
  }
};

// Get user's current usage statistics
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
  [key: string]: any; // Index signature for SuperJSONObject compatibility
};

export const getUserUsageStats: GetUserUsageStats<void, UserUsageStatsOutput> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count topics created this month
    const topicsThisMonth = await context.entities.Topic.count({
      where: {
        userProgress: {
          some: {
            userId: context.user.id,
            topic: {
              createdAt: {
                gte: startOfMonth
              }
            }
          }
        }
      }
    });

    // Count chat messages today
    const chatMessagesToday = await context.entities.Message.count({
      where: {
        thread: {
          userId: context.user.id
        },
        role: 'USER',
        createdAt: {
          gte: startOfDay
        }
      }
    });

    // Count quizzes this week
    const quizzesThisWeek = await context.entities.Quiz.count({
      where: {
        userId: context.user.id,
        createdAt: {
          gte: startOfWeek
        }
      }
    });

    const estimatedCreditsUsed = (topicsThisMonth * CREDIT_COSTS.TOPIC_RESEARCH) + 
                                (chatMessagesToday * CREDIT_COSTS.AI_CHAT_MESSAGE) + 
                                (quizzesThisWeek * CREDIT_COSTS.QUIZ_GENERATION);

    const isSubscribed = context.user.subscriptionStatus === SubscriptionStatus.Active;
    const isPro = context.user.subscriptionPlan === 'pro';

    // Determine limits based on subscription
    let limits;
    if (!isSubscribed) {
      limits = FREE_TIER_LIMITS;
    } else if (isPro) {
      limits = PREMIUM_TIER_LIMITS;
    } else {
      // Hobby tier - 3x free tier limits
      limits = {
        TOPICS_PER_MONTH: FREE_TIER_LIMITS.TOPICS_PER_MONTH * 3,
        CHAT_MESSAGES_PER_DAY: FREE_TIER_LIMITS.CHAT_MESSAGES_PER_DAY * 3,
        QUIZZES_PER_WEEK: FREE_TIER_LIMITS.QUIZZES_PER_WEEK * 3,
        TOTAL_CREDITS_PER_MONTH: FREE_TIER_LIMITS.TOTAL_CREDITS_PER_MONTH * 3,
      };
    }

    return {
      topicsThisMonth,
      chatMessagesToday,
      quizzesThisWeek,
      creditsUsedThisMonth: estimatedCreditsUsed,
      lastResetDate: startOfMonth,
      limits: {
        topicsPerMonth: limits.TOPICS_PER_MONTH,
        chatMessagesPerDay: limits.CHAT_MESSAGES_PER_DAY,
        quizzesPerWeek: limits.QUIZZES_PER_WEEK,
        totalCreditsPerMonth: limits.TOTAL_CREDITS_PER_MONTH,
      },
      subscriptionInfo: {
        isSubscribed,
        plan: context.user.subscriptionPlan || undefined,
        status: context.user.subscriptionStatus || undefined,
      }
    };
  } catch (error) {
    console.error('Failed to get user usage stats:', error);
    throw new HttpError(500, 'Failed to retrieve usage statistics');
  }
};

// Get upgrade recommendation for user
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

export const getUpgradeRecommendation: GetUpgradeRecommendation<void, UpgradeRecommendationOutput> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  try {
    const recommendation = await getUpgradeRec(context.user.id, context);
    
    // Get current usage for context
    const usage = await getUserUsageStats(undefined, context);

    return {
      ...recommendation,
      currentUsage: {
        topicsThisMonth: usage.topicsThisMonth,
        chatMessagesToday: usage.chatMessagesToday,
        quizzesThisWeek: usage.quizzesThisWeek,
      }
    };
  } catch (error) {
    console.error('Failed to get upgrade recommendation:', error);
    throw new HttpError(500, 'Failed to generate upgrade recommendation');
  }
};

// Consume credits for a learning operation
type ConsumeLearningCreditsInput = {
  operation: CreditOperation;
  metadata?: Record<string, any>;
};

export const consumeLearningCredits: ConsumeLearningCredits<ConsumeLearningCreditsInput, User> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { operation, metadata } = args;

  if (!operation || !CREDIT_COSTS[operation]) {
    throw new HttpError(400, 'Invalid operation specified');
  }

  try {
    return await consumeCredits(context.user.id, operation, context, metadata);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to consume learning credits:', error);
    throw new HttpError(500, 'Failed to process credit consumption');
  }
};

// Admin: Get learning platform analytics
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

export const getLearningAnalytics: GetLearningAnalytics<void, LearningAnalyticsOutput> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  if (!checkLearningAdminAccess(context.user)) {
    throw new HttpError(403, 'Admin access required');
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic counts
    const totalUsers = await context.entities.User.count();
    const subscribedUsers = await context.entities.User.count({
      where: {
        subscriptionStatus: SubscriptionStatus.Active
      }
    });

    // Users with learning activity
    const activeUsers = await context.entities.User.count({
      where: {
        topicProgress: {
          some: {
            lastAccessed: {
              gte: startOfMonth
            }
          }
        }
      }
    });

    const totalTopics = await context.entities.Topic.count();
    const totalChatMessages = await context.entities.Message.count();
    const totalQuizzes = await context.entities.Quiz.count();

    // Calculate averages
    const userProgressStats = await context.entities.UserTopicProgress.aggregate({
      _avg: {
        timeSpent: true
      },
      _count: {
        userId: true
      }
    });

    const averageTopicsPerUser = totalUsers > 0 ? totalTopics / totalUsers : 0;
    const averageTimeSpentPerUser = userProgressStats._avg.timeSpent || 0;

    // Top users by activity
    const topUsers = await context.entities.User.findMany({
      take: 10,
      include: {
        topicProgress: {
          select: {
            timeSpent: true,
            topic: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        topicProgress: {
          _count: 'desc'
        }
      }
    });

    const formattedTopUsers = topUsers.map(user => ({
      id: user.id,
      email: user.email || undefined,
      topicsCreated: user.topicProgress.length,
      totalTimeSpent: user.topicProgress.reduce((sum, p) => sum + p.timeSpent, 0),
      subscriptionStatus: user.subscriptionStatus || undefined
    }));

    // Usage by subscription plan
    const planUsage = await context.entities.User.groupBy({
      by: ['subscriptionPlan'],
      _count: {
        id: true
      },
      where: {
        subscriptionStatus: SubscriptionStatus.Active
      }
    });

    const usageByPlan = planUsage.map(plan => ({
      plan: plan.subscriptionPlan || 'free',
      userCount: plan._count.id,
      averageUsage: 0 // Would need more complex query to calculate
    }));

    // Monthly growth
    const newUsers = await context.entities.User.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const newTopics = await context.entities.Topic.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const newSubscriptions = await context.entities.User.count({
      where: {
        subscriptionStatus: SubscriptionStatus.Active,
        datePaid: {
          gte: startOfMonth
        }
      }
    });

    return {
      totalUsers,
      activeUsers,
      subscribedUsers,
      totalTopics,
      totalChatMessages,
      totalQuizzes,
      averageTopicsPerUser: Math.round(averageTopicsPerUser * 100) / 100,
      averageTimeSpentPerUser: Math.round(averageTimeSpentPerUser * 100) / 100,
      topUsers: formattedTopUsers,
      usageByPlan,
      monthlyGrowth: {
        newUsers,
        newTopics,
        newSubscriptions
      }
    };
  } catch (error) {
    console.error('Failed to get learning analytics:', error);
    throw new HttpError(500, 'Failed to retrieve learning analytics');
  }
};

// Admin: Update user learning quota
type UpdateUserLearningQuotaInput = {
  userId: string;
  credits?: number;
  customLimits?: {
    topicsPerMonth?: number;
    chatMessagesPerDay?: number;
    quizzesPerWeek?: number;
  };
};

export const updateUserLearningQuota: UpdateUserLearningQuota<UpdateUserLearningQuotaInput, User> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  if (!checkLearningAdminAccess(context.user)) {
    throw new HttpError(403, 'Admin access required');
  }

  const { userId, credits, customLimits } = args;

  if (!userId) {
    throw new HttpError(400, 'User ID is required');
  }

  try {
    const updateData: any = {};

    if (credits !== undefined) {
      updateData.credits = credits;
    }

    // For custom limits, we'd need to extend the User model or create a separate UserLimits model
    // For now, we'll just update credits
    if (customLimits) {
      console.log(`Custom limits requested for user ${userId}:`, customLimits);
      // TODO: Implement custom limits storage
    }

    const updatedUser = await context.entities.User.update({
      where: { id: userId },
      data: updateData
    });

    return updatedUser;
  } catch (error) {
    console.error('Failed to update user learning quota:', error);
    throw new HttpError(500, 'Failed to update user quota');
  }
};