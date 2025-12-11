/**
 * Test Chat API - Direct Gemini Integration Test
 * DB不要でGemini APIを直接テスト
 */

import { NextRequest, NextResponse } from "next/server";
import * as Gemini from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Omakase AI Sales Agent のシステムプロンプト
    const systemPrompt = `あなたは「おまかせAI」のセールスエージェントです。
ECサイトの顧客対応を行う親切で知識豊富なAIアシスタントとして振る舞ってください。

役割:
- 商品に関する質問に丁寧に回答
- おすすめ商品の提案
- 購入の意思決定をサポート
- フレンドリーで親しみやすい口調

特徴:
- 日本語で自然に会話
- 具体的で役立つ情報を提供
- 押し売りはせず、顧客のニーズを優先`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: message },
    ];

    // Gemini API でチャット
    const response = await Gemini.chat(messages);

    return NextResponse.json({
      success: true,
      response: response.content,
      usage: response.usage,
      provider: "gemini",
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error: "Chat failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Omakase AI Test Chat API",
    usage: "POST with { message: 'your message' }",
    provider: "Gemini 2.0 Flash",
  });
}
