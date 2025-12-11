/**
 * Voice Synthesis API Route
 * Endpoint for text-to-speech conversion using ElevenLabs
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createVoiceProvider } from '@/lib/voice';
import type { VoiceSynthesisOptions } from '@/types/voice';
import { VoiceSynthesisError } from '@/types/voice';

/**
 * Request body schema
 */
interface SynthesizeRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  provider?: 'elevenlabs' | 'web-speech';
}

/**
 * POST /api/voice/synthesize
 * Synthesize text to speech
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SynthesizeRequest = await request.json();

    // Validate input
    if (!body.text || !body.text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (body.text.length > 5000) {
      return NextResponse.json(
        { error: 'Text is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Determine provider
    const provider = body.provider || 'elevenlabs';

    // Create voice provider
    const voiceProvider = createVoiceProvider({
      provider,
      apiKey: process.env.ELEVENLABS_API_KEY,
      defaultVoiceId: process.env.DEFAULT_VOICE_ID,
    });

    // Prepare synthesis options
    const options: VoiceSynthesisOptions = {
      voiceId:
        body.voiceId ||
        process.env.DEFAULT_VOICE_ID ||
        '21m00Tcm4TlvDq8ikWAM', // ElevenLabs default voice
      modelId: body.modelId,
      stability: body.stability,
      similarityBoost: body.similarityBoost,
    };

    // Synthesize speech
    const audioBuffer = await voiceProvider.synthesize(body.text, options);

    // Return audio response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Voice synthesis error:', error);

    if (error instanceof VoiceSynthesisError) {
      const statusCode = error.statusCode || 500;
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: statusCode }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to synthesize speech',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/synthesize
 * Get supported voices
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create voice provider
    const voiceProvider = createVoiceProvider({
      provider: 'elevenlabs',
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    // Get available voices
    const voices = await voiceProvider.getVoices();

    return NextResponse.json({
      voices,
      total: voices.length,
    });
  } catch (error) {
    console.error('Failed to fetch voices:', error);

    if (error instanceof VoiceSynthesisError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to fetch voices',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
