/**
 * Streaming Chat API - 超高速リアルタイムテキスト配信
 * omakase.aiより高速な応答を実現
 */

import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Edge Runtime有効化 - コールドスタート大幅削減
export const runtime = "edge";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

// 超高速化: 1文以内で即答
const SYSTEM_PROMPT = `あなたはECショップの超高速AIアシスタントです。
絶対に1文、30文字以内で即答。敬語で簡潔に。
例: 「はい、在庫あります！」「おすすめは〇〇です！」`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, history = [] } = body;

  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          generationConfig: {
            temperature: 0.1, // 超低温で最速・確定的
            maxOutputTokens: 50, // 超短く制限（1文30文字程度）
            topP: 0.8, // 高速サンプリング
            topK: 10, // 候補絞り込み
          },
        });

        // 会話履歴を最新2ターンに制限（超高速化）
        const recentHistory = history.slice(-4);

        // 会話履歴を構築
        const contents = [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "了解" }] },
          ...recentHistory.map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          { role: "user", parts: [{ text: message }] },
        ];

        const result = await model.generateContentStream({ contents });

        let sentenceBuffer = "";
        let sentenceIndex = 0;

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (!text) continue;

          sentenceBuffer += text;

          // 文末検出して送信
          const sentences = sentenceBuffer.split(/(?<=[。！？\n])/);

          // 最後の要素以外は完成した文
          while (sentences.length > 1) {
            const completeSentence = sentences.shift()!;
            if (completeSentence.trim()) {
              const data = JSON.stringify({
                type: "sentence",
                index: sentenceIndex++,
                text: completeSentence,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // 残りはバッファに戻す
          sentenceBuffer = sentences[0] || "";

          // 部分テキストも送信（UI表示用）
          const partialData = JSON.stringify({
            type: "partial",
            text: text,
          });
          controller.enqueue(encoder.encode(`data: ${partialData}\n\n`));
        }

        // バッファに残った最後の文
        if (sentenceBuffer.trim()) {
          const data = JSON.stringify({
            type: "sentence",
            index: sentenceIndex++,
            text: sentenceBuffer,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // 完了通知
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done", totalSentences: sentenceIndex })}\n\n`)
        );
      } catch (error) {
        console.error("Chat stream error:", error);
        const errorData = JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Streaming Chat API",
      usage: "POST with { message: 'your message', history: [] }",
      response: "Server-Sent Events with sentences",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
