/**
 * Google Gemini API Integration
 *
 * Provides chat, embedding, and TTS capabilities using Gemini API
 * Cost-effective alternative to OpenAI/Anthropic
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

// Model configurations
export const MODELS = {
  chat: "gemini-2.0-flash-exp", // Fast, free tier
  chatPro: "gemini-1.5-pro", // Higher quality
  embedding: "embedding-001",
} as const;

// Message types
export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiChatResponse {
  content: string;
  finishReason: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Convert standard messages to Gemini format
 */
function toGeminiMessages(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): { history: ChatMessage[]; systemInstruction?: string; lastMessage: string } {
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  // Get the last user message
  const lastUserMessage = conversationMessages.pop();

  // Convert remaining messages to Gemini history format
  const history: ChatMessage[] = conversationMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return {
    history,
    systemInstruction: systemMessage?.content,
    lastMessage: lastUserMessage?.content || "",
  };
}

/**
 * Send a chat message to Gemini
 */
export async function chat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: GeminiChatOptions = {}
): Promise<GeminiChatResponse> {
  const { history, systemInstruction, lastMessage } = toGeminiMessages(messages);

  const model = genAI.getGenerativeModel({
    model: options.model || MODELS.chat,
    systemInstruction,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  });

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(lastMessage);
  const response = result.response;

  const text = response.text();
  const usageMetadata = response.usageMetadata;

  return {
    content: text,
    finishReason: response.candidates?.[0]?.finishReason || null,
    usage: {
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Stream chat response from Gemini
 */
export async function* chatStream(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: GeminiChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const { history, systemInstruction, lastMessage } = toGeminiMessages(messages);

  const model = genAI.getGenerativeModel({
    model: options.model || MODELS.chat,
    systemInstruction,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  });

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessageStream(lastMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

/**
 * Generate text embeddings using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: MODELS.embedding });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: MODELS.embedding });

  const embeddings: number[][] = [];
  for (const text of texts) {
    const result = await model.embedContent(text);
    embeddings.push(result.embedding.values);
  }

  return embeddings;
}

/**
 * Check if Gemini API is configured
 */
export function isConfigured(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
