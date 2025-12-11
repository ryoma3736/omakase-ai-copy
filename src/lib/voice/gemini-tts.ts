/**
 * Gemini TTS (Text-to-Speech) Provider
 *
 * Gemini 2.5のTTS機能を使用した音声合成
 * 24言語対応、マルチスピーカー、表現力制御が可能
 *
 * Note: Gemini TTS APIは2025年にリリースされた新機能
 * 現時点ではexperimentalな機能のため、フォールバックとしてWeb Speech APIを併用
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

// Gemini TTS用の音声タイプ
export type GeminiVoiceType =
  | 'Puck'    // デフォルト男性
  | 'Charon'  // 男性
  | 'Kore'    // 女性
  | 'Fenrir'  // 男性（低音）
  | 'Aoede';  // 女性（高音）

export interface GeminiTTSOptions {
  voice?: GeminiVoiceType;
  languageCode?: string;
  speed?: number; // 0.5 - 2.0
  pitch?: number; // -20 to 20
}

/**
 * Gemini TTS APIを使用して音声を合成
 *
 * Note: 現在Gemini TTSは generateContent API経由でのみ利用可能
 * 直接音声バイナリを返すAPIは今後提供予定
 */
export async function synthesizeSpeech(
  text: string,
  options: GeminiTTSOptions = {}
): Promise<ArrayBuffer> {
  const {
    voice = 'Kore',
    languageCode = 'ja-JP',
  } = options;

  // Gemini 2.5 Flash with audio output
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      // @ts-ignore - experimental audio config
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
    },
  });

  try {
    const result = await model.generateContent(text);
    const response = result.response;

    // Check if audio data is available
    // @ts-ignore - experimental property
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      // @ts-ignore
      const base64Audio = response.candidates[0].content.parts[0].inlineData.data;
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }

    throw new Error('No audio data in response');
  } catch (error) {
    console.error('Gemini TTS error:', error);
    throw error;
  }
}

/**
 * Gemini TTSが利用可能かチェック
 */
export function isGeminiTTSAvailable(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

/**
 * 利用可能な音声一覧
 */
export const AVAILABLE_VOICES: { id: GeminiVoiceType; name: string; gender: string }[] = [
  { id: 'Puck', name: 'Puck', gender: 'male' },
  { id: 'Charon', name: 'Charon', gender: 'male' },
  { id: 'Kore', name: 'Kore', gender: 'female' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male' },
  { id: 'Aoede', name: 'Aoede', gender: 'female' },
];

/**
 * 言語コードから適切な音声を推奨
 */
export function getRecommendedVoice(languageCode: string): GeminiVoiceType {
  // 日本語はKore（女性）がデフォルト
  if (languageCode.startsWith('ja')) {
    return 'Kore';
  }
  // その他はPuck（男性）
  return 'Puck';
}
