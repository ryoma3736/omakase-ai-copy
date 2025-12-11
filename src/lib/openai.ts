import OpenAI from "openai";

// Types for chat messages
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  content: string;
  finishReason: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// OpenAI client singleton
const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
};

// Default model configuration
const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_MAX_TOKENS = 4096;

/**
 * Send a chat message to OpenAI and get a response
 */
export async function chat(
  messages: ChatMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ChatResponse> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: options?.model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options?.temperature ?? 0.7,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const choice = response.choices[0];

  return {
    content: choice?.message?.content || "",
    finishReason: choice?.finish_reason || null,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Stream chat response from OpenAI
 */
export async function* chatStream(
  messages: ChatMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const client = getClient();

  const stream = await client.chat.completions.create({
    model: options?.model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options?.temperature ?? 0.7,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Generate embeddings for text using OpenAI
 */
export async function generateEmbedding(
  text: string,
  options?: {
    model?: string;
  }
): Promise<number[]> {
  const client = getClient();

  const response = await client.embeddings.create({
    model: options?.model || "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate a single response (convenience method)
 */
export async function generateResponse(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await chat(messages, options);
  return response.content;
}
