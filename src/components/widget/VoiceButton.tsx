/**
 * VoiceButton Component
 * UI component for voice synthesis and speech recognition
 */

'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceSynthesis, useSpeechRecognition } from '@/hooks/use-voice';

export interface VoiceButtonProps {
  /** Mode: 'synthesis' (TTS) or 'recognition' (STT) */
  mode?: 'synthesis' | 'recognition';
  /** Text to speak (synthesis mode) */
  text?: string;
  /** Voice ID to use */
  voiceId?: string;
  /** Callback when speech is recognized (recognition mode) */
  onTranscript?: (transcript: string) => void;
  /** Primary color */
  primaryColor?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Voice Button Component
 */
export function VoiceButton({
  mode = 'synthesis',
  text,
  voiceId,
  onTranscript,
  primaryColor = '#6366f1',
  size = 'md',
  className,
  disabled = false,
}: VoiceButtonProps) {
  const { speak, stop, isSpeaking, isLoading: synthLoading, error: synthError } = useVoiceSynthesis();
  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error: recogError,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  });

  const [isHovered, setIsHovered] = useState(false);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Handle click
  const handleClick = async () => {
    if (disabled) return;

    if (mode === 'synthesis') {
      if (isSpeaking) {
        stop();
      } else if (text) {
        await speak(text, voiceId);
      }
    } else if (mode === 'recognition') {
      if (isListening) {
        stopListening();
      } else {
        await startListening();
      }
    }
  };

  // Get icon based on mode and state
  const getIcon = () => {
    if (mode === 'synthesis') {
      if (synthLoading) {
        return <Loader2 className={cn(iconSizeClasses[size], 'animate-spin')} />;
      }
      return isSpeaking ? (
        <VolumeX className={iconSizeClasses[size]} />
      ) : (
        <Volume2 className={iconSizeClasses[size]} />
      );
    } else {
      if (isListening) {
        return <MicOff className={cn(iconSizeClasses[size], 'animate-pulse')} />;
      }
      return <Mic className={iconSizeClasses[size]} />;
    }
  };

  // Get button state
  const isActive = mode === 'synthesis' ? isSpeaking : isListening;
  const hasError = synthError || recogError;
  const isDisabled =
    disabled ||
    (mode === 'synthesis' && !text) ||
    (mode === 'recognition' && !isSupported);

  // Get aria label
  const getAriaLabel = () => {
    if (mode === 'synthesis') {
      return isSpeaking ? 'Stop speaking' : 'Start speaking';
    } else {
      return isListening ? 'Stop listening' : 'Start listening';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isDisabled}
        className={cn(
          'rounded-full shadow-md transition-all duration-200 ease-in-out',
          'hover:shadow-lg hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          sizeClasses[size],
          hasError && 'ring-2 ring-red-500'
        )}
        style={{
          backgroundColor: isActive
            ? primaryColor
            : isDisabled
            ? '#9ca3af'
            : primaryColor,
          boxShadow: isHovered && !isDisabled
            ? `0 10px 25px -5px ${primaryColor}40`
            : `0 4px 12px -2px ${primaryColor}30`,
        }}
        aria-label={getAriaLabel()}
      >
        <div className="relative w-full h-full flex items-center justify-center text-white">
          {getIcon()}
        </div>

        {/* Active indicator */}
        {isActive && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: primaryColor }}
          />
        )}
      </button>

      {/* Transcript display (recognition mode) */}
      {mode === 'recognition' && (isListening || transcript || interimTranscript) && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {transcript && <span className="font-medium">{transcript}</span>}
            {interimTranscript && (
              <span className="text-gray-500 dark:text-gray-400 italic">
                {' '}
                {interimTranscript}
              </span>
            )}
            {isListening && !transcript && !interimTranscript && (
              <span className="text-gray-400">Listening...</span>
            )}
          </p>
        </div>
      )}

      {/* Error display */}
      {hasError && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg p-2 min-w-[200px] max-w-[300px]">
          <p className="text-xs text-red-600 dark:text-red-400">
            {(synthError || recogError)?.message}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Voice Input Component
 * Integrated voice input with transcript handling
 */
export interface VoiceInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string;
  /** On change callback */
  onChange?: (value: string) => void;
  /** Primary color */
  primaryColor?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function VoiceInput({
  placeholder = 'Click to speak...',
  value = '',
  onChange,
  primaryColor = '#6366f1',
  disabled = false,
}: VoiceInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleTranscript = (transcript: string) => {
    const newValue = localValue + (localValue ? ' ' : '') + transcript;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className="relative flex items-center gap-2">
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <VoiceButton
        mode="recognition"
        onTranscript={handleTranscript}
        primaryColor={primaryColor}
        size="md"
        disabled={disabled}
      />
    </div>
  );
}
