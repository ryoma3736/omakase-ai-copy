/**
 * Usage API - Get current usage statistics
 *
 * GET /api/usage - Returns current user's usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUsageStats } from "@/lib/usage";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get usage statistics
    const stats = await getUsageStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
