/**
 * Widget Configuration Types and Utilities
 */

export interface WidgetTheme {
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  showBranding: boolean;
  theme?: 'light' | 'dark';
}

export interface WidgetFeatures {
  voice: boolean;
  chat: boolean;
  productRecommendations: boolean;
}

export interface WidgetAgent {
  name: string;
  avatar: string;
  greeting: string;
}

export interface WidgetConfig {
  id: string;
  agentId: string;
  theme: WidgetTheme;
  features: WidgetFeatures;
  agent: WidgetAgent;
}

export interface WidgetConfigInput {
  agentId: string;
  theme?: Partial<WidgetTheme>;
  features?: Partial<WidgetFeatures>;
  agent?: Partial<WidgetAgent>;
}

/**
 * Default widget configuration
 */
export const DEFAULT_WIDGET_CONFIG: Omit<WidgetConfig, 'id' | 'agentId'> = {
  theme: {
    primaryColor: '#6366f1',
    position: 'bottom-right',
    showBranding: true,
    theme: 'light',
  },
  features: {
    voice: false,
    chat: true,
    productRecommendations: true,
  },
  agent: {
    name: 'アシスタント',
    avatar: '',
    greeting: 'こんにちは！何かお探しですか？',
  },
};

/**
 * Generate widget embed code
 */
export function generateWidgetEmbedCode(widgetId: string, apiBase?: string): string {
  const baseUrl = apiBase || 'https://widget.omakase.ai';

  return `<script>
  (function(w,d,s,l,i){
    w['__OMAKASE_LOADER_INITIALIZED__']=true;
    w['OmakaseWidget']=i;
    w[i]=w[i]||function(){(w[i].q=w[i].q||[]).push(arguments)};
    var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s);j.async=true;
    j.src='${baseUrl}/widget/loader.js?id='+l;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','${widgetId}','omakase');
</script>`;
}

/**
 * Validate widget configuration
 */
export function validateWidgetConfig(config: Partial<WidgetConfig>): string[] {
  const errors: string[] = [];

  if (!config.agentId) {
    errors.push('agentId is required');
  }

  if (config.theme?.primaryColor && !isValidColor(config.theme.primaryColor)) {
    errors.push('Invalid primaryColor format. Use hex color (e.g., #6366f1)');
  }

  if (config.theme?.position && !['bottom-right', 'bottom-left'].includes(config.theme.position)) {
    errors.push('Invalid position. Must be "bottom-right" or "bottom-left"');
  }

  return errors;
}

/**
 * Validate hex color format
 */
function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Merge widget configuration with defaults
 */
export function mergeWidgetConfig(
  input: WidgetConfigInput,
  widgetId: string
): WidgetConfig {
  return {
    id: widgetId,
    agentId: input.agentId,
    theme: {
      ...DEFAULT_WIDGET_CONFIG.theme,
      ...input.theme,
    },
    features: {
      ...DEFAULT_WIDGET_CONFIG.features,
      ...input.features,
    },
    agent: {
      ...DEFAULT_WIDGET_CONFIG.agent,
      ...input.agent,
    },
  };
}

/**
 * Widget analytics event types
 */
export enum WidgetEvent {
  LOADED = 'widget.loaded',
  OPENED = 'widget.opened',
  CLOSED = 'widget.closed',
  MESSAGE_SENT = 'widget.message_sent',
  MESSAGE_RECEIVED = 'widget.message_received',
  PRODUCT_CLICKED = 'widget.product_clicked',
  ERROR = 'widget.error',
}

/**
 * Widget analytics event data
 */
export interface WidgetAnalyticsEvent {
  event: WidgetEvent;
  widgetId: string;
  agentId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Create analytics event
 */
export function createWidgetEvent(
  event: WidgetEvent,
  widgetId: string,
  agentId: string,
  data?: Record<string, unknown>
): WidgetAnalyticsEvent {
  return {
    event,
    widgetId,
    agentId,
    timestamp: Date.now(),
    data,
  };
}
