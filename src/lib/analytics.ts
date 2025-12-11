import { prisma } from "./prisma";
import { analyticsTracker } from "./analytics/tracker";
import { extractTopQuestions } from "./analytics/conversation";
import { Lead } from "@/types/analytics";

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  conversationsByDay: { date: string; count: number }[];
  messagesByRole: { role: string; count: number }[];
  topAgents: { name: string; conversations: number }[];
  conversionRate: number;
  avgResponseTime: number;
}

export interface AgentAnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgSessionDuration: number;
  productRecommendations: number;
  clickThroughRate: number;
  conversationsByDay: { date: string; count: number }[];
  popularProducts: { name: string; recommendations: number }[];
}

/**
 * Get overall analytics for a user
 */
export async function getUserAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsData> {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  // Get all agents for the user
  const agents = await prisma.agent.findMany({
    where: { userId },
    select: { id: true, name: true },
  });

  const agentIds = agents.map((a) => a.id);

  // Total conversations
  const totalConversations = await prisma.conversation.count({
    where: {
      agentId: { in: agentIds },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Total messages
  const totalMessages = await prisma.message.count({
    where: {
      conversation: { agentId: { in: agentIds } },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Messages by role
  const messagesByRole = await prisma.message.groupBy({
    by: ["role"],
    where: {
      conversation: { agentId: { in: agentIds } },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
    _count: true,
  });

  // Conversations by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conversationsByDay = await prisma.conversation.groupBy({
    by: ["createdAt"],
    where: {
      agentId: { in: agentIds },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: true,
  });

  // Group by date string
  const dayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dayMap.set(date.toISOString().split("T")[0], 0);
  }

  conversationsByDay.forEach((c) => {
    const dateStr = c.createdAt.toISOString().split("T")[0];
    dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + c._count);
  });

  const conversationsByDayArray = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top agents by conversations
  const topAgents = await prisma.conversation.groupBy({
    by: ["agentId"],
    where: {
      agentId: { in: agentIds },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
    _count: true,
    orderBy: { _count: { agentId: "desc" } },
    take: 5,
  });

  const topAgentsWithNames = topAgents.map((ta) => ({
    name: agents.find((a) => a.id === ta.agentId)?.name || "Unknown",
    conversations: ta._count,
  }));

  return {
    totalConversations,
    totalMessages,
    avgMessagesPerConversation:
      totalConversations > 0 ? totalMessages / totalConversations : 0,
    conversationsByDay: conversationsByDayArray,
    messagesByRole: messagesByRole.map((m) => ({
      role: m.role,
      count: m._count,
    })),
    topAgents: topAgentsWithNames,
    conversionRate: 0, // TODO: Implement conversion tracking
    avgResponseTime: 0, // TODO: Implement response time tracking
  };
}

/**
 * Get analytics for a specific agent
 */
export async function getAgentAnalytics(
  agentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AgentAnalyticsData> {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  // Total conversations
  const totalConversations = await prisma.conversation.count({
    where: {
      agentId,
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Total messages
  const totalMessages = await prisma.message.count({
    where: {
      conversation: { agentId },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Product recommendations
  const productRecommendations = await prisma.productRecommendation.count({
    where: {
      conversation: { agentId },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Clicked recommendations
  const clickedRecommendations = await prisma.productRecommendation.count({
    where: {
      conversation: { agentId },
      clicked: true,
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Conversations by day
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conversationsByDay = await prisma.conversation.groupBy({
    by: ["createdAt"],
    where: {
      agentId,
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: true,
  });

  const dayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dayMap.set(date.toISOString().split("T")[0], 0);
  }

  conversationsByDay.forEach((c) => {
    const dateStr = c.createdAt.toISOString().split("T")[0];
    dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + c._count);
  });

  const conversationsByDayArray = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Popular products (by recommendation count)
  const popularProducts = await prisma.productRecommendation.groupBy({
    by: ["productId"],
    where: {
      conversation: { agentId },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
    _count: true,
    orderBy: { _count: { productId: "desc" } },
    take: 5,
  });

  const productIds = popularProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const popularProductsWithNames = popularProducts.map((pp) => ({
    name: products.find((p) => p.id === pp.productId)?.name || "Unknown",
    recommendations: pp._count,
  }));

  return {
    totalConversations,
    totalMessages,
    avgSessionDuration: 0, // TODO: Calculate from conversation timestamps
    productRecommendations,
    clickThroughRate:
      productRecommendations > 0
        ? (clickedRecommendations / productRecommendations) * 100
        : 0,
    conversationsByDay: conversationsByDayArray,
    popularProducts: popularProductsWithNames,
  };
}

/**
 * Record or update daily analytics for an agent
 */
export async function recordDailyAnalytics(
  agentId: string,
  metrics: {
    conversations?: number;
    visitors?: number;
    messages?: number;
    productClicks?: number;
    conversions?: number;
  }
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.agentAnalytics.upsert({
    where: {
      agentId_date: {
        agentId,
        date: today,
      },
    },
    create: {
      agentId,
      date: today,
      totalConversations: metrics.conversations || 0,
      uniqueVisitors: metrics.visitors || 0,
      totalMessages: metrics.messages || 0,
      productClicks: metrics.productClicks || 0,
      conversions: metrics.conversions || 0,
    },
    update: {
      totalConversations: { increment: metrics.conversations || 0 },
      uniqueVisitors: { increment: metrics.visitors || 0 },
      totalMessages: { increment: metrics.messages || 0 },
      productClicks: { increment: metrics.productClicks || 0 },
      conversions: { increment: metrics.conversions || 0 },
    },
  });
}

/**
 * Create or update a lead
 */
export async function createLead(
  lead: Omit<Lead, "id" | "createdAt" | "updatedAt">
): Promise<Lead> {
  const createdLead = await prisma.lead.create({
    data: {
      agentId: lead.agentId,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      score: lead.score,
      source: lead.source,
      conversationId: lead.conversationId,
      metadata: lead.metadata || {},
    },
  });

  return {
    id: createdLead.id,
    agentId: createdLead.agentId,
    email: createdLead.email || undefined,
    name: createdLead.name || undefined,
    phone: createdLead.phone || undefined,
    score: createdLead.score,
    source: createdLead.source as "widget" | "form" | "conversation",
    conversationId: createdLead.conversationId || undefined,
    metadata: createdLead.metadata as Record<string, any>,
    createdAt: createdLead.createdAt,
    updatedAt: createdLead.updatedAt,
  };
}

/**
 * Get leads for an agent
 */
export async function getLeads(
  agentId: string,
  options?: {
    limit?: number;
    offset?: number;
    minScore?: number;
  }
): Promise<Lead[]> {
  const leads = await prisma.lead.findMany({
    where: {
      agentId,
      ...(options?.minScore && { score: { gte: options.minScore } }),
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  return leads.map((lead) => ({
    id: lead.id,
    agentId: lead.agentId,
    email: lead.email || undefined,
    name: lead.name || undefined,
    phone: lead.phone || undefined,
    score: lead.score,
    source: lead.source as "widget" | "form" | "conversation",
    conversationId: lead.conversationId || undefined,
    metadata: lead.metadata as Record<string, any>,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }));
}

/**
 * Calculate lead score based on conversation data
 */
export async function calculateLeadScore(
  conversationId: string
): Promise<number> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: true,
      recommendations: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!conversation) {
    return 0;
  }

  let score = 0;

  // Message engagement (max 30 points)
  const messageCount = conversation.messages.length;
  score += Math.min(messageCount * 3, 30);

  // Product clicks (max 25 points)
  const clickedProducts = conversation.recommendations.filter((r) => r.clicked);
  score += Math.min(clickedProducts.length * 5, 25);

  // Purchases (max 45 points)
  const purchases = conversation.recommendations.filter((r) => r.purchased);
  score += Math.min(purchases.length * 15, 45);

  return Math.min(score, 100);
}

/**
 * Update lead score
 */
export async function updateLeadScore(
  leadId: string,
  score: number
): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { score: Math.min(Math.max(score, 0), 100) }, // Clamp between 0-100
  });
}
