import { HttpError } from 'wasp/server';
import type { User } from 'wasp/entities';
import { SubscriptionStatus, PaymentPlanId } from '../../payment/plans';

// Credit costs for different learning operations
export const CREDIT_COSTS = {
  TOPIC_RESEARCH: 2,        // Creating and researching a new topic
  AI_CHAT_MESSAGE: 1,       // Sending a message in chat
  QUIZ_GENERATION: 1,       // Generating a quiz
  CONTENT_GENERATION: 1,    // Generating learning content
  VECTOR_SEARCH: 0,         // Vector search is free
} as const;

// Free tier limits
export const FREE_TIER_LIMITS = {
  TOPICS_PER_MONTH: 3,
  CHAT_MESSAGES_PER_DAY: 10,
  QUIZZES_PER_WEEK: 2,
  TOTAL_CREDITS_PER_MONTH: 10,
} as const;

// Premium tier limits (much higher)
export const PREMIUM_TIER_LIMITS = {
  TOPICS_PER_MONTH: 50,
  CHAT_MESSAGES_PER_DAY: 200,
  QUIZZES_PER_WEEK: 50,
  TOTAL_CREDITS_PER_MONTH: 500,
} as const;

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
  [key: string]: any; // Index signature for SuperJSONObject compatibility
}

export interface UsageStats {
  topicsThisMonth: number;
  chatMessagesToday: number;
  quizzesThisWeek: number;
  creditsUsedThisMonth: number;
  lastResetDate: Date;
  [key: string]: any; // Index signature for SuperJSONObject compatibility
}

/**
 * Check if user has sufficient credits and permissions for an operation
 */
export async function checkUserCredits(
  userId: string,
  operation: CreditOperation,
  context: { entities: { User: any; Topic?: any; Message?: any; Quiz?: any } }
): Promise<CreditCheckResult> {
  const user = await context.entities.User.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const requiredCredits = CREDIT_COSTS[operation];
  const isSubscribed = user.subscriptionStatus === SubscriptionStatus.Active;
  const isPro = user.subscriptionPlan === PaymentPlanId.Pro;

  // For now, skip complex usage stats and just check credits
  // TODO: Re-enable usage stats checking once all entities are properly configured

  // Get current usage stats only if all required entities are available
  let usageStats: UsageStats | null = null;
  try {
    if (context.entities.Topic && context.entities.Message && context.entities.Quiz) {
      usageStats = await getUserUsageStats(userId, context);
    }
  } catch (error) {
    console.warn('Failed to get usage stats, proceeding with credit-only check:', error);
  }

  // Check subscription-based limits first (only if we have usage stats)
  if (!isSubscribed && usageStats) {
    // Free tier checks
    const freeChecks = checkFreeTierLimits(operation, usageStats);
    if (!freeChecks.allowed) {
      return {
        hasCredits: false,
        currentCredits: user.credits,
        requiredCredits,
        isSubscribed: false,
        upgradeRequired: true,
        limitType: 'feature_limit',
        resetDate: freeChecks.resetDate
      };
    }
  } else if (isSubscribed && !isPro && usageStats) {
    // Hobby tier checks (more generous than free but still limited)
    const hobbyChecks = checkHobbyTierLimits(operation, usageStats);
    if (!hobbyChecks.allowed) {
      return {
        hasCredits: false,
        currentCredits: user.credits,
        requiredCredits,
        isSubscribed: true,
        subscriptionPlan: user.subscriptionPlan || 'hobby',
        upgradeRequired: true,
        limitType: 'feature_limit',
        resetDate: hobbyChecks.resetDate
      };
    }
  }

  // Check credit balance
  const hasCredits = user.credits >= requiredCredits;

  return {
    hasCredits,
    currentCredits: user.credits,
    requiredCredits,
    isSubscribed,
    subscriptionPlan: user.subscriptionPlan || undefined,
    upgradeRequired: !hasCredits && !isSubscribed,
    limitType: hasCredits ? undefined : 'credits'
  };
}

/**
 * Consume credits for an operation
 */
