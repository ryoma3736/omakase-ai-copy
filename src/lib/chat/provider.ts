/**
 * Chat Provider Interface
 *
 * This module provides a unified interface for different LLM providers
 * (OpenAI, Anthropic Claude) with support for streaming responses,
 * embeddings, and provider switching.
 */

import * as Claude from "../claude";
import * as OpenAI from "../openai";

// Unified message type
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Chat options
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Chat response with usage tracking
export interface ChatResponse {
  content: string;
  finishReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  provider: ProviderType;
}

// Provider types
export type ProviderType = "claude" | "openai";

// Provider configuration
export interface ProviderConfig {
  provider: ProviderType;
  fallbackProvider?: ProviderType;
  model?: string;
  defaultOptions?: Partial<ChatOptions>;
}

/**
 * Chat Provider Interface
 */
export interface ChatProvider {
  /**
   * Send a chat message and get a response
   */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Stream chat response
   */
  chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Generate embeddings (OpenAI only)
   */
  embed?(text: string): Promise<number[]>;

  /**
   * Get provider type
   */
  getProviderType(): ProviderType;
}

/**
 * Claude Provider Implementation
 */
class ClaudeProvider implements ChatProvider {
  getProviderType(): ProviderType {
    return "claude";
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    // Separate system message from conversation
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter(
      (m) => m.role !== "system"
    ) as Claude.ChatMessage[];

    const response = await Claude.chat(
      conversationMessages,
      systemMessage?.content || "",
      {
        model: options?.model,
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      }
    );

    return {
      content: response.content,
      finishReason: response.stopReason,
      usage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.inputTokens + response.usage.outputTokens,
      },
      provider: "claude",
    };
  }

  async *chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<string, void, unknown> {
    // Separate system message from conversation
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter(
      (m) => m.role !== "system"
    ) as Claude.ChatMessage[];

    yield* Claude.chatStream(
      conversationMessages,
      systemMessage?.content || "",
      {
        model: options?.model,
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      }
    );
  }
}

/**
 * OpenAI Provider Implementation
 */
class OpenAIProvider implements ChatProvider {
  getProviderType(): ProviderType {
    return "openai";
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await OpenAI.chat(messages as OpenAI.ChatMessage[], {
      model: options?.model,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
    });

    return {
      content: response.content,
      finishReason: response.finishReason,
      usage: {
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
      provider: "openai",
    };
  }

  async *chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<string, void, unknown> {
    yield* OpenAI.chatStream(messages as OpenAI.ChatMessage[], {
      model: options?.model,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
    });
  }

  async embed(text: string): Promise<number[]> {
    return OpenAI.generateEmbedding(text);
  }
}

/**
 * Provider Factory
 */
export class ProviderFactory {
  private static providers: Map<ProviderType, ChatProvider> = new Map();

  static getProvider(type: ProviderType): ChatProvider {
    if (!this.providers.has(type)) {
      switch (type) {
        case "claude":
          this.providers.set(type, new ClaudeProvider());
          break;
        case "openai":
          this.providers.set(type, new OpenAIProvider());
          break;
        default:
          throw new Error(`Unknown provider type: ${type}`);
      }
    }
    return this.providers.get(type)!;
  }

  static clearCache() {
    this.providers.clear();
  }
}

/**
 * Multi-Provider Chat Client with Fallback
 */
export class ChatClient {
  private config: ProviderConfig;
  private primaryProvider: ChatProvider;
  private fallbackProvider?: ChatProvider;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.primaryProvider = ProviderFactory.getProvider(config.provider);

    if (config.fallbackProvider) {
      this.fallbackProvider = ProviderFactory.getProvider(
        config.fallbackProvider
      );
    }
  }

  /**
   * Send chat message with automatic fallback
   */
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };

    try {
      return await this.primaryProvider.chat(messages, mergedOptions);
    } catch (error) {
      console.error(
        `Primary provider (${this.config.provider}) failed:`,
        error
      );

      if (this.fallbackProvider) {
        console.log(
          `Attempting fallback to ${this.config.fallbackProvider}...`
        );
        return await this.fallbackProvider.chat(messages, mergedOptions);
      }

      throw error;
    }
  }

  /**
   * Stream chat message (no fallback during streaming)
   */
  async *chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<string, void, unknown> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };
    yield* this.primaryProvider.chatStream(messages, mergedOptions);
  }

  /**
   * Generate embeddings (OpenAI only)
   */
  async embed(text: string): Promise<number[]> {
    if (!this.primaryProvider.embed) {
      throw new Error(
        `Provider ${this.config.provider} does not support embeddings`
      );
    }
    return this.primaryProvider.embed(text);
  }

  /**
   * Get current provider type
   */
  getProviderType(): ProviderType {
    return this.primaryProvider.getProviderType();
  }
}

/**
 * Create a chat client with provider configuration
 */
export function createChatClient(config: ProviderConfig): ChatClient {
  return new ChatClient(config);
}

/**
 * Create default chat client (Claude with OpenAI fallback)
 */
export function createDefaultChatClient(): ChatClient {
  return new ChatClient({
    provider: "claude",
    fallbackProvider: "openai",
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 4096,
    },
  });
}
