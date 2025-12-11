"use client";

import useSWR from "swr";

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  conversationsByDay: { date: string; count: number }[];
  messagesByRole: { role: string; count: number }[];
  topAgents: { name: string; conversations: number }[];
  conversionRate: number;
  avgResponseTime: number;
}

interface AgentAnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgSessionDuration: number;
  productRecommendations: number;
  clickThroughRate: number;
  conversationsByDay: { date: string; count: number }[];
  popularProducts: { name: string; recommendations: number }[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }
  return res.json();
};

/**
 * Hook for real-time user analytics with auto-refresh
 * @param refreshInterval - Refresh interval in milliseconds (default: 30000 = 30s)
 */
export function useAnalytics(refreshInterval: number = 30000) {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    "/api/analytics",
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    analytics: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    isRealTime: refreshInterval > 0,
  };
}

/**
 * Hook for real-time agent-specific analytics
 * @param agentId - Agent ID to fetch analytics for
 * @param refreshInterval - Refresh interval in milliseconds (default: 30000 = 30s)
 */
export function useAgentAnalytics(
  agentId: string | null,
  refreshInterval: number = 30000
) {
  const { data, error, isLoading, mutate } = useSWR<AgentAnalyticsData>(
    agentId ? `/api/analytics/${agentId}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    analytics: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    isRealTime: refreshInterval > 0,
  };
}

/**
 * Hook for getting current active conversation count (more frequent updates)
 */
export function useActiveConversations(refreshInterval: number = 10000) {
  const { data, error, isLoading, mutate } = useSWR<{
    activeCount: number;
    lastUpdated: string;
  }>("/api/analytics/active", fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  return {
    activeCount: data?.activeCount ?? 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
