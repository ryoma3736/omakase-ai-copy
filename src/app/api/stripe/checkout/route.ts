import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession, PlanType } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planType } = body as { planType: PlanType };

    if (!planType || !["intern", "associate", "principal"].includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email,
      planType
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
