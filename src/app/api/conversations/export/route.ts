import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface ExportOptions {
  format: "csv" | "json";
  agentId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * GET /api/conversations/export
 * Export conversations as CSV or JSON
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get("format") as "csv" | "json") || "csv";
    const agentId = searchParams.get("agentId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get user's agents
    const userAgents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    });

    const agentIds = agentId
      ? [agentId]
      : userAgents.map((a) => a.id);

    // Build date filter
    const dateFilter: Record<string, Date> = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Fetch conversations with messages
    const conversations = await prisma.conversation.findMany({
      where: {
        agentId: { in: agentIds },
        ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
      },
      include: {
        agent: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Limit to prevent memory issues
    });

    if (format === "json") {
      return NextResponse.json(
        {
          exportedAt: new Date().toISOString(),
          totalConversations: conversations.length,
          conversations: conversations.map((c) => ({
            id: c.id,
            agentName: c.agent.name,
            sessionId: c.sessionId,
            status: c.status,
            startedAt: c.createdAt.toISOString(),
            messageCount: c.messages.length,
            messages: c.messages.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.createdAt.toISOString(),
            })),
          })),
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="conversations-${Date.now()}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvRows: string[] = [
      // Header row
      "conversation_id,agent_name,session_id,status,started_at,message_count,role,content,message_timestamp",
    ];

    for (const conv of conversations) {
      if (conv.messages.length === 0) {
        // Conversation with no messages
        csvRows.push(
          [
            conv.id,
            escapeCSV(conv.agent.name),
            conv.sessionId,
            conv.status,
            conv.createdAt.toISOString(),
            "0",
            "",
            "",
            "",
          ].join(",")
        );
      } else {
        // Add row for each message
        for (const msg of conv.messages) {
          csvRows.push(
            [
              conv.id,
              escapeCSV(conv.agent.name),
              conv.sessionId,
              conv.status,
              conv.createdAt.toISOString(),
              conv.messages.length.toString(),
              msg.role,
              escapeCSV(msg.content),
              msg.createdAt.toISOString(),
            ].join(",")
          );
        }
      }
    }

    const csvContent = csvRows.join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conversations-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export conversations" },
      { status: 500 }
    );
  }
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
