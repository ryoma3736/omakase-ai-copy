import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { isValidPlan, type PlanId, type BillingCycle } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle } = body as {
      planId: string;
      billingCycle: BillingCycle;
    };

    // Validate plan ID
    if (!planId || !isValidPlan(planId)) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    // Enterprise plan requires custom quote
    if (planId === "enterprise") {
      return NextResponse.json(
        { error: "Enterprise plan requires custom quote. Please contact sales." },
        { status: 400 }
      );
    }

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email,
      planId as PlanId,
      billingCycle
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
