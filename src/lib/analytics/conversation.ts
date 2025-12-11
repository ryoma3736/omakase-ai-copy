import { prisma } from "../prisma";
import Anthropic from "@anthropic-ai/sdk";
import { ConversationAnalysis, TopQuestion } from "@/types/analytics";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Analyze a conversation using Claude AI
 */
export async function analyzeConversation(
  conversationId: string
): Promise<ConversationAnalysis> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Format messages for Claude
  const formattedMessages = conversation.messages.map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze the following customer conversation and provide:
1. Overall sentiment (positive, neutral, or negative)
2. Main topics discussed (as a comma-separated list)
3. A brief summary (2-3 sentences)
4. Customer intent (what they were trying to achieve)
5. Suggested follow-up action

Conversation:
${formattedMessages
  .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
  .join("\n\n")}

Respond in the following JSON format:
{
  "sentiment": "positive|neutral|negative",
  "topics": ["topic1", "topic2"],
  "summary": "Brief summary here",
  "intent": "Customer's main intent",
  "suggestedFollowUp": "Suggested next action"
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse Claude's response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse Claude response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      summary: analysis.summary,
      intent: analysis.intent,
      suggestedFollowUp: analysis.suggestedFollowUp,
    };
  } catch (error) {
    console.error("Failed to analyze conversation:", error);
    // Return default analysis on error
    return {
      sentiment: "neutral",
      topics: [],
      summary: "Unable to analyze conversation",
      intent: "Unknown",
      suggestedFollowUp: "Follow up with customer",
    };
  }
}

/**
 * Extract top questions from conversations using AI clustering
 */
export async function extractTopQuestions(
  agentId: string,
  limit: number = 10
): Promise<TopQuestion[]> {
  // Get recent user messages
  const messages = await prisma.message.findMany({
    where: {
      role: "USER",
      conversation: {
        agentId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    },
    take: 500, // Limit to avoid too much processing
    orderBy: {
      createdAt: "desc",
    },
  });

  if (messages.length === 0) {
    return [];
  }

  try {
    // Use Claude to cluster similar questions
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze these customer messages and identify the top ${limit} most common questions or topics.
Group similar questions together and provide a representative question for each group along with the count.

Messages:
${messages.map((m, i) => `${i + 1}. ${m.content}`).join("\n")}

Respond in the following JSON format:
{
  "questions": [
    {"question": "Representative question", "count": 15, "category": "product"},
    ...
  ]
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse Claude response");
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.questions.slice(0, limit);
  } catch (error) {
    console.error("Failed to extract top questions:", error);
    // Fallback: return most frequent exact matches
    return extractTopQuestionsSimple(messages, limit);
  }
}

/**
 * Simple fallback method to extract top questions without AI
 */
function extractTopQuestionsSimple(
  messages: { content: string }[],
  limit: number
): TopQuestion[] {
  const questionCounts = new Map<string, number>();

  messages.forEach((msg) => {
    const content = msg.content.trim();
    // Only count messages that look like questions (end with ?, or are short)
    if (content.endsWith("?") || content.length < 100) {
      questionCounts.set(content, (questionCounts.get(content) || 0) + 1);
    }
  });

  return Array.from(questionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([question, count]) => ({
      question,
      count,
    }));
}

/**
 * Batch analyze multiple conversations
 */
export async function batchAnalyzeConversations(
  conversationIds: string[]
): Promise<Map<string, ConversationAnalysis>> {
  const results = new Map<string, ConversationAnalysis>();

  // Analyze in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < conversationIds.length; i += batchSize) {
    const batch = conversationIds.slice(i, i + batchSize);
    const analyses = await Promise.all(
      batch.map((id) =>
        analyzeConversation(id).catch((err) => {
          console.error(`Failed to analyze conversation ${id}:`, err);
          return null;
        })
      )
    );

    batch.forEach((id, index) => {
      if (analyses[index]) {
        results.set(id, analyses[index]!);
      }
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < conversationIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Get sentiment distribution for all conversations
 */
export async function getSentimentDistribution(
  agentId: string,
  startDate: Date,
  endDate: Date
): Promise<{ positive: number; neutral: number; negative: number }> {
  const conversations = await prisma.conversation.findMany({
    where: {
      agentId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
    },
  });

  if (conversations.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  // For performance, analyze a sample if there are too many conversations
  const sampleSize = Math.min(conversations.length, 50);
  const sample = conversations
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  const analyses = await batchAnalyzeConversations(sample.map((c) => c.id));

  const distribution = { positive: 0, neutral: 0, negative: 0 };
  analyses.forEach((analysis) => {
    distribution[analysis.sentiment]++;
  });

  // Extrapolate to full dataset
  const scaleFactor = conversations.length / sampleSize;
  return {
    positive: Math.round(distribution.positive * scaleFactor),
    neutral: Math.round(distribution.neutral * scaleFactor),
    negative: Math.round(distribution.negative * scaleFactor),
  };
}

/**
 * Generate conversation insights summary
 */
export async function generateConversationInsights(
  agentId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalConversations: number;
  averageSentiment: string;
  topTopics: string[];
  commonIntents: string[];
  recommendations: string[];
}> {
  const conversations = await prisma.conversation.findMany({
    where: {
      agentId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      messages: true,
    },
  });

  // Analyze a sample
  const sampleSize = Math.min(conversations.length, 30);
  const sample = conversations
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  const analyses = await batchAnalyzeConversations(sample.map((c) => c.id));

  // Aggregate insights
  const allTopics: string[] = [];
  const allIntents: string[] = [];
  const sentiments: string[] = [];

  analyses.forEach((analysis) => {
    allTopics.push(...analysis.topics);
    allIntents.push(analysis.intent);
    sentiments.push(analysis.sentiment);
  });

  // Find most common topics
  const topicCounts = new Map<string, number>();
  allTopics.forEach((topic) => {
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  });
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  // Find most common intents
  const intentCounts = new Map<string, number>();
  allIntents.forEach((intent) => {
    intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
  });
  const commonIntents = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([intent]) => intent);

  // Calculate average sentiment
  const posCount = sentiments.filter((s) => s === "positive").length;
  const negCount = sentiments.filter((s) => s === "negative").length;
  const averageSentiment =
    posCount > negCount
      ? "positive"
      : negCount > posCount
        ? "negative"
        : "neutral";

  // Generate recommendations based on data
  const recommendations: string[] = [];
  if (negCount / sentiments.length > 0.3) {
    recommendations.push(
      "Consider improving response quality - high negative sentiment detected"
    );
  }
  if (topTopics.length > 0) {
    recommendations.push(
      `Add more knowledge base content about: ${topTopics.slice(0, 3).join(", ")}`
    );
  }
  if (commonIntents.length > 0) {
    recommendations.push(
      `Optimize for common intents: ${commonIntents.slice(0, 2).join(", ")}`
    );
  }

  return {
    totalConversations: conversations.length,
    averageSentiment,
    topTopics,
    commonIntents,
    recommendations,
  };
}
