/**
 * Web Speech API Integration
 * Browser-native speech recognition and synthesis
 */

import type {
  Voice,
  VoiceProvider,
  VoiceSynthesisOptions,
  SpeechRecognitionProvider,
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
} from '@/types/voice';
import {
  VoiceSynthesisError,
  SpeechRecognitionError,
} from '@/types/voice';

/**
 * Check if Web Speech API is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

/**
 * Web Speech Synthesis Provider
 */
export class WebSpeechSynthesisProvider implements VoiceProvider {
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (isSpeechSynthesisSupported()) {
      this.synth = window.speechSynthesis;
    } else {
      throw new VoiceSynthesisError(
        'Web Speech API is not supported in this browser',
        'NOT_SUPPORTED'
      );
    }
  }

  /**
   * Synthesize text to speech using Web Speech API
   */
  async synthesize(
    text: string,
    options: VoiceSynthesisOptions
  ): Promise<ArrayBuffer> {
    if (!this.synth) {
      throw new VoiceSynthesisError(
        'Speech synthesis not initialized',
        'NOT_INITIALIZED'
      );
    }

    if (!text.trim()) {
      throw new VoiceSynthesisError('Text cannot be empty');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Find the requested voice
      const voices = this.synth!.getVoices();
      const voice = voices.find((v) => v.voiceURI === options.voiceId);

      if (voice) {
        utterance.voice = voice;
      }

      // Set voice parameters
      if (options.rate !== undefined) {
        utterance.rate = Math.max(0.1, Math.min(10, options.rate));
      }
      if (options.pitch !== undefined) {
        utterance.pitch = Math.max(0, Math.min(2, options.pitch + 1));
      }

      utterance.onend = () => {
        // Note: Web Speech API doesn't provide audio data directly
        // We return an empty ArrayBuffer as this is primarily for live playback
        resolve(new ArrayBuffer(0));
      };

      utterance.onerror = (event) => {
        reject(
          new VoiceSynthesisError(
            `Speech synthesis failed: ${event.error}`,
            event.error.toUpperCase()
          )
        );
      };

      this.synth!.speak(utterance);
    });
  }

  /**
   * Get available voices from Web Speech API
   */
  async getVoices(): Promise<Voice[]> {
    if (!this.synth) {
      throw new VoiceSynthesisError(
        'Speech synthesis not initialized',
        'NOT_INITIALIZED'
      );
    }

    return new Promise((resolve) => {
      const voices = this.synth!.getVoices();

      if (voices.length > 0) {
        resolve(this.mapVoices(voices));
      } else {
        // Voices might not be loaded yet
        this.synth!.onvoiceschanged = () => {
          const loadedVoices = this.synth!.getVoices();
          resolve(this.mapVoices(loadedVoices));
        };
      }
    });
  }

  /**
   * Get a specific voice by ID
   */
  async getVoice(voiceId: string): Promise<Voice | null> {
    const voices = await this.getVoices();
    return voices.find((voice) => voice.id === voiceId) || null;
  }

  /**
   * Map SpeechSynthesisVoice to Voice interface
   */
  private mapVoices(voices: SpeechSynthesisVoice[]): Voice[] {
    return voices.map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
      metadata: {
        localService: voice.localService,
        default: voice.default,
      },
    }));
  }

  /**
   * Cancel all pending speech
   */
  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

/**
 * Web Speech Recognition Provider
 */
export class WebSpeechRecognitionProvider
  implements SpeechRecognitionProvider
{
  private recognition: any = null;
  private isListening = false;

  public onResult?: (result: SpeechRecognitionResult) => void;
  public onError?: (error: Error) => void;
  public onEnd?: () => void;

  constructor() {
    if (!isSpeechRecognitionSupported()) {
      throw new SpeechRecognitionError(
        'Web Speech Recognition is not supported in this browser',
        'NOT_SUPPORTED'
      );
    }

    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognitionConstructor();
    this.setupEventHandlers();
  }

  /**
   * Start listening for speech
   */
  async start(options?: SpeechRecognitionOptions): Promise<void> {
    if (!this.recognition) {
      throw new SpeechRecognitionError(
        'Speech recognition not initialized',
        'NOT_INITIALIZED'
      );
    }

    if (this.isListening) {
      throw new SpeechRecognitionError(
        'Speech recognition is already running',
        'ALREADY_RUNNING'
      );
    }

    // Configure recognition
    this.recognition.lang = options?.language || 'en-US';
    this.recognition.continuous = options?.continuous ?? false;
    this.recognition.interimResults = options?.interimResults ?? true;
    this.recognition.maxAlternatives = options?.maxAlternatives ?? 1;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      if (error instanceof Error) {
        throw new SpeechRecognitionError(
          `Failed to start recognition: ${error.message}`,
          'START_FAILED'
        );
      }
      throw new SpeechRecognitionError('Failed to start recognition');
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort recognition
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Check if currently listening
   */
  get listening(): boolean {
    return this.isListening;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      const alternatives = Array.from(result).map((alt: any) => ({
        transcript: alt.transcript,
        confidence: alt.confidence,
      }));

      const recognitionResult: SpeechRecognitionResult = {
        transcript,
        confidence,
        isFinal: result.isFinal,
        alternatives,
      };

      this.onResult?.(recognitionResult);
    };

    this.recognition.onerror = (event: any) => {
      const error = new SpeechRecognitionError(
        `Recognition error: ${event.error}`,
        event.error.toUpperCase()
      );
      this.onError?.(error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };
  }
}

/**
 * Create Web Speech provider instances
 */
export function createWebSpeechSynthesisProvider(): VoiceProvider {
  return new WebSpeechSynthesisProvider();
}

export function createWebSpeechRecognitionProvider(): SpeechRecognitionProvider {
  return new WebSpeechRecognitionProvider();
}

/**
 * TypeScript declarations for Web Speech API
 * Note: Uses `any` to avoid conflicts with built-in DOM types
 */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
