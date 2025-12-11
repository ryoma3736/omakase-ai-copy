import Anthropic from "@anthropic-ai/sdk";

// Types for chat messages
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Claude client singleton
const getClient = () => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
};

// Default model configuration
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;

/**
 * Send a chat message to Claude and get a response
 */
export async function chat(
  messages: ChatMessage[],
  systemPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ChatResponse> {
  const client = getClient();

  const response = await client.messages.create({
    model: options?.model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const textContent = response.content.find((block) => block.type === "text");

  return {
    content: textContent?.type === "text" ? textContent.text : "",
    stopReason: response.stop_reason,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

/**
 * Stream chat response from Claude
 */
export async function* chatStream(
  messages: ChatMessage[],
  systemPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const client = getClient();

  const stream = await client.messages.stream({
    model: options?.model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Generate a single response (convenience method)
 */
export async function generateResponse(
  prompt: string,
  systemPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await chat(
    [{ role: "user", content: prompt }],
    systemPrompt,
    options
  );
  return response.content;
}
