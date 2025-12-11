/**
 * Example: Updated Chat API Route with Usage Tracking
 *
 * This file demonstrates how to integrate rate limiting and usage tracking
 * into the chat API endpoint.
 *
 * To use this:
 * 1. Review this example
 * 2. Copy the relevant parts to your actual route.ts
 * 3. Delete this .example.ts file
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatStream, type ChatMessage } from "@/lib/claude";
import {
  generateSystemPrompt,
  getDefaultPersonality,
  type PersonalityConfig,
} from "@/lib/prompt-generator";
import { auth } from "@/lib/auth";
import { withRateLimit, chatLimiter } from "@/lib/rate-limit";
import { withChatUsageCheck } from "@/lib/usage";

export const runtime = "nodejs";

interface ChatRequestBody {
  agentId: string;
  message: string;
  conversationId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING (per-IP)
    const rateLimitResult = await withRateLimit(request, chatLimiter);
    if (rateLimitResult) return rateLimitResult;

    // Parse request body
    const body: ChatRequestBody = await request.json();
    const { agentId, message, conversationId, sessionId } = body;

    if (!agentId || !message) {
      return new Response(
        JSON.stringify({ error: "agentId and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch agent with related data
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: true, // Include user for usage tracking
        products: true,
        knowledgeBase: {
          where: { status: "READY" },
        },
      },
    });

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!agent.isActive) {
      return new Response(JSON.stringify({ error: "Agent is not active" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. USAGE TRACKING (subscription-based)
    // Check if agent owner has exceeded their plan limits
    const usageCheckResult = await withChatUsageCheck(agent.userId);
    if (usageCheckResult) return usageCheckResult;

    // Get or create conversation
    let conversation;
    const currentSessionId = sessionId || crypto.randomUUID();

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          agentId,
          sessionId: currentSessionId,
          status: "ACTIVE",
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: message,
      },
    });

    // Build chat history
    const chatHistory: ChatMessage[] = conversation.messages.map((msg) => ({
      role: msg.role === "USER" ? "user" : "assistant",
      content: msg.content,
    }));
    chatHistory.push({ role: "user", content: message });

    // Generate system prompt
    const personality =
      (agent.personality as unknown as PersonalityConfig) ||
      getDefaultPersonality();
    const systemPrompt = generateSystemPrompt({
      agent,
      products: agent.products,
      knowledgeBase: agent.knowledgeBase,
      personality,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation metadata first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "metadata",
                conversationId: conversation.id,
                sessionId: currentSessionId,
              })}\n\n`
            )
          );

          // Stream Claude response
          for await (const chunk of chatStream(chatHistory, systemPrompt)) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "message", content: chunk })}\n\n`
              )
            );
          }

          // Save assistant response
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: fullResponse,
            },
          });

          // Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", fullContent: fullResponse })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Unknown error",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
