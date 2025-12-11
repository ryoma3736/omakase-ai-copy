import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createLead,
  getLeads,
  calculateLeadScore,
  updateLeadScore,
} from "@/lib/analytics";
import { Lead } from "@/types/analytics";

/**
 * GET /api/analytics/leads
 * Get leads for the user's agents
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const minScore = searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined;

    // If agentId is provided, verify it belongs to the user
    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId: session.user.id,
        },
      });

      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found or unauthorized" },
          { status: 404 }
        );
      }

      const leads = await getLeads(agentId, { limit, offset, minScore });
      return NextResponse.json({ leads, total: leads.length });
    }

    // Get leads for all user's agents
    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const agentIds = agents.map((a) => a.id);

    const allLeads = await prisma.lead.findMany({
      where: {
        agentId: { in: agentIds },
        ...(minScore && { score: { gte: minScore } }),
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    });

    const leadsData = allLeads.map((lead) => ({
      id: lead.id,
      agentId: lead.agentId,
      agentName: lead.agent.name,
      email: lead.email || undefined,
      name: lead.name || undefined,
      phone: lead.phone || undefined,
      score: lead.score,
      source: lead.source as "widget" | "form" | "conversation",
      conversationId: lead.conversationId || undefined,
      metadata: lead.metadata as Record<string, any>,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));

    return NextResponse.json({ leads: leadsData, total: leadsData.length });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/leads
 * Create a new lead
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const { agentId, email, name, phone, source, conversationId, metadata } =
      body;

    // Validate required fields
    if (!agentId || !source) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, source" },
        { status: 400 }
      );
    }

    // Validate source
    if (!["widget", "form", "conversation"].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source. Must be: widget, form, or conversation" },
        { status: 400 }
      );
    }

    // Verify agent exists and belongs to user (if authenticated)
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { userId: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // If user is authenticated, verify agent belongs to them
    if (session?.user?.id && agent.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Agent not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate initial lead score if conversationId is provided
    let initialScore = 50; // Default score
    if (conversationId) {
      initialScore = await calculateLeadScore(conversationId);
    }

    const lead = await createLead({
      agentId,
      email,
      name,
      phone,
      score: initialScore,
      source,
      conversationId,
      metadata,
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/analytics/leads
 * Update a lead's score
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, score } = body;

    if (!leadId || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: leadId, score" },
        { status: 400 }
      );
    }

    // Verify lead belongs to user's agent
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        agent: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.agent.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lead not found or unauthorized" },
        { status: 404 }
      );
    }

    await updateLeadScore(leadId, score);

    return NextResponse.json({ success: true, message: "Lead score updated" });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
