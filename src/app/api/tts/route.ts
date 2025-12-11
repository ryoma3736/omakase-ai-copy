/**
 * Gemini TTS API - 超高速音声合成エンドポイント
 * omakase.aiより高速なTTSを実現
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Edge Runtime有効化
export const runtime = "edge";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

/**
 * PCM (L16) to WAV変換
 * Gemini TTSはPCM形式で返すのでWAVヘッダーを追加
 */
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Uint8Array {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const wav = new Uint8Array(headerSize + dataSize);
  const view = new DataView(wav.buffer);

  // RIFF header
  wav.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  wav.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // fmt chunk
  wav.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, channels, true); // Channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitsPerSample, true); // Bits per sample

  // data chunk
  wav.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, dataSize, true); // Data size
  wav.set(pcmData, headerSize);

  return wav;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "Kore" } = body;

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Gemini 2.5 Flash TTS
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-tts",
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      } as any,
    });

    // シンプルなプロンプトで高速化
    const result = await model.generateContent(text);

    const response = result.response;

    // @ts-ignore - experimental property
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (audioData?.data) {
      // PCMデータをWAVに変換
      const mimeType = audioData.mimeType || "";
      const isPcm = mimeType.includes("pcm") || mimeType.includes("L16");

      if (isPcm) {
        // PCM to WAV変換
        const pcmBytes = Uint8Array.from(atob(audioData.data), c => c.charCodeAt(0));
        const wavBytes = pcmToWav(pcmBytes, 24000, 1, 16);
        // Edge Runtimeでは Buffer.from が使えないので、別の方法でBase64エンコード
        let binary = "";
        for (let i = 0; i < wavBytes.length; i++) {
          binary += String.fromCharCode(wavBytes[i]);
        }
        const wavBase64 = btoa(binary);

        return NextResponse.json({
          success: true,
          audio: wavBase64,
          mimeType: "audio/wav",
        });
      }

      // 既にブラウザ対応フォーマット
      return NextResponse.json({
        success: true,
        audio: audioData.data,
        mimeType: audioData.mimeType || "audio/mp3",
      });
    }

    // Audio出力がない場合はテキストを返す
    return NextResponse.json({
      success: false,
      error: "Audio generation not available",
      fallbackText: response.text(),
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "TTS failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Gemini TTS API",
    usage: "POST with { text: 'テキスト', voice: 'Kore' }",
    voices: ["Puck", "Charon", "Kore", "Fenrir", "Aoede"],
  });
}
