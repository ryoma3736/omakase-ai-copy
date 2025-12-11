import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserAnalytics } from "@/lib/analytics";
import { analyticsTracker } from "@/lib/analytics/tracker";
import { AnalyticsEvent } from "@/types/analytics";

/**
 * GET /api/analytics
 * Get user analytics overview
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const analytics = await getUserAnalytics(
      session.user.id,
      startDate,
      endDate
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics
 * Track an analytics event
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event: Omit<AnalyticsEvent, "id" | "timestamp"> = {
      type: body.type,
      agentId: body.agentId,
      sessionId: body.sessionId,
      userId: body.userId,
      properties: body.properties || {},
    };

    // Validate required fields
    if (!event.type || !event.agentId || !event.sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: type, agentId, sessionId" },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes = [
      "conversation_start",
      "message_sent",
      "product_clicked",
      "checkout",
      "lead_captured",
      "widget_opened",
      "widget_closed",
    ];

    if (!validTypes.includes(event.type)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Track the event
    await analyticsTracker.trackEvent(event);

    return NextResponse.json(
      { success: true, message: "Event tracked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error tracking analytics event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
