/**
 * Usage Tracking Utilities
 *
 * Tracks and enforces subscription-based usage limits:
 * - FREE: 100 chats/month, 10MB data
 * - INTERN: 1,000 chats/month, 100MB data
 * - ASSOCIATE: 10,000 chats/month, 1GB data
 * - PRINCIPAL: Unlimited chats, 10GB data
 */

import { prisma } from "./prisma";

export class UsageLimitError extends Error {
  public plan: string;
  public currentUsage: number;
  public limit: number;
  public usageType: "chat" | "data";

  constructor(
    plan: string,
    currentUsage: number,
    limit: number,
    usageType: "chat" | "data"
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
 * Based on Prisma schema SubscriptionPlan enum
 */
export const PLAN_LIMITS = {
  INTERN: {
    chatLimit: 1000,
    dataLimitMB: 100,
  },
  ASSOCIATE: {
    chatLimit: 10000,
    dataLimitMB: 1024, // 1GB
  },
  PRINCIPAL: {
    chatLimit: -1, // Unlimited
    dataLimitMB: 10240, // 10GB
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
 * Check if plan has unlimited chats
 */
export function hasUnlimitedChats(plan: string): boolean {
  const limits = getPlanLimits(plan);
  return limits.chatLimit === -1;
}

/**
 * Get or create subscription for user
 * Creates default FREE plan if doesn't exist
 */
export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Create default INTERN subscription
    subscription = await prisma.subscription.create({
      data: {
        userId,
        plan: "INTERN", // Default plan
        status: "ACTIVE",
        chatLimit: PLAN_LIMITS.INTERN.chatLimit,
        dataLimitMB: PLAN_LIMITS.INTERN.dataLimitMB,
        currentChatUsage: 0,
        currentDataUsage: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: getNextMonthDate(),
      },
    });
  }

  return subscription;
}

/**
 * Check if user can make a chat request
 * @param userId - User ID
 * @returns true if allowed
 * @throws UsageLimitError if limit exceeded
 */
export async function checkChatUsage(userId: string): Promise<boolean> {
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
  if (hasUnlimitedChats(subscription.plan)) {
    return true;
  }

  // Check chat limit
  if (subscription.currentChatUsage >= subscription.chatLimit) {
    throw new UsageLimitError(
      subscription.plan,
      subscription.currentChatUsage,
      subscription.chatLimit,
      "chat"
    );
  }

  return true;
}

/**
 * Check if user can upload data
 * @param userId - User ID
 * @param additionalMB - Additional data size in MB
 * @returns true if allowed
 * @throws UsageLimitError if limit exceeded
 */
export async function checkDataUsage(
  userId: string,
  additionalMB: number
): Promise<boolean> {
  const subscription = await getOrCreateSubscription(userId);

  // Check if billing period needs reset
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date()
  ) {
    await resetMonthlyUsage(userId);
    return true;
  }

  // Calculate new total
  const newTotal = subscription.currentDataUsage + additionalMB;

  // Check data limit
  if (newTotal > subscription.dataLimitMB) {
    throw new UsageLimitError(
      subscription.plan,
      subscription.currentDataUsage,
      subscription.dataLimitMB,
      "data"
    );
  }

  return true;
}

/**
 * Increment chat usage counter
 * @param userId - User ID
 * @param count - Number of chats to increment (default: 1)
 */
export async function incrementChatUsage(
  userId: string,
  count: number = 1
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      currentChatUsage: {
        increment: count,
      },
    },
  });
}

/**
 * Increment data usage counter
 * @param userId - User ID
 * @param sizeMB - Data size in MB
 */
export async function incrementDataUsage(
  userId: string,
  sizeMB: number
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      currentDataUsage: {
        increment: sizeMB,
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
      currentChatUsage: 0,
      currentDataUsage: 0,
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
    chat: {
      current: subscription.currentChatUsage,
      limit: limits.chatLimit === -1 ? "Unlimited" : limits.chatLimit,
      percentage:
        limits.chatLimit === -1
          ? 0
          : (subscription.currentChatUsage / limits.chatLimit) * 100,
    },
    data: {
      current: subscription.currentDataUsage,
      limit: limits.dataLimitMB,
      percentage: (subscription.currentDataUsage / limits.dataLimitMB) * 100,
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
  const limits = getPlanLimits(newPlan);

  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: newPlan,
      chatLimit: limits.chatLimit === -1 ? 999999 : limits.chatLimit,
      dataLimitMB: limits.dataLimitMB,
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
 * Checks and increments chat usage in one call
 */
export async function withChatUsageCheck(
  userId: string
): Promise<Response | null> {
  try {
    await checkChatUsage(userId);
    await incrementChatUsage(userId);
    return null; // Allow request
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return new Response(
        JSON.stringify({
          error: "Usage limit exceeded",
          message: `Your ${error.plan} plan allows ${error.limit} chats per month. You've used ${error.currentUsage}.`,
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
  sizeMB: number
): Promise<Response | null> {
  try {
    await checkDataUsage(userId, sizeMB);
    await incrementDataUsage(userId, sizeMB);
    return null; // Allow request
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return new Response(
        JSON.stringify({
          error: "Storage limit exceeded",
          message: `Your ${error.plan} plan allows ${error.limit}MB of storage. You've used ${error.currentUsage}MB.`,
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
