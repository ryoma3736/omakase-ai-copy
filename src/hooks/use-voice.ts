/**
 * useVoice Hook
 * React hook for voice synthesis and speech recognition
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Voice,
  SpeechRecognitionResult,
  SpeechRecognitionOptions,
} from '@/types/voice';
import {
  createWebSpeechRecognitionProvider,
  isSpeechRecognitionAvailable,
} from '@/lib/voice';

/**
 * Voice synthesis hook
 */
export interface UseVoiceSynthesis {
  /** Synthesize text to speech */
  speak: (text: string, voiceId?: string) => Promise<void>;
  /** Stop current speech */
  stop: () => void;
  /** Is currently speaking */
  isSpeaking: boolean;
  /** Available voices */
  voices: Voice[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Speech recognition hook
 */
export interface UseSpeechRecognition {
  /** Start listening */
  startListening: () => Promise<void>;
  /** Stop listening */
  stopListening: () => void;
  /** Is currently listening */
  isListening: boolean;
  /** Transcribed text */
  transcript: string;
  /** Interim transcript */
  interimTranscript: string;
  /** Is recognition supported */
  isSupported: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook for voice synthesis
 */
export function useVoiceSynthesis(): UseVoiceSynthesis {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load available voices
  useEffect(() => {
    async function loadVoices() {
      try {
        const response = await fetch('/api/voice/synthesize');
        if (!response.ok) {
          throw new Error('Failed to load voices');
        }
        const data = await response.json();
        setVoices(data.voices || []);
      } catch (err) {
        console.error('Failed to load voices:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    }

    loadVoices();
  }, []);

  const speak = useCallback(
    async (text: string, voiceId?: string) => {
      if (!text.trim()) {
        setError(new Error('Text cannot be empty'));
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Call API to synthesize speech
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voiceId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to synthesize speech');
        }

        // Get audio blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setError(new Error('Failed to play audio'));
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      } catch (err) {
        console.error('Speech synthesis error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsSpeaking(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    isLoading,
    error,
  };
}

/**
 * Hook for speech recognition
 */
export function useSpeechRecognition(
  options?: SpeechRecognitionOptions
): UseSpeechRecognition {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [isSupported] = useState(isSpeechRecognitionAvailable());

  const recognitionRef = useRef<ReturnType<
    typeof createWebSpeechRecognitionProvider
  > | null>(null);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) {
      setError(
        new Error('Speech recognition is not supported in this browser')
      );
      return;
    }

    try {
      const recognition = createWebSpeechRecognitionProvider();

      recognition.onResult = (result: SpeechRecognitionResult) => {
        if (result.isFinal) {
          setTranscript((prev) => prev + ' ' + result.transcript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(result.transcript);
        }
      };

      recognition.onError = (err: Error) => {
        console.error('Speech recognition error:', err);
        setError(err);
        setIsListening(false);
      };

      recognition.onEnd = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError(new Error('Speech recognition not initialized'));
      return;
    }

    try {
      setError(null);
      await recognitionRef.current.start(options);
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
  };
}

/**
 * Combined voice hook (synthesis + recognition)
 */
export function useVoice() {
  const synthesis = useVoiceSynthesis();
  const recognition = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  });

  return {
    ...synthesis,
    ...recognition,
  };
}
