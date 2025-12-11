/**
 * Usage Tracking Utilities
 *
 * Tracks and enforces subscription-based usage limits:
 * - INTERN: 1,000 conversations/month, 100MB training data
 * - ASSOCIATE: 10,000 conversations/month, 1GB training data
 * - PRINCIPAL: Unlimited conversations, 10GB training data
 */

import { prisma } from "./prisma";

export class UsageLimitError extends Error {
  public plan: string;
  public currentUsage: number;
  public limit: number;
  public usageType: "conversation" | "data";

  constructor(
    plan: string,
    currentUsage: number,
    limit: number,
    usageType: "conversation" | "data"
  ) {
    super(`${usageType} usage limit exceeded for ${plan} plan`);
    this.name = "UsageLimitError";
    this.plan = plan;
    this.currentUsage = currentUsage;
    this.limit = limit;
    this.usageType = usageType;
  }
}

/**
 * Subscription plan limits configuration
 */
export const PLAN_LIMITS = {
  INTERN: {
    conversationLimit: 1000,
    dataLimitGB: 0.1, // 100MB
  },
  ASSOCIATE: {
    conversationLimit: 10000,
    dataLimitGB: 1, // 1GB
  },
  PRINCIPAL: {
    conversationLimit: -1, // Unlimited
    dataLimitGB: 10, // 10GB
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: string) {
  const normalizedPlan = plan.toUpperCase() as PlanType;
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.INTERN;
}

/**
 * Check if plan has unlimited conversations
 */
export function hasUnlimitedConversations(plan: string): boolean {
  const limits = getPlanLimits(plan);
  return limits.conversationLimit === -1;
}

/**
 * Get or create subscription for user
 * Creates default INTERN plan if doesn't exist
 */
export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Generate a placeholder stripeCustomerId for new subscriptions
    const placeholderCustomerId = `cus_placeholder_${userId}`;

    subscription = await prisma.subscription.create({
      data: {
        userId,
        stripeCustomerId: placeholderCustomerId,
        plan: "intern",
        status: "ACTIVE",
        conversationsUsed: 0,
        productsUsed: 0,
        trainingDataUsedGB: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: getNextMonthDate(),
      },
    });
  }

  return subscription;
}

/**
 * Check if user can make a conversation request
 * @param userId - User ID
 * @returns true if allowed
 * @throws UsageLimitError if limit exceeded
 */
export async function checkConversationUsage(userId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(userId);

  // Check if billing period needs reset
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date()
  ) {
    await resetMonthlyUsage(userId);
    return true;
  }

  // Check unlimited plans
  if (hasUnlimitedConversations(subscription.plan)) {
    return true;
  }

  const limits = getPlanLimits(subscription.plan);

  // Check conversation limit
  if (subscription.conversationsUsed >= limits.conversationLimit) {
    throw new UsageLimitError(
      subscription.plan,
      subscription.conversationsUsed,
      limits.conversationLimit,
      "conversation"
    );
  }

  return true;
}

/**
 * Check if user can upload data
 * @param userId - User ID
 * @param additionalGB - Additional data size in GB
 * @returns true if allowed
 * @throws UsageLimitError if limit exceeded
 */
export async function checkDataUsage(
  userId: string,
  additionalGB: number
): Promise<boolean> {
  const subscription = await getOrCreateSubscription(userId);
  const limits = getPlanLimits(subscription.plan);

  // Check if billing period needs reset
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date()
  ) {
    await resetMonthlyUsage(userId);
    return true;
  }

  // Calculate new total
  const newTotal = subscription.trainingDataUsedGB + additionalGB;

  // Check data limit
  if (newTotal > limits.dataLimitGB) {
    throw new UsageLimitError(
      subscription.plan,
      subscription.trainingDataUsedGB,
      limits.dataLimitGB,
      "data"
    );
  }

  return true;
}

