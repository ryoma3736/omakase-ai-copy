# Voice AI Integration Guide

## Overview

This document describes the Voice AI integration in Omakase AI, supporting both **Text-to-Speech (TTS)** and **Speech-to-Text (STT)** capabilities.

## Features

### ✅ Text-to-Speech (TTS)
- **ElevenLabs Integration**: High-quality AI voice synthesis
- **Web Speech API**: Browser-native fallback
- **Multiple Voices**: Character-specific voice profiles
- **Streaming Audio**: Low-latency audio playback

### ✅ Speech-to-Text (STT)
- **Web Speech API**: Browser-native speech recognition
- **Real-time Transcription**: Live speech-to-text conversion
- **Interim Results**: Word-by-word transcription feedback
- **Multi-language Support**: Configurable language detection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Voice AI Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                 ┌──────────────┐          │
│  │  UI Layer    │                 │ Hook Layer   │          │
│  │──────────────│                 │──────────────│          │
│  │ VoiceButton  │────────────────▶│ useVoice     │          │
│  │ VoiceInput   │                 │ synthesis    │          │
│  └──────────────┘                 │ recognition  │          │
│                                   └──────┬───────┘          │
│                                          │                  │
│                          ┌───────────────┴──────────────┐   │
│                          ▼                              ▼   │
│                  ┌──────────────┐            ┌──────────────┐│
│                  │   Provider   │            │   Provider   ││
│                  │──────────────│            │──────────────││
│                  │ ElevenLabs   │            │ Web Speech   ││
│                  │ TTS Provider │            │ STT Provider ││
│                  └──────┬───────┘            └──────┬───────┘│
│                         │                           │        │
│                         ▼                           ▼        │
│                  ┌──────────────┐            ┌──────────────┐│
│                  │ ElevenLabs   │            │  Browser     ││
│                  │     API      │            │  Web API     ││
│                  └──────────────┘            └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Environment Setup

Add the following environment variables to `.env.local`:

```bash
# ElevenLabs API (for high-quality TTS)
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
DEFAULT_VOICE_ID="21m00Tcm4TlvDq8ikWAM"

# Public keys (for client-side access)
NEXT_PUBLIC_ELEVENLABS_API_KEY="your-elevenlabs-api-key"
NEXT_PUBLIC_DEFAULT_VOICE_ID="21m00Tcm4TlvDq8ikWAM"
```

### 2. Get ElevenLabs API Key

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Navigate to your profile settings
3. Copy your API key
4. Add it to `.env.local`

### 3. Browser Compatibility

**Web Speech API Support:**
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Firefox (limited support)

## Usage

### Basic Voice Synthesis (TTS)

```tsx
import { useVoiceSynthesis } from '@/hooks/use-voice';

function MyComponent() {
  const { speak, stop, isSpeaking, isLoading } = useVoiceSynthesis();

  const handleSpeak = async () => {
    await speak('Hello, welcome to Omakase AI!');
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={isLoading}>
        {isSpeaking ? 'Speaking...' : 'Speak'}
      </button>
      {isSpeaking && <button onClick={stop}>Stop</button>}
    </div>
  );
}
```

### Basic Speech Recognition (STT)

```tsx
import { useSpeechRecognition } from '@/hooks/use-voice';

function MyComponent() {
  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
  } = useSpeechRecognition();

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        Start Listening
      </button>
      {isListening && <button onClick={stopListening}>Stop</button>}

      <p>Final: {transcript}</p>
      <p>Interim: {interimTranscript}</p>
    </div>
  );
}
```

### Using VoiceButton Component

```tsx
import { VoiceButton } from '@/components/widget/VoiceButton';

function ChatInterface() {
  return (
    <div>
      {/* Text-to-Speech Button */}
      <VoiceButton
        mode="synthesis"
        text="Hello, how can I help you today?"
        voiceId="21m00Tcm4TlvDq8ikWAM"
        primaryColor="#6366f1"
        size="md"
      />

      {/* Speech-to-Text Button */}
      <VoiceButton
        mode="recognition"
        onTranscript={(transcript) => console.log(transcript)}
        primaryColor="#10b981"
        size="lg"
      />
    </div>
  );
}
```

### Using VoiceInput Component

```tsx
import { VoiceInput } from '@/components/widget/VoiceButton';

function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <VoiceInput
      placeholder="Search or speak..."
      value={query}
      onChange={setQuery}
      primaryColor="#6366f1"
    />
  );
}
```

## API Routes

### POST `/api/voice/synthesize`

**Request:**
```json
{
  "text": "Hello, welcome to Omakase AI!",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "stability": 0.5,
  "similarityBoost": 0.75
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Body: Audio binary data

**Error Responses:**
```json
{
  "error": "Text is required",
  "code": "VALIDATION_ERROR"
}
```

### GET `/api/voice/synthesize`

**Response:**
```json
{
  "voices": [
    {
      "id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "language": "en-US",
      "category": "premade",
      "preview_url": "https://..."
    }
  ],
  "total": 10
}
```

## Advanced Configuration

### Custom Voice Provider

```typescript
import { createVoiceProvider } from '@/lib/voice';

