/**
 * Voice Provider Factory
 * Unified interface for voice synthesis and recognition
 */

import type {
  VoiceProvider,
  VoiceProviderConfig,
  SpeechRecognitionProvider,
} from '@/types/voice';
import { VoiceSynthesisError } from '@/types/voice';
import { ElevenLabsProvider } from './elevenlabs';
import {
  WebSpeechSynthesisProvider,
  WebSpeechRecognitionProvider,
  isSpeechSynthesisSupported,
  isSpeechRecognitionSupported,
} from './speech';

/**
 * Create a voice synthesis provider
 */
export function createVoiceProvider(
  config: VoiceProviderConfig
): VoiceProvider {
  switch (config.provider) {
    case 'elevenlabs':
      return new ElevenLabsProvider(config);

    case 'web-speech':
      if (!isSpeechSynthesisSupported()) {
        throw new VoiceSynthesisError(
          'Web Speech API is not supported in this browser',
          'NOT_SUPPORTED'
        );
      }
      return new WebSpeechSynthesisProvider();

    default:
      throw new VoiceSynthesisError(
        `Unknown provider: ${config.provider}`,
        'INVALID_PROVIDER'
      );
  }
}

/**
 * Create a speech recognition provider
 */
export function createSpeechRecognitionProvider(): SpeechRecognitionProvider {
  if (!isSpeechRecognitionSupported()) {
    throw new Error('Web Speech Recognition is not supported in this browser');
  }
  return new WebSpeechRecognitionProvider();
}

/**
 * Get default voice provider based on environment
 */
export function getDefaultVoiceProvider(): VoiceProviderConfig {
  // Server-side or ElevenLabs API key available
  if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
    return {
      provider: 'elevenlabs',
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
      defaultVoiceId: process.env.NEXT_PUBLIC_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Default ElevenLabs voice
    };
  }

  // Client-side fallback to Web Speech API
  if (isSpeechSynthesisSupported()) {
    return {
      provider: 'web-speech',
    };
  }

  throw new VoiceSynthesisError(
    'No voice provider available',
    'NO_PROVIDER'
  );
}

/**
 * Check if voice features are available
 */
export function isVoiceAvailable(): boolean {
  return (
    typeof window === 'undefined' ||
    isSpeechSynthesisSupported() ||
    !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  );
}

export function isSpeechRecognitionAvailable(): boolean {
  return isSpeechRecognitionSupported();
}

// Re-export types and classes
export type {
  Voice,
  VoiceProvider,
  VoiceSynthesisOptions,
  SpeechRecognitionProvider,
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
  VoiceProviderConfig,
} from '@/types/voice';

export {
  VoiceSynthesisError,
  SpeechRecognitionError,
} from '@/types/voice';

export {
  ElevenLabsProvider,
  createElevenLabsProvider,
} from './elevenlabs';

export {
  WebSpeechSynthesisProvider,
  WebSpeechRecognitionProvider,
  createWebSpeechSynthesisProvider,
  createWebSpeechRecognitionProvider,
  isSpeechSynthesisSupported,
  isSpeechRecognitionSupported,
} from './speech';
