import Stripe from "stripe";

// Server-side Stripe instance (lazy initialization)
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Legacy export for compatibility
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get subscriptions() { return getStripe().subscriptions; },
  get invoices() { return getStripe().invoices; },
  get webhooks() { return getStripe().webhooks; },
};

// Pricing plans configuration
export const PLANS = {
  free: {
    name: "Free",
    description: "小規模サイト向け",
    price: 0,
    priceId: null,
    features: [
      "1エージェント",
      "月100会話まで",
      "基本的なカスタマイズ",
      "メールサポート",
    ],
    limits: {
      agents: 1,
      conversationsPerMonth: 100,
      productsPerAgent: 50,
    },
  },
  intern: {
    name: "Intern",
    description: "成長中のECサイト向け",
    price: 9800,
    priceId: process.env.STRIPE_INTERN_PRICE_ID,
    features: [
      "3エージェント",
      "月1,000会話まで",
      "フルカスタマイズ",
      "アナリティクス",
      "優先サポート",
    ],
    limits: {
      agents: 3,
      conversationsPerMonth: 1000,
      productsPerAgent: 500,
    },
  },
  associate: {
    name: "Associate",
    description: "本格的なEC運営向け",
    price: 29800,
    priceId: process.env.STRIPE_ASSOCIATE_PRICE_ID,
    features: [
      "10エージェント",
      "月10,000会話まで",
      "API アクセス",
      "高度なアナリティクス",
      "専任サポート",
    ],
    limits: {
      agents: 10,
      conversationsPerMonth: 10000,
      productsPerAgent: 5000,
    },
  },
  principal: {
    name: "Principal",
    description: "大規模EC向けエンタープライズ",
    price: 98000,
    priceId: process.env.STRIPE_PRINCIPAL_PRICE_ID,
    features: [
      "無制限エージェント",
      "無制限会話",
      "専用インフラ",
      "SLA保証",
      "24/7サポート",
      "カスタム開発",
    ],
    limits: {
      agents: -1, // unlimited
      conversationsPerMonth: -1, // unlimited
      productsPerAgent: -1, // unlimited
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  planType: PlanType
): Promise<string> {
  const plan = PLANS[planType];

  if (!plan.priceId) {
    throw new Error("This plan does not support checkout");
  }

  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
    metadata: {
      userId,
      planType,
    },
    subscription_data: {
      metadata: {
        userId,
        planType,
      },
    },
  });

  return session.url || "";
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(
  customerId: string
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
  });

  return session.url;
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await getStripe().subscriptions.cancel(subscriptionId);
}

/**
 * Get customer's invoices
 */
export async function getInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await getStripe().invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}
