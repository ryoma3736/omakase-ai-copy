import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentAnalytics } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await params;

    // Verify ownership
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { userId: true },
    });

    if (!agent || agent.userId !== session.user.id) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const analytics = await getAgentAnalytics(agentId, startDate, endDate);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching agent analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
