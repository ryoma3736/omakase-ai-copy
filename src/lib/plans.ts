/**
 * Subscription Plans Configuration
 *
 * Defines pricing tiers, limits, and features for the Omakase AI platform.
 * Each plan includes monthly/yearly pricing with 20% annual discount.
 */

export const PLANS = {
  intern: {
    id: 'intern',
    name: 'Intern',
    description: 'スタートアップ向けエントリープラン',
    price: {
      monthly: 49,
      yearly: 470, // 20% discount: 49 * 12 * 0.8
    },
    stripePriceId: {
      monthly: process.env.STRIPE_INTERN_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_INTERN_YEARLY_PRICE_ID,
    },
    limits: {
      conversations: 50,
      products: 10,
      trainingDataGB: 0.1,
      agentTypes: 1,
      voiceTypes: 4,
    },
    features: {
      removeBranding: false,
      addToCart: false,
      leadManagement: false,
      analytics: 'basic',
      support: 'email',
    },
    featureList: [
      '月50会話まで',
      '最大10商品登録',
      '0.1GB トレーニングデータ',
      '1種類のエージェント',
      '4種類の音声タイプ',
      'メールサポート',
    ],
  },
  associate: {
    id: 'associate',
    name: 'Associate',
    description: '成長企業向けスタンダードプラン',
    price: {
      monthly: 149,
      yearly: 1430, // 20% discount: 149 * 12 * 0.8
    },
    stripePriceId: {
      monthly: process.env.STRIPE_ASSOCIATE_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_ASSOCIATE_YEARLY_PRICE_ID,
    },
    limits: {
      conversations: 300,
      products: 100,
      trainingDataGB: 1,
      agentTypes: 2,
      voiceTypes: 6,
    },
    features: {
      removeBranding: true,
      addToCart: false,
      leadManagement: false,
      analytics: 'standard',
      support: 'priority',
    },
    featureList: [
      '月300会話まで',
      '最大100商品登録',
      '1GB トレーニングデータ',
      '2種類のエージェント',
      '6種類の音声タイプ',
      'ブランディング削除',
      'アナリティクス',
      '優先サポート',
    ],
  },
  principal: {
    id: 'principal',
    name: 'Principal',
    description: '大規模企業向けプレミアムプラン',
    price: {
      monthly: 399,
      yearly: 3830, // 20% discount: 399 * 12 * 0.8
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRINCIPAL_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRINCIPAL_YEARLY_PRICE_ID,
    },
    limits: {
      conversations: 1000,
      products: 500,
      trainingDataGB: 5,
      agentTypes: 3,
      voiceTypes: 10,
    },
    features: {
      removeBranding: true,
      addToCart: true,
      leadManagement: true,
      analytics: 'advanced',
      support: 'dedicated',
    },
    featureList: [
      '月1,000会話まで',
      '最大500商品登録',
      '5GB トレーニングデータ',
      '3種類のエージェント',
      '10種類の音声タイプ',
      'ブランディング削除',
      'カート連携',
      'リード管理',
      '高度なアナリティクス',
      '専任サポート',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'エンタープライズ向けカスタムプラン',
    price: {
      monthly: 'custom',
      yearly: 'custom',
    },
    stripePriceId: {
      monthly: null,
      yearly: null,
    },
    limits: {
      conversations: -1, // unlimited
      products: -1, // unlimited
      trainingDataGB: -1, // unlimited
      agentTypes: 4,
      voiceTypes: 11,
    },
    features: {
      removeBranding: true,
      addToCart: true,
      leadManagement: true,
      analytics: 'enterprise',
      support: '24/7',
    },
    featureList: [
      '無制限会話',
      '無制限商品登録',
      '無制限トレーニングデータ',
      '4種類のエージェント',
      '11種類の音声タイプ',
      'ブランディング削除',
      'カート連携',
      'リード管理',
      'エンタープライズアナリティクス',
      '24/7サポート',
      'SLA保証',
      'カスタム開発',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId) {
  return PLANS[planId];
}

/**
 * Get plan price based on billing cycle
 */
export function getPlanPrice(planId: PlanId, billingCycle: BillingCycle): number | string {
  const plan = PLANS[planId];
  return plan.price[billingCycle];
}

/**
 * Get Stripe Price ID based on plan and billing cycle
 */
export function getStripePriceId(planId: PlanId, billingCycle: BillingCycle): string | null | undefined {
  const plan = PLANS[planId];
  return plan.stripePriceId[billingCycle];
}

/**
 * Check if user has reached limit for a specific resource
 */
export function hasReachedLimit(
  planId: PlanId,
  resourceType: keyof typeof PLANS.intern.limits,
  currentUsage: number
): boolean {
  const plan = PLANS[planId];
  const limit = plan.limits[resourceType];

  // -1 means unlimited
  if (limit === -1) {
    return false;
  }

  return currentUsage >= limit;
}

/**
 * Calculate yearly discount percentage
 */
export function getYearlyDiscount(): number {
  return 20; // 20% discount
}

/**
 * Calculate yearly savings
 */
export function getYearlySavings(planId: PlanId): number | null {
  const plan = PLANS[planId];

  if (typeof plan.price.monthly !== 'number' || typeof plan.price.yearly !== 'number') {
    return null;
  }

  const monthlyTotal = plan.price.monthly * 12;
  const yearlyPrice = plan.price.yearly;

  return monthlyTotal - yearlyPrice;
}

/**
 * Get all available plans (excluding Enterprise for self-service)
 */
export function getAvailablePlans(): PlanId[] {
  return ['intern', 'associate', 'principal'];
}

/**
 * Check if plan is valid
 */
export function isValidPlan(planId: string): planId is PlanId {
  return planId in PLANS;
}
