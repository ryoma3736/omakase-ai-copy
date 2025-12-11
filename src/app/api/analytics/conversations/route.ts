import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  analyzeConversation,
  extractTopQuestions,
  getSentimentDistribution,
  generateConversationInsights,
} from "@/lib/analytics/conversation";

/**
 * GET /api/analytics/conversations
 * Get conversation analytics and insights
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const agentId = searchParams.get("agentId");
    const conversationId = searchParams.get("conversationId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Validate agentId belongs to user
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
    }

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    switch (action) {
      case "analyze": {
        // Analyze a specific conversation
        if (!conversationId) {
          return NextResponse.json(
            { error: "conversationId is required for analyze action" },
            { status: 400 }
          );
        }

        // Verify conversation belongs to user's agent
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            agent: {
              userId: session.user.id,
            },
          },
        });

        if (!conversation) {
          return NextResponse.json(
            { error: "Conversation not found or unauthorized" },
            { status: 404 }
          );
        }

        const analysis = await analyzeConversation(conversationId);
        return NextResponse.json(analysis);
      }

      case "top-questions": {
        // Get top questions for an agent
        if (!agentId) {
          return NextResponse.json(
            { error: "agentId is required for top-questions action" },
            { status: 400 }
          );
        }

        const limit = parseInt(searchParams.get("limit") || "10");
        const topQuestions = await extractTopQuestions(agentId, limit);
        return NextResponse.json({ questions: topQuestions });
      }

      case "sentiment": {
        // Get sentiment distribution
        if (!agentId) {
          return NextResponse.json(
            { error: "agentId is required for sentiment action" },
            { status: 400 }
          );
        }

        const sentimentDist = await getSentimentDistribution(
          agentId,
          startDate,
          endDate
        );
        return NextResponse.json(sentimentDist);
      }

      case "insights": {
        // Get comprehensive conversation insights
        if (!agentId) {
          return NextResponse.json(
            { error: "agentId is required for insights action" },
            { status: 400 }
          );
        }

        const insights = await generateConversationInsights(
          agentId,
          startDate,
          endDate
        );
        return NextResponse.json(insights);
      }

      default: {
        // Return list of recent conversations for the user's agents
        const conversations = await prisma.conversation.findMany({
          where: {
            agent: {
              userId: session.user.id,
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
            messages: {
              select: {
                id: true,
                role: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        });

        const conversationsData = conversations.map((conv) => ({
          id: conv.id,
          sessionId: conv.sessionId,
          status: conv.status,
          agentId: conv.agent.id,
          agentName: conv.agent.name,
          messageCount: conv.messages.length,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          duration:
            conv.messages.length > 1
              ? Math.floor(
                  (conv.messages[conv.messages.length - 1].createdAt.getTime() -
                    conv.messages[0].createdAt.getTime()) /
                    1000
                )
              : 0,
        }));

        return NextResponse.json({
          conversations: conversationsData,
          total: conversationsData.length,
        });
      }
    }
  } catch (error) {
    console.error("Error in conversation analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation analytics" },
      { status: 500 }
    );
  }
}