export async function consumeCredits(
  userId: string,
  operation: CreditOperation,
  context: { entities: { User: any; Topic?: any; Message?: any; Quiz?: any } },
  metadata?: Record<string, any>
): Promise<User> {
  const creditCheck = await checkUserCredits(userId, operation, context);

  if (!creditCheck.hasCredits) {
    if (creditCheck.limitType === 'feature_limit') {
      throw new HttpError(403, `Feature limit reached. ${creditCheck.upgradeRequired ? 'Upgrade required.' : 'Try again later.'}`);
    } else {
      throw new HttpError(402, 'Insufficient credits. Please purchase more credits or upgrade your subscription.');
    }
  }

  const requiredCredits = CREDIT_COSTS[operation];

  // Deduct credits
  const updatedUser = await context.entities.User.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: requiredCredits
      }
    }
  });

  // Log the credit usage (you might want to create a separate CreditUsage model for detailed tracking)
  console.log(`Credits consumed: ${requiredCredits} for ${operation} by user ${userId}`, metadata);

  return updatedUser;
}

/**
 * Get user's current usage statistics
 */
async function getUserUsageStats(userId: string, context: { entities: { User: any; Topic?: any; Message?: any; Quiz?: any } }): Promise<UsageStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Count topics created this month (if Topic entity is available)
  const topicsThisMonth = context.entities.Topic ? await context.entities.Topic.count({
    where: {
      createdAt: {
        gte: startOfMonth
      },
      userProgress: {
        some: {
          userId
        }
      }
    }
  }) : 0;

  // Count chat messages today (if Message entity is available)
  const chatMessagesToday = context.entities.Message ? await context.entities.Message.count({
    where: {
      thread: {
        userId
      },
      role: 'USER',
      createdAt: {
        gte: startOfDay
      }
    }
  }) : 0;

  // Count quizzes this week (if Quiz entity is available)
  const quizzesThisWeek = context.entities.Quiz ? await context.entities.Quiz.count({
    where: {
      userId,
      createdAt: {
        gte: startOfWeek
      }
    }
  }) : 0;

  // For credits used this month, we'd need a separate tracking table
  // For now, we'll estimate based on activity
  const estimatedCreditsUsed = (topicsThisMonth * CREDIT_COSTS.TOPIC_RESEARCH) +
    (chatMessagesToday * CREDIT_COSTS.AI_CHAT_MESSAGE) +
    (quizzesThisWeek * CREDIT_COSTS.QUIZ_GENERATION);

  return {
    topicsThisMonth,
    chatMessagesToday,
    quizzesThisWeek,
    creditsUsedThisMonth: estimatedCreditsUsed,
    lastResetDate: startOfMonth
  };
}

/**
 * Check free tier limits
 */