/**
 * Increment conversation usage counter
 * @param userId - User ID
 * @param count - Number of conversations to increment (default: 1)
 */
export async function incrementConversationUsage(
  userId: string,
  count: number = 1
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      conversationsUsed: {
        increment: count,
      },
    },
  });
}

/**
 * Increment data usage counter
 * @param userId - User ID
 * @param sizeGB - Data size in GB
 */
export async function incrementDataUsage(
  userId: string,
  sizeGB: number
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      trainingDataUsedGB: {
        increment: sizeGB,
      },
    },
  });
}

/**
 * Reset monthly usage counters
 * Called automatically when billing period expires
 */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  const now = new Date();
  const nextPeriod = getNextMonthDate();

  await prisma.subscription.update({
    where: { userId },
    data: {
      conversationsUsed: 0,
      productsUsed: 0,
      trainingDataUsedGB: 0,
      currentPeriodStart: now,
      currentPeriodEnd: nextPeriod,
    },
  });
}

/**
 * Get usage statistics for user
 */
export async function getUsageStats(userId: string) {
  const subscription = await getOrCreateSubscription(userId);
  const limits = getPlanLimits(subscription.plan);

  return {
    plan: subscription.plan,
    status: subscription.status,
    conversations: {
      current: subscription.conversationsUsed,
      limit: limits.conversationLimit === -1 ? "Unlimited" : limits.conversationLimit,
      percentage:
        limits.conversationLimit === -1
          ? 0
          : (subscription.conversationsUsed / limits.conversationLimit) * 100,
    },
    data: {
      currentGB: subscription.trainingDataUsedGB,
      limitGB: limits.dataLimitGB,
      percentage: (subscription.trainingDataUsedGB / limits.dataLimitGB) * 100,
    },
    billingPeriod: {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
      daysRemaining: subscription.currentPeriodEnd
        ? Math.ceil(
            (subscription.currentPeriodEnd.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    },
  };
}

/**
 * Upgrade user subscription plan
 */
export async function upgradePlan(
  userId: string,
  newPlan: PlanType
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: newPlan.toLowerCase(),
    },
  });
}

/**
 * Get next month date (for billing period)
 */
function getNextMonthDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Middleware helper for API routes
 * Checks and increments conversation usage in one call
 */
export async function withConversationUsageCheck(
  userId: string
): Promise<Response | null> {
  try {
    await checkConversationUsage(userId);
    await incrementConversationUsage(userId);
    return null; // Allow request
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return new Response(
        JSON.stringify({
          error: "Usage limit exceeded",
          message: `Your ${error.plan} plan allows ${error.limit} conversations per month. You've used ${error.currentUsage}.`,
          plan: error.plan,
          currentUsage: error.currentUsage,
          limit: error.limit,
          upgradeUrl: "/dashboard/billing",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-Usage-Limit": String(error.limit),
            "X-Usage-Current": String(error.currentUsage),
          },
        }
      );
    }
    throw error;
  }
}

/**
 * Middleware helper for data upload endpoints
 */
export async function withDataUsageCheck(
  userId: string,
  sizeGB: number
): Promise<Response | null> {
  try {
    await checkDataUsage(userId, sizeGB);
    await incrementDataUsage(userId, sizeGB);
    return null; // Allow request
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return new Response(
        JSON.stringify({
          error: "Storage limit exceeded",
          message: `Your ${error.plan} plan allows ${error.limit}GB of training data. You've used ${error.currentUsage}GB.`,
          plan: error.plan,
          currentUsage: error.currentUsage,
          limit: error.limit,
          upgradeUrl: "/dashboard/billing",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-Storage-Limit": String(error.limit),
            "X-Storage-Current": String(error.currentUsage),
          },
        }
      );
    }
    throw error;
  }
}

// Alias for backward compatibility
export const checkChatUsage = checkConversationUsage;
export const incrementChatUsage = incrementConversationUsage;
export const withChatUsageCheck = withConversationUsageCheck;
