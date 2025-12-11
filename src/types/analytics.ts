// Analytics Types for Omakase AI

export type AnalyticsEventType =
  | "conversation_start"
  | "message_sent"
  | "product_clicked"
  | "checkout"
  | "lead_captured"
  | "widget_opened"
  | "widget_closed";

export interface AnalyticsEvent {
  id?: string;
  type: AnalyticsEventType;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  agentId: string;
  timestamp?: Date;
}

export interface ConversationMetrics {
  totalConversations: number;
  averageMessages: number;
  averageDuration: number;
  topQuestions: { question: string; count: number }[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  conversionRate: number;
}

export interface ConversationAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  summary: string;
  intent: string;
  suggestedFollowUp: string;
}

export interface Lead {
  id?: string;
  agentId: string;
  email?: string;
  name?: string;
  phone?: string;
  score: number;
  source: "widget" | "form" | "conversation";
  conversationId?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TopQuestion {
  question: string;
  count: number;
  category?: string;
}

export interface TrackingMetrics {
  sessionId: string;
  agentId: string;
  conversationId?: string;
  userId?: string;
}

export interface BusinessMetrics {
  conversions: number;
  revenue: number;
  averageSessionTime: number;
  widgetUsageRate: number;
  productClickRate: number;
  leadCaptureRate: number;
}

export interface AnalyticsDashboardData {
  overview: {
    totalConversations: number;
    totalMessages: number;
    conversionRate: number;
    leadsCaptured: number;
  };
  conversationMetrics: ConversationMetrics;
  businessMetrics: BusinessMetrics;
  timeSeriesData: {
    date: string;
    conversations: number;
    messages: number;
    conversions: number;
  }[];
  topQuestions: TopQuestion[];
  leads: Lead[];
}
