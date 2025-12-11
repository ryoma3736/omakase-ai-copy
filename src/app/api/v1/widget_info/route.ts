/**
 * Widget Configuration API
 * GET /api/v1/widget_info?id={widgetId}
 *
 * Returns widget configuration for embedded widgets
 * This endpoint is called by the widget loader script
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WidgetConfig, DEFAULT_WIDGET_CONFIG } from '@/lib/widget/config';

// Allow CORS for widget embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get widget ID from query params
    const searchParams = request.nextUrl.searchParams;
    const widgetId = searchParams.get('id');

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // In this implementation, widgetId = agentId
    // In production, you might have a separate Widget model
    const agent = await prisma.agent.findUnique({
      where: { id: widgetId },
      select: {
        id: true,
        name: true,
        widgetConfig: true,
        isActive: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { error: 'Widget is disabled' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse stored widget config or use defaults
    let widgetConfig: WidgetConfig;

    if (agent.widgetConfig && typeof agent.widgetConfig === 'object') {
      const storedConfig = agent.widgetConfig as Record<string, unknown>;

      widgetConfig = {
        id: agent.id,
        agentId: agent.id,
        theme: {
          primaryColor: (storedConfig.primaryColor as string) || DEFAULT_WIDGET_CONFIG.theme.primaryColor,
          position: (storedConfig.position as 'bottom-right' | 'bottom-left') || DEFAULT_WIDGET_CONFIG.theme.position,
          showBranding: storedConfig.showBranding !== false, // Default to true
          theme: (storedConfig.theme as 'light' | 'dark') || DEFAULT_WIDGET_CONFIG.theme.theme,
        },
        features: {
          voice: (storedConfig.voice as boolean) || DEFAULT_WIDGET_CONFIG.features.voice,
          chat: storedConfig.chat !== false, // Default to true
          productRecommendations: storedConfig.productRecommendations !== false, // Default to true
        },
        agent: {
          name: (storedConfig.agentName as string) || agent.name || DEFAULT_WIDGET_CONFIG.agent.name,
          avatar: (storedConfig.agentAvatar as string) || DEFAULT_WIDGET_CONFIG.agent.avatar,
          greeting: (storedConfig.greeting as string) || DEFAULT_WIDGET_CONFIG.agent.greeting,
        },
      };
    } else {
      // Use defaults if no config stored
      widgetConfig = {
        id: agent.id,
        agentId: agent.id,
        ...DEFAULT_WIDGET_CONFIG,
        agent: {
          ...DEFAULT_WIDGET_CONFIG.agent,
          name: agent.name,
        },
      };
    }

    // Return widget configuration
    return NextResponse.json(widgetConfig, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