function checkFreeTierLimits(operation: CreditOperation, usage: UsageStats): { allowed: boolean; resetDate?: Date } {
  const now = new Date();

  switch (operation) {
    case 'TOPIC_RESEARCH':
      if (usage.topicsThisMonth >= FREE_TIER_LIMITS.TOPICS_PER_MONTH) {
        return {
          allowed: false,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
      }
      break;
    case 'AI_CHAT_MESSAGE':
      if (usage.chatMessagesToday >= FREE_TIER_LIMITS.CHAT_MESSAGES_PER_DAY) {
        return {
          allowed: false,
          resetDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
      }
      break;
    case 'QUIZ_GENERATION':
      if (usage.quizzesThisWeek >= FREE_TIER_LIMITS.QUIZZES_PER_WEEK) {
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + (7 - now.getDay()));
        return {
          allowed: false,
          resetDate: nextWeek
        };
      }
      break;
  }

  return { allowed: true };
}

/**
 * Check hobby tier limits (more generous than free)
 */
function checkHobbyTierLimits(operation: CreditOperation, usage: UsageStats): { allowed: boolean; resetDate?: Date } {
  const now = new Date();

  // Hobby tier has 3x the limits of free tier
  const hobbyLimits = {
    TOPICS_PER_MONTH: FREE_TIER_LIMITS.TOPICS_PER_MONTH * 3,
    CHAT_MESSAGES_PER_DAY: FREE_TIER_LIMITS.CHAT_MESSAGES_PER_DAY * 3,
    QUIZZES_PER_WEEK: FREE_TIER_LIMITS.QUIZZES_PER_WEEK * 3,
  };

  switch (operation) {
    case 'TOPIC_RESEARCH':
      if (usage.topicsThisMonth >= hobbyLimits.TOPICS_PER_MONTH) {
        return {
          allowed: false,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
      }
      break;
    case 'AI_CHAT_MESSAGE':
      if (usage.chatMessagesToday >= hobbyLimits.CHAT_MESSAGES_PER_DAY) {
        return {
          allowed: false,
          resetDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
      }
      break;
    case 'QUIZ_GENERATION':
      if (usage.quizzesThisWeek >= hobbyLimits.QUIZZES_PER_WEEK) {
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + (7 - now.getDay()));
        return {
          allowed: false,
          resetDate: nextWeek
        };
      }
      break;
  }

  return { allowed: true };
}

/**
 * Check if user has admin privileges for learning platform management
 */
export function checkLearningAdminAccess(user: User): boolean {
  return user.isAdmin;
}

/**
 * Get upgrade recommendation based on user's usage patterns
 */
export async function getUpgradeRecommendation(userId: string, context: { entities: { User: any; Topic?: any; Message?: any; Quiz?: any } }): Promise<{
  shouldUpgrade: boolean;
  recommendedPlan: PaymentPlanId;
  reason: string;
  savings?: number;
}> {
  const user = await context.entities.User.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const usage = await getUserUsageStats(userId, context);
  const isSubscribed = user.subscriptionStatus === SubscriptionStatus.Active;

  // If user is hitting free tier limits frequently
  if (!isSubscribed) {
    const isHeavyUser = usage.topicsThisMonth >= FREE_TIER_LIMITS.TOPICS_PER_MONTH * 0.8 ||
      usage.chatMessagesToday >= FREE_TIER_LIMITS.CHAT_MESSAGES_PER_DAY * 0.8 ||
      usage.quizzesThisWeek >= FREE_TIER_LIMITS.QUIZZES_PER_WEEK * 0.8;

    if (isHeavyUser) {
      return {
        shouldUpgrade: true,
        recommendedPlan: PaymentPlanId.Hobby,
        reason: 'You\'re approaching your free tier limits. Upgrade to Hobby for 3x more usage and priority support.',
        savings: 15 // Estimated monthly savings vs buying credits
      };
    }
  }

  // If hobby user is hitting limits, recommend Pro
  if (isSubscribed && user.subscriptionPlan === PaymentPlanId.Hobby) {
    const hobbyLimits = {
      TOPICS_PER_MONTH: FREE_TIER_LIMITS.TOPICS_PER_MONTH * 3,
      CHAT_MESSAGES_PER_DAY: FREE_TIER_LIMITS.CHAT_MESSAGES_PER_DAY * 3,
      QUIZZES_PER_WEEK: FREE_TIER_LIMITS.QUIZZES_PER_WEEK * 3,
    };

    const isHittingHobbyLimits = usage.topicsThisMonth >= hobbyLimits.TOPICS_PER_MONTH * 0.8 ||
      usage.chatMessagesToday >= hobbyLimits.CHAT_MESSAGES_PER_DAY * 0.8 ||
      usage.quizzesThisWeek >= hobbyLimits.QUIZZES_PER_WEEK * 0.8;

    if (isHittingHobbyLimits) {
      return {
        shouldUpgrade: true,
        recommendedPlan: PaymentPlanId.Pro,
        reason: 'Upgrade to Pro for unlimited learning features and advanced AI capabilities.',
        savings: 50 // Estimated monthly savings vs buying credits
      };
    }
  }

  return {
    shouldUpgrade: false,
    recommendedPlan: user.subscriptionPlan as PaymentPlanId || PaymentPlanId.Hobby,
    reason: 'Your current plan meets your usage needs.'
  };
}