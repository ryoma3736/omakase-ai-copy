/**
 * 統合Chat+TTS API - 超高速レスポンス
 * Chat応答とTTS生成を並列実行し、最速で音声を返す
 * omakase.aiより絶対に早い！
 */

import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Edge Runtime有効化
export const runtime = "edge";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

// 超高速プロンプト
const SYSTEM_PROMPT = `あなたはECショップの超高速AIアシスタントです。
絶対に1文、30文字以内で即答。敬語で簡潔に。`;

/**
 * PCM to WAV変換
 */
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const wav = new Uint8Array(headerSize + dataSize);
  const view = new DataView(wav.buffer);

  wav.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + dataSize, true);
  wav.set([0x57, 0x41, 0x56, 0x45], 8);
  wav.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  wav.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, dataSize, true);
  wav.set(pcmData, headerSize);

  return wav;
}

/**
 * TTS生成（非同期）
 */
async function generateTTS(text: string, voice: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-tts",
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      } as any,
    });

    const result = await model.generateContent(text);
    const response = result.response;

    // @ts-ignore
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (audioData?.data) {
      const mimeType = audioData.mimeType || "";
      const isPcm = mimeType.includes("pcm") || mimeType.includes("L16");

      if (isPcm) {
        const pcmBytes = Uint8Array.from(atob(audioData.data), c => c.charCodeAt(0));
        const wavBytes = pcmToWav(pcmBytes, 24000);
        // 最適化: チャンク処理でO(n)に改善
        const CHUNK_SIZE = 32768;
        let result = "";
        for (let i = 0; i < wavBytes.length; i += CHUNK_SIZE) {
          const chunk = wavBytes.subarray(i, Math.min(i + CHUNK_SIZE, wavBytes.length));
          result += String.fromCharCode.apply(null, Array.from(chunk));
        }
        return btoa(result);
      }

      return audioData.data;
    }

    return null;
  } catch (error) {
    console.error("TTS error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const body = await request.json();
  const { message, history = [], voice = "Kore" } = body;

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
        // Chat生成開始
        const chatModel = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
            topP: 0.8,
            topK: 10,
          },
        });

        const recentHistory = history.slice(-4);
        const contents = [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "了解" }] },
          ...recentHistory.map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          { role: "user", parts: [{ text: message }] },
        ];

        // Chat応答をストリーミング取得しながら、最初の文が完成したらTTS開始
        const result = await chatModel.generateContentStream({ contents });

        let fullText = "";
        let firstSentence = "";
        let ttsPromise: Promise<string | null> | null = null;
        let sentIndex = 0;

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (!text) continue;

          fullText += text;

          // 最初の文末検出でTTS生成を即座に開始（並列処理）
          if (!ttsPromise && /[。！？\n]/.test(fullText)) {
            firstSentence = fullText.split(/(?<=[。！？\n])/)[0];
            // TTS生成を非同期で開始（待たない）
            ttsPromise = generateTTS(firstSentence, voice);
          }

          // 部分テキストを即座に送信
          const partialData = JSON.stringify({
            type: "text",
            text: text,
            elapsed: Date.now() - startTime,
          });
          controller.enqueue(encoder.encode(`data: ${partialData}\n\n`));
        }

        // TTS結果を待機して送信
        if (ttsPromise) {
          const audio = await ttsPromise;
          if (audio) {
            const audioData = JSON.stringify({
              type: "audio",
              text: firstSentence,
              audio: audio,
              mimeType: "audio/wav",
              elapsed: Date.now() - startTime,
            });
            controller.enqueue(encoder.encode(`data: ${audioData}\n\n`));
          }
        } else if (fullText.trim()) {
          // 文末記号がなかった場合、全文でTTS生成
          const audio = await generateTTS(fullText, voice);
          if (audio) {
            const audioData = JSON.stringify({
              type: "audio",
              text: fullText,
              audio: audio,
              mimeType: "audio/wav",
              elapsed: Date.now() - startTime,
            });
            controller.enqueue(encoder.encode(`data: ${audioData}\n\n`));
          }
        }

        // 完了通知
        const doneData = JSON.stringify({
          type: "done",
          fullText: fullText,
          totalElapsed: Date.now() - startTime,
        });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

      } catch (error) {
        console.error("Chat+TTS error:", error);
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
      "X-Response-Start": String(startTime),
    },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Ultra-fast Chat+TTS API",
      description: "Chat応答とTTS生成を並列実行し、最速で音声を返す",
      usage: "POST with { message: 'your message', voice: 'Kore' }",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
