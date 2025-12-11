/**
 * Test Embedding API - Gemini Embedding Test
 * ナレッジベース検索用のベクトル生成テスト
 */

import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, EMBEDDING_DIMENSIONS } from "@/lib/vector/embedding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const embedding = await generateEmbedding(text);

    return NextResponse.json({
      success: true,
      dimensions: embedding.length,
      expectedDimensions: EMBEDDING_DIMENSIONS,
      preview: embedding.slice(0, 10), // 最初の10次元だけ表示
      provider: "gemini-embedding-001",
    });
  } catch (error) {
    console.error("Embedding error:", error);
    return NextResponse.json(
      {
        error: "Embedding failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Omakase AI Test Embedding API",
    usage: "POST with { text: 'your text' }",
    provider: "Gemini embedding-001",
    dimensions: EMBEDDING_DIMENSIONS,
  });
}
