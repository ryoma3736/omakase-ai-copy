import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agents/[id]/knowledge/[entryId]
 * Get a specific knowledge base entry
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id: agentId, entryId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify agent ownership
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const entry = await prisma.knowledgeBase.findFirst({
    where: { id: entryId, agentId },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

/**
 * PATCH /api/agents/[id]/knowledge/[entryId]
 * Update a knowledge base entry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id: agentId, entryId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify agent ownership
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { title, content, status } = body;

    const entry = await prisma.knowledgeBase.update({
      where: { id: entryId, agentId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to update knowledge entry:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]/knowledge/[entryId]
 * Delete a knowledge base entry
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id: agentId, entryId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify agent ownership
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    await prisma.knowledgeBase.delete({
      where: { id: entryId, agentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete knowledge entry:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge entry" },
      { status: 500 }
    );
  }
}
