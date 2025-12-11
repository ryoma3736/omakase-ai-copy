import { prisma } from "../prisma";
import {
  AnalyticsEvent,
  AnalyticsEventType,
  ConversationMetrics,
  BusinessMetrics,
  TrackingMetrics,
} from "@/types/analytics";

/**
 * Analytics Tracker for Omakase AI
 * Tracks user interactions, conversations, and business metrics
 */
export class AnalyticsTracker {
  /**
   * Track a single analytics event
   */
  async trackEvent(
    event: Omit<AnalyticsEvent, "id" | "timestamp">
  ): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          agentId: event.agentId,
          sessionId: event.sessionId,
          type: event.type,
          properties: event.properties,
          userId: event.userId,
        },
      });
    } catch (error) {
      console.error("Failed to track analytics event:", error);
      // Don't throw error to prevent disrupting user experience
    }
  }

  /**
   * Track conversation start
   */
  async trackConversationStart(metrics: TrackingMetrics): Promise<void> {
    await this.trackEvent({
      type: "conversation_start",
      agentId: metrics.agentId,
      sessionId: metrics.sessionId,
      userId: metrics.userId,
      properties: {
        conversationId: metrics.conversationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track message sent
   */
  async trackMessageSent(
    metrics: TrackingMetrics,
    role: "user" | "assistant",
    messageLength: number
  ): Promise<void> {
    await this.trackEvent({
      type: "message_sent",
      agentId: metrics.agentId,
      sessionId: metrics.sessionId,
      userId: metrics.userId,
      properties: {
        conversationId: metrics.conversationId,
        role,
        messageLength,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track product click
   */
  async trackProductClick(
    metrics: TrackingMetrics,
    productId: string,
    productName: string
  ): Promise<void> {
    await this.trackEvent({
      type: "product_clicked",
      agentId: metrics.agentId,
      sessionId: metrics.sessionId,
      userId: metrics.userId,
      properties: {
        conversationId: metrics.conversationId,
        productId,
        productName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track checkout event
   */
  async trackCheckout(
    metrics: TrackingMetrics,
    products: { id: string; name: string; price: number }[]
  ): Promise<void> {
    await this.trackEvent({
      type: "checkout",
      agentId: metrics.agentId,
      sessionId: metrics.sessionId,
      userId: metrics.userId,
      properties: {
        conversationId: metrics.conversationId,
        products,
        totalValue: products.reduce((sum, p) => sum + p.price, 0),
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track lead captured
   */
  async trackLeadCapture(
    metrics: TrackingMetrics,
    leadData: { email?: string; name?: string; phone?: string }
  ): Promise<void> {
    await this.trackEvent({
      type: "lead_captured",
      agentId: metrics.agentId,
      sessionId: metrics.sessionId,
      userId: metrics.userId,
      properties: {
        conversationId: metrics.conversationId,
        leadData,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get conversation metrics for an agent
   */
  async getMetrics(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConversationMetrics> {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate total conversations (unique sessionIds)
    const uniqueSessions = new Set(events.map((e) => e.sessionId));
    const totalConversations = uniqueSessions.size;

    // Calculate average messages per conversation
    const messageEvents = events.filter((e) => e.type === "message_sent");
    const averageMessages =
      totalConversations > 0 ? messageEvents.length / totalConversations : 0;

    // Calculate average conversation duration
    const conversationDurations: number[] = [];
    const sessionArray = Array.from(uniqueSessions);
    for (const sessionId of sessionArray) {
      const sessionEvents = events.filter((e) => e.sessionId === sessionId);
      if (sessionEvents.length > 1) {
        const start = sessionEvents[0].createdAt.getTime();
        const end = sessionEvents[sessionEvents.length - 1].createdAt.getTime();
        conversationDurations.push((end - start) / 1000); // Convert to seconds
      }
    }
    const averageDuration =
      conversationDurations.length > 0
        ? conversationDurations.reduce((a, b) => a + b, 0) /
          conversationDurations.length
        : 0;

    // Extract top questions (simplified - would need NLP for real implementation)
    const userMessages = messageEvents.filter(
      (e) => (e.properties as any).role === "user"
    );
    const questionCounts = new Map<string, number>();
    userMessages.forEach((msg) => {
      const content = (msg.properties as any).content || "";
      if (content.length < 200) {
        // Only count short messages as potential questions
        questionCounts.set(content, (questionCounts.get(content) || 0) + 1);
      }
    });
    const topQuestions = Array.from(questionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    // Sentiment distribution (placeholder - would need AI analysis)
    const sentimentDistribution = {
      positive: Math.floor(totalConversations * 0.6),
      neutral: Math.floor(totalConversations * 0.3),
      negative: Math.floor(totalConversations * 0.1),
    };

    // Calculate conversion rate
    const checkoutEvents = events.filter((e) => e.type === "checkout");
    const conversionRate =
      totalConversations > 0
        ? (checkoutEvents.length / totalConversations) * 100
        : 0;

    return {
      totalConversations,
      averageMessages,
      averageDuration,
      topQuestions,
      sentimentDistribution,
      conversionRate,
    };
  }

  /**
   * Get business metrics for an agent
   */
  async getBusinessMetrics(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics> {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Count conversions (checkouts)
    const conversions = events.filter((e) => e.type === "checkout").length;

    // Calculate total revenue
    const revenue = events
      .filter((e) => e.type === "checkout")
      .reduce((sum, e) => sum + ((e.properties as any).totalValue || 0), 0);

    // Calculate average session time
    const uniqueSessions = new Set(events.map((e) => e.sessionId));
    const sessionDurations: number[] = [];
    const sessionArray = Array.from(uniqueSessions);
    for (const sessionId of sessionArray) {
      const sessionEvents = events.filter((e) => e.sessionId === sessionId);
      if (sessionEvents.length > 1) {
        const start = sessionEvents[0].createdAt.getTime();
        const end = sessionEvents[sessionEvents.length - 1].createdAt.getTime();
        sessionDurations.push((end - start) / 1000);
      }
    }
    const averageSessionTime =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    // Calculate widget usage rate
    const widgetOpens = events.filter((e) => e.type === "widget_opened").length;
    const widgetUsageRate = widgetOpens;

    // Calculate product click rate
    const productClicks = events.filter(
      (e) => e.type === "product_clicked"
    ).length;
    const totalConversations = uniqueSessions.size;
    const productClickRate =
      totalConversations > 0
        ? (productClicks / totalConversations) * 100
        : 0;

    // Calculate lead capture rate
    const leadsCaptured = events.filter(
      (e) => e.type === "lead_captured"
    ).length;
    const leadCaptureRate =
      totalConversations > 0
        ? (leadsCaptured / totalConversations) * 100
        : 0;

    return {
      conversions,
      revenue,
      averageSessionTime,
      widgetUsageRate,
      productClickRate,
      leadCaptureRate,
    };
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<
    {
      date: string;
      conversations: number;
      messages: number;
      conversions: number;
    }[]
  > {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group events by date
    const dataByDate = new Map<
      string,
      {
        conversations: Set<string>;
        messages: number;
        conversions: number;
      }
    >();

    events.forEach((event) => {
      const dateStr = event.createdAt.toISOString().split("T")[0];
      const existing = dataByDate.get(dateStr) || {
        conversations: new Set(),
        messages: 0,
        conversions: 0,
      };

      if (event.type === "conversation_start") {
        existing.conversations.add(event.sessionId);
      } else if (event.type === "message_sent") {
        existing.messages++;
      } else if (event.type === "checkout") {
        existing.conversions++;
      }

      dataByDate.set(dateStr, existing);
    });

    // Convert to array format
    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        conversations: data.conversations.size,
        messages: data.messages,
        conversions: data.conversions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Clean up old analytics events (optional - for data retention)
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

// Export singleton instance
export const analyticsTracker = new AnalyticsTracker();
