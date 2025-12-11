/**
 * Voice API Types
 * Type definitions for voice synthesis and recognition
 */

/**
 * Voice metadata
 */
export interface Voice {
  /** Unique voice identifier */
  id: string;
  /** Display name */
  name: string;
  /** Language code (e.g., 'en-US', 'ja-JP') */
  language: string;
  /** Voice preview URL (optional) */
  preview_url?: string;
  /** Voice category (e.g., 'male', 'female', 'neutral') */
  category?: string;
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Voice synthesis options
 */
export interface VoiceSynthesisOptions {
  /** Voice ID to use */
  voiceId: string;
  /** Model ID (provider-specific) */
  modelId?: string;
  /** Stability (0.0 - 1.0) */
  stability?: number;
  /** Similarity boost (0.0 - 1.0) */
  similarityBoost?: number;
  /** Speaking rate (0.5 - 2.0) */
  rate?: number;
  /** Voice pitch (-1.0 - 1.0) */
  pitch?: number;
  /** Output format */
  outputFormat?: 'mp3' | 'pcm' | 'wav' | 'opus';
}

/**
 * Voice provider interface
 */
export interface VoiceProvider {
  /**
   * Synthesize text to speech
   * @param text - Text to convert to speech
   * @param options - Synthesis options
   * @returns Audio data as ArrayBuffer
   */
  synthesize(
    text: string,
    options: VoiceSynthesisOptions
  ): Promise<ArrayBuffer>;

  /**
   * Get available voices
   * @returns List of available voices
   */
  getVoices(): Promise<Voice[]>;

  /**
   * Get a specific voice by ID
   * @param voiceId - Voice identifier
   * @returns Voice metadata
   */
  getVoice(voiceId: string): Promise<Voice | null>;
}

/**
 * Speech recognition result
 */
export interface SpeechRecognitionResult {
  /** Transcribed text */
  transcript: string;
  /** Confidence score (0.0 - 1.0) */
  confidence: number;
  /** Is this the final result? */
  isFinal: boolean;
  /** Alternative transcriptions */
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

/**
 * Speech recognition options
 */
export interface SpeechRecognitionOptions {
  /** Language code (e.g., 'en-US', 'ja-JP') */
  language?: string;
  /** Continuous recognition */
  continuous?: boolean;
  /** Return interim results */
  interimResults?: boolean;
  /** Maximum number of alternatives */
  maxAlternatives?: number;
}

/**
 * Speech recognition provider interface
 */
export interface SpeechRecognitionProvider {
  /**
   * Start listening for speech
   * @param options - Recognition options
   */
  start(options?: SpeechRecognitionOptions): Promise<void>;

  /**
   * Stop listening
   */
  stop(): void;

  /**
   * Event handlers
   */
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}

/**
 * Voice provider configuration
 */
export interface VoiceProviderConfig {
  /** Provider name */
  provider: 'elevenlabs' | 'openai' | 'web-speech';
  /** API key (if required) */
  apiKey?: string;
  /** Base URL (for custom endpoints) */
  baseUrl?: string;
  /** Default voice ID */
  defaultVoiceId?: string;
  /** Request timeout (ms) */
  timeout?: number;
}

/**
 * Voice synthesis error
 */
export class VoiceSynthesisError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'VoiceSynthesisError';
  }
}

/**
 * Speech recognition error
 */
export class SpeechRecognitionError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'SpeechRecognitionError';
  }
}
