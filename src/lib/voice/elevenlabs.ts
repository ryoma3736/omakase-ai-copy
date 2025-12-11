/**
 * ElevenLabs Voice Provider
 * Integration with ElevenLabs Text-to-Speech API
 */

import type {
  Voice,
  VoiceProvider,
  VoiceSynthesisOptions,
  VoiceProviderConfig,
} from '@/types/voice';
import { VoiceSynthesisError } from '@/types/voice';

/**
 * ElevenLabs API response types
 */
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

/**
 * ElevenLabs Voice Provider
 */
export class ElevenLabsProvider implements VoiceProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;

  constructor(config: VoiceProviderConfig) {
    if (!config.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.elevenlabs.io/v1';
    this.defaultModel = 'eleven_multilingual_v2';
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Synthesize text to speech using ElevenLabs API
   */
  async synthesize(
    text: string,
    options: VoiceSynthesisOptions
  ): Promise<ArrayBuffer> {
    if (!text.trim()) {
      throw new VoiceSynthesisError('Text cannot be empty');
    }

    const voiceId = options.voiceId;
    const modelId = options.modelId || this.defaultModel;

    const url = `${this.baseUrl}/text-to-speech/${voiceId}/stream`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: options.stability ?? 0.5,
            similarity_boost: options.similarityBoost ?? 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new VoiceSynthesisError(
          `ElevenLabs API error: ${errorText}`,
          'API_ERROR',
          response.status
        );
      }

      const audioBuffer = await response.arrayBuffer();

      if (audioBuffer.byteLength === 0) {
        throw new VoiceSynthesisError(
          'Received empty audio buffer',
          'EMPTY_RESPONSE'
        );
      }

      return audioBuffer;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof VoiceSynthesisError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new VoiceSynthesisError(
            'Request timeout',
            'TIMEOUT',
            408
          );
        }

        throw new VoiceSynthesisError(
          `Failed to synthesize speech: ${error.message}`,
          'NETWORK_ERROR'
        );
      }

      throw new VoiceSynthesisError('Unknown error occurred');
    }
  }

  /**
   * Get all available voices from ElevenLabs
   */
  async getVoices(): Promise<Voice[]> {
    const url = `${this.baseUrl}/voices`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new VoiceSynthesisError(
          `Failed to fetch voices: ${errorText}`,
          'API_ERROR',
          response.status
        );
      }

      const data: ElevenLabsVoicesResponse = await response.json();

      return data.voices.map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        language: voice.labels?.language || 'en-US',
        category: voice.category,
        preview_url: voice.preview_url,
        metadata: {
          labels: voice.labels,
        },
      }));
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof VoiceSynthesisError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new VoiceSynthesisError(
            'Request timeout',
            'TIMEOUT',
            408
          );
        }

        throw new VoiceSynthesisError(
          `Failed to fetch voices: ${error.message}`,
          'NETWORK_ERROR'
        );
      }

      throw new VoiceSynthesisError('Unknown error occurred');
    }
  }

  /**
   * Get a specific voice by ID
   */
  async getVoice(voiceId: string): Promise<Voice | null> {
    const voices = await this.getVoices();
    return voices.find((voice) => voice.id === voiceId) || null;
  }
}

/**
 * Create ElevenLabs provider instance
 */
export function createElevenLabsProvider(
  config: Omit<VoiceProviderConfig, 'provider'>
): VoiceProvider {
  return new ElevenLabsProvider({
    ...config,
    provider: 'elevenlabs',
  });
}
