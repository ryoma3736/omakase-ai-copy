/**
 * Chat Context Management
 *
 * Manages conversation history, token limits, and context window optimization.
 */

import { Message } from "./provider";

// Context configuration
export interface ContextConfig {
  maxMessages?: number; // Maximum number of messages to keep
  maxTokens?: number; // Estimated max tokens (rough approximation)
  preserveSystemMessage?: boolean; // Always keep system message
  summarizeOldMessages?: boolean; // Summarize old messages when limit reached
}

// Context metadata
export interface ContextMetadata {
  messageCount: number;
  estimatedTokens: number;
  oldestMessageTimestamp?: Date;
  newestMessageTimestamp?: Date;
}

// Default configuration
const DEFAULT_CONFIG: Required<ContextConfig> = {
  maxMessages: 50,
  maxTokens: 100000, // Conservative estimate for Claude
  preserveSystemMessage: true,
  summarizeOldMessages: false,
};

/**
 * Rough token estimation (4 chars ≈ 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total tokens for messages
 */
function calculateTotalTokens(messages: Message[]): number {
  return messages.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );
}

/**
 * Chat Context Manager
 */
export class ChatContext {
  private messages: Message[] = [];
  private config: Required<ContextConfig>;
  private metadata: ContextMetadata;

  constructor(config?: ContextConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metadata = {
      messageCount: 0,
      estimatedTokens: 0,
    };
  }

  /**
   * Add a message to the context
   */
  addMessage(message: Message): void {
    this.messages.push(message);
    this.updateMetadata();
    this.enforceConstraints();
  }

  /**
   * Add multiple messages
   */
  addMessages(messages: Message[]): void {
    this.messages.push(...messages);
    this.updateMetadata();
    this.enforceConstraints();
  }

  /**
   * Get all messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get messages with system prompt at the beginning
   */
  getMessagesWithSystem(systemPrompt: string): Message[] {
    const messages = this.getMessages();
    const hasSystemMessage = messages[0]?.role === "system";

    if (hasSystemMessage) {
      // Replace existing system message
      return [{ role: "system", content: systemPrompt }, ...messages.slice(1)];
    } else {
      // Add system message at the beginning
      return [{ role: "system", content: systemPrompt }, ...messages];
    }
  }

  /**
   * Get the last N messages
   */
  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  /**
   * Clear all messages except system message
   */
  clear(preserveSystem: boolean = true): void {
    if (preserveSystem) {
      const systemMessage = this.messages.find((m) => m.role === "system");
      this.messages = systemMessage ? [systemMessage] : [];
    } else {
      this.messages = [];
    }
    this.updateMetadata();
  }

  /**
   * Get context metadata
   */
  getMetadata(): ContextMetadata {
    return { ...this.metadata };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...config };
    this.enforceConstraints();
  }

  /**
   * Create a summary of old messages
   */
  private summarizeMessages(messages: Message[]): string {
    const summary = messages
      .map((msg) => {
        const rolePrefix = msg.role === "user" ? "User" : "Assistant";
        const preview =
          msg.content.length > 100
            ? msg.content.substring(0, 97) + "..."
            : msg.content;
        return `${rolePrefix}: ${preview}`;
      })
      .join("\n");

    return `[Previous conversation summary (${messages.length} messages)]\n${summary}`;
  }

  /**
   * Enforce context constraints (message limit, token limit)
   */
  private enforceConstraints(): void {
    const systemMessage = this.config.preserveSystemMessage
      ? this.messages.find((m) => m.role === "system")
      : undefined;

    let workingMessages = this.config.preserveSystemMessage
      ? this.messages.filter((m) => m.role !== "system")
      : [...this.messages];

    // Enforce message count limit
    if (workingMessages.length > this.config.maxMessages) {
      const excess = workingMessages.length - this.config.maxMessages;

      if (this.config.summarizeOldMessages && excess > 0) {
        // Summarize old messages
        const oldMessages = workingMessages.slice(0, excess);
        const summary = this.summarizeMessages(oldMessages);

        // Keep recent messages and add summary
        workingMessages = [
          { role: "system", content: summary },
          ...workingMessages.slice(excess),
        ];
      } else {
        // Simply truncate old messages
        workingMessages = workingMessages.slice(-this.config.maxMessages);
      }
    }

    // Enforce token limit (approximate)
    while (calculateTotalTokens(workingMessages) > this.config.maxTokens) {
      if (workingMessages.length <= 2) break; // Keep at least 2 messages

      if (this.config.summarizeOldMessages) {
        // Summarize the oldest 5 messages
        const toSummarize = workingMessages.slice(0, 5);
        const summary = this.summarizeMessages(toSummarize);

        workingMessages = [
          { role: "system", content: summary },
          ...workingMessages.slice(5),
        ];
      } else {
        // Remove oldest message
        workingMessages.shift();
      }
    }

    // Reconstruct messages with system message at the beginning
    if (systemMessage) {
      this.messages = [systemMessage, ...workingMessages];
    } else {
      this.messages = workingMessages;
    }

    this.updateMetadata();
  }

  /**
   * Update metadata
   */
  private updateMetadata(): void {
    this.metadata = {
      messageCount: this.messages.length,
      estimatedTokens: calculateTotalTokens(this.messages),
    };
  }
}

/**
 * Create a new chat context
 */
export function createContext(config?: ContextConfig): ChatContext {
  return new ChatContext(config);
}

/**
 * Create context from existing messages
 */
export function createContextFromMessages(
  messages: Message[],
  config?: ContextConfig
): ChatContext {
  const context = new ChatContext(config);
  context.addMessages(messages);
  return context;
}

/**
 * Merge multiple contexts
 */
export function mergeContexts(
  contexts: ChatContext[],
  config?: ContextConfig
): ChatContext {
  const merged = new ChatContext(config);

  for (const context of contexts) {
    merged.addMessages(context.getMessages());
  }

  return merged;
}
