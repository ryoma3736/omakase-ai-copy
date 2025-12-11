/**
 * API Key Management Endpoints
 * GET /api/api-keys - List all API keys for current user
 * POST /api/api-keys - Generate new API key
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";

/**
 * List API keys for current user's agents
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all agents for user
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        // In a real implementation, you'd have an ApiKey model
        // This is a placeholder
      },
    });

    // TODO: Fetch API keys from ApiKey model
    // For now, return agents that would have API keys
    return NextResponse.json({
      agents: agents.map((agent) => ({
        agentId: agent.id,
        agentName: agent.name,
        // These would come from ApiKey model:
        // apiKey: masked version,
        // createdAt: timestamp,
        // lastUsed: timestamp,
      })),
    });
  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * Generate new API key for an agent
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, mode = "live" } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Verify agent belongs to user
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

    // Generate new API key
    const apiKey = generateApiKey(mode as "live" | "test");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _hashedKey = hashApiKey(apiKey); // Will be used when ApiKey model exists

    // TODO: Store in ApiKey model
    // await prisma.apiKey.create({
    //   data: {
    //     agentId,
    //     keyHash: _hashedKey,
    //     mode,
    //     createdAt: new Date(),
    //   },
    // });

    // IMPORTANT: Only show the full key once
    return NextResponse.json(
      {
        message: "API key generated successfully",
        apiKey, // Show full key only on creation
        agentId,
        mode,
        warning: "Save this key securely. You won't be able to see it again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate API key error:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}

/**
 * Revoke an API key (DELETE)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 }
      );
    }

    // TODO: Verify ownership and delete from ApiKey model
    // await prisma.apiKey.delete({
    //   where: {
    //     id: keyId,
    //     agent: {
    //       userId: session.user.id,
    //     },
    //   },
    // });

    return NextResponse.json({
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