const provider = createVoiceProvider({
  provider: 'elevenlabs',
  apiKey: process.env.ELEVENLABS_API_KEY,
  defaultVoiceId: 'custom-voice-id',
  timeout: 30000,
});

const audioBuffer = await provider.synthesize('Hello World', {
  voiceId: 'custom-voice-id',
  stability: 0.5,
  similarityBoost: 0.75,
});
```

### Speech Recognition Options

```typescript
const { startListening } = useSpeechRecognition();

await startListening({
  language: 'en-US',      // Language code
  continuous: true,       // Keep listening
  interimResults: true,   // Show interim results
  maxAlternatives: 3,     // Number of alternatives
});
```

## Character Voice Mapping

Define character-specific voices in your agent configuration:

```typescript
const characterVoices = {
  'friendly-assistant': '21m00Tcm4TlvDq8ikWAM', // Rachel
  'professional-expert': 'pNInz6obpgDQGcFmaJgB', // Adam
  'enthusiastic-guide': 'EXAVITQu4vr4xnSDxMaL', // Bella
};

// Use in your component
<VoiceButton
  mode="synthesis"
  text={aiResponse}
  voiceId={characterVoices[agent.personality]}
/>
```

## Error Handling

```typescript
const { speak, error } = useVoiceSynthesis();

useEffect(() => {
  if (error) {
    console.error('Voice synthesis error:', error);

    // Handle specific errors
    if (error.message.includes('API key')) {
      // Show API key configuration error
    } else if (error.message.includes('timeout')) {
      // Show timeout error
    }
  }
}, [error]);
```

## Performance Optimization

### 1. Audio Caching

```typescript
// API route includes caching headers
headers: {
  'Cache-Control': 'public, max-age=31536000, immutable',
}
```

### 2. Lazy Loading

```typescript
import dynamic from 'next/dynamic';

const VoiceButton = dynamic(
  () => import('@/components/widget/VoiceButton').then(mod => mod.VoiceButton),
  { ssr: false }
);
```

### 3. Provider Selection

```typescript
import { getDefaultVoiceProvider } from '@/lib/voice';

// Automatically selects best available provider
const config = getDefaultVoiceProvider();
// Returns ElevenLabs if API key available, otherwise Web Speech API
```

## Testing

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react';
import { useVoiceSynthesis } from '@/hooks/use-voice';

test('should synthesize speech', async () => {
  const { result } = renderHook(() => useVoiceSynthesis());

  await result.current.speak('Test message');

  expect(result.current.isSpeaking).toBe(true);
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceButton } from '@/components/widget/VoiceButton';

test('VoiceButton should trigger speech synthesis', async () => {
  render(
    <VoiceButton
      mode="synthesis"
      text="Hello World"
    />
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  // Assert audio playback started
});
```

## Troubleshooting

### Issue: "Speech synthesis not supported"

**Solution:**
1. Check browser compatibility
2. Ensure HTTPS (Web Speech API requires secure context)
3. Fallback to ElevenLabs API

### Issue: "ElevenLabs API key invalid"

**Solution:**
1. Verify API key in `.env.local`
2. Check ElevenLabs account status
3. Ensure environment variables are loaded

### Issue: "Microphone permission denied"

**Solution:**
1. Check browser microphone permissions
2. Ensure HTTPS connection
3. Request permission explicitly:

```typescript
const { startListening, error } = useSpeechRecognition();

const handleListen = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await startListening();
  } catch (err) {
    console.error('Microphone access denied', err);
  }
};
```

## Pricing

### ElevenLabs

| Tier | Monthly Cost | Characters | Quality |
|------|-------------|------------|---------|
| Free | $0 | 10,000 | Standard |
| Starter | $5 | 30,000 | High |
| Creator | $22 | 100,000 | Ultra |

### Web Speech API

- **Cost**: Free
- **Quality**: Basic (browser-dependent)
- **Limitation**: Requires client-side processing

## Security Considerations

### 1. API Key Protection

```typescript
// ❌ Never expose API keys in client code
const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

// ✅ Use server-side API routes
const response = await fetch('/api/voice/synthesize', {
  method: 'POST',
  body: JSON.stringify({ text }),
});
```

### 2. Input Validation

```typescript
// Validate text length
if (text.length > 5000) {
  throw new Error('Text too long');
}

// Sanitize input
const sanitizedText = text.replace(/<script>/g, '');
```

### 3. Rate Limiting

Implement rate limiting in API routes to prevent abuse.

## Future Enhancements

- [ ] OpenAI TTS integration
- [ ] Custom voice cloning
- [ ] Voice emotion controls
- [ ] Multi-language auto-detection
- [ ] Real-time voice streaming
- [ ] Voice activity detection (VAD)

## References

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Web Speech API Specification](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
