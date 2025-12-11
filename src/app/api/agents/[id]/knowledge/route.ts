import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agents/[id]/knowledge
 * Get all knowledge base entries for an agent
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
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

  const entries = await prisma.knowledgeBase.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

/**
 * POST /api/agents/[id]/knowledge
 * Add a new knowledge base entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
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
    const { type, title, url, content } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["URL", "PDF", "CSV", "TEXT", "MARKDOWN"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }

    let entryContent = content || "";
    let metadata: { url?: string } = {};

    // For URL type, fetch the content
    if (type === "URL") {
      if (!url) {
        return NextResponse.json(
          { error: "URL is required for URL type" },
          { status: 400 }
        );
      }

      metadata = { url };

      // Optionally fetch content asynchronously
      // For now, store URL and mark as PENDING
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "OmakaseAI-Bot/1.0",
          },
        });

        if (response.ok) {
          const html = await response.text();
          // Basic HTML to text conversion
          entryContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 50000); // Limit content size
        }
      } catch (fetchError) {
        console.error("Failed to fetch URL:", fetchError);
        // Continue with empty content, mark as PENDING
      }
    }

    const entry = await prisma.knowledgeBase.create({
      data: {
        agentId,
        type,
        title,
        content: entryContent,
        metadata,
        status: entryContent ? "READY" : "PENDING",
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create knowledge entry:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge entry" },
      { status: 500 }
    );
  }
}
