/**
 * Streaming TTS API - 超高速チャンク分割音声生成
 * omakase.aiより高速な音声合成を実現
 */

import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Edge Runtime有効化 - コールドスタート大幅削減
export const runtime = "edge";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

/**
 * テキストを文単位でチャンク分割
 */
function splitToChunks(text: string): string[] {
  // 日本語の文末記号で分割
  const chunks = text.split(/(?<=[。！？\n])/);
  return chunks.filter(chunk => chunk.trim().length > 0);
}

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

  // RIFF header
  wav.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + dataSize, true);
  wav.set([0x57, 0x41, 0x56, 0x45], 8);

  // fmt chunk
  wav.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  wav.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, dataSize, true);
  wav.set(pcmData, headerSize);

  return wav;
}

/**
 * 単一チャンクのTTS生成
 */
async function generateChunkTTS(text: string, voice: string): Promise<string | null> {
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
        return Buffer.from(wavBytes).toString("base64");
      }

      return audioData.data;
    }

    return null;
  } catch (error) {
    console.error("Chunk TTS error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, voice = "Kore" } = body;

  if (!text) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const chunks = splitToChunks(text);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // チャンクを並列で生成開始（最大3並列）
      const batchSize = 3;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        const promises = batch.map(async (chunk, idx) => {
          const audio = await generateChunkTTS(chunk, voice);
          return { index: i + idx, chunk, audio };
        });

        const results = await Promise.all(promises);

        // 順番に送信
        for (const result of results.sort((a, b) => a.index - b.index)) {
          if (result.audio) {
            const data = JSON.stringify({
              chunk: result.index,
              text: result.chunk,
              audio: result.audio,
              mimeType: "audio/wav",
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
      }

      // 完了通知
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, totalChunks: chunks.length })}\n\n`));
      controller.close();
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
      message: "Streaming TTS API",
      usage: "POST with { text: 'long text', voice: 'Kore' }",
      response: "Server-Sent Events with audio chunks",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
