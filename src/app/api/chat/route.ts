import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createChatClient,
  Message,
  ProviderType,
  ChatContext,
  createContext,
} from "@/lib/chat";
import {
  generateSystemPrompt,
  getDefaultPersonality,
  type PersonalityConfig,
} from "@/lib/prompt-generator";

export const runtime = "nodejs";

interface ChatRequestBody {
  agentId: string;
  message: string;
  conversationId?: string;
  sessionId?: string;
  provider?: ProviderType; // Allow client to specify provider
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { agentId, message, conversationId, sessionId, provider = "claude" } = body;

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

    // Initialize chat client with provider
    const chatClient = createChatClient({
      provider,
      fallbackProvider: provider === "claude" ? "openai" : "claude",
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 4096,
      },
    });

    // Build chat history using context manager
    const context = createContext({
      maxMessages: 50,
      maxTokens: 100000,
      preserveSystemMessage: true,
    });

    // Add conversation history
    conversation.messages.forEach((msg) => {
      context.addMessage({
        role: msg.role === "USER" ? "user" : "assistant",
        content: msg.content,
      });
    });

    // Add current user message
    context.addMessage({ role: "user", content: message });

    // Generate system prompt
    const personality = (agent.personality as unknown as PersonalityConfig) || getDefaultPersonality();
    const systemPrompt = generateSystemPrompt({
      agent,
      products: agent.products,
      knowledgeBase: agent.knowledgeBase,
      personality,
    });

    // Get messages with system prompt
    const messages = context.getMessagesWithSystem(systemPrompt);

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
                provider: chatClient.getProviderType(),
              })}\n\n`
            )
          );

          // Stream response from chat provider
          for await (const chunk of chatClient.chatStream(messages)) {
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
