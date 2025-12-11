# Chat AI/LLM Integration Documentation

## Overview

This document describes the LLM integration system that provides unified access to multiple AI providers (OpenAI and Anthropic Claude) with features like streaming responses, context management, persona configuration, and automatic fallback.

## Features

### 1. Multi-Provider Support

- **OpenAI GPT-4/GPT-4o**: Industry-leading language models with broad capabilities
- **Anthropic Claude Sonnet 4**: Advanced reasoning and safety-focused AI
- **Automatic Fallback**: Seamlessly switches to backup provider on failure
- **Provider Selection**: Client can choose preferred provider per request

### 2. Streaming Responses

Real-time token streaming for improved user experience:
- Server-Sent Events (SSE) for efficient streaming
- Chunk-by-chunk delivery
- Progress indicators
- Error handling during streams

### 3. Context Management

Intelligent conversation history management:
- **Message Limits**: Configurable max message count (default: 50)
- **Token Limits**: Automatic truncation at token thresholds
- **Context Summarization**: Optionally summarize old messages
- **System Message Preservation**: Keep system prompts intact

### 4. Persona System

Configure AI agent personality and behavior:
- **Preset Personas**: Customer support, sales, technical expert, etc.
- **Custom Personas**: Define your own tone, style, and guidelines
- **Dynamic System Prompts**: Generate contextual instructions
- **Communication Preferences**: Control emojis, formatting, examples

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chat API Endpoint                     │
│                  /api/chat (route.ts)                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Chat Client Layer                      │
│  ┌──────────────────┐     ┌──────────────────┐          │
│  │  Primary Provider│────▶│ Fallback Provider│          │
│  │   (e.g. Claude)  │     │   (e.g. OpenAI)  │          │
│  └──────────────────┘     └──────────────────┘          │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐            ┌─────────────┐
│ Context │            │   Persona   │
│ Manager │            │   Manager   │
└─────────┘            └─────────────┘
```

## Installation

### 1. Install Dependencies

```bash
npm install openai
# @anthropic-ai/sdk is already installed
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# AI Provider APIs
CLAUDE_API_KEY="your-claude-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

## Usage

### Basic Chat Request

```typescript
// Client-side
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'agent-123',
    message: 'Hello, I need help with my order',
    provider: 'claude', // or 'openai'
  }),
});

// Process Server-Sent Events
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      if (data.type === 'metadata') {
        console.log('Conversation ID:', data.conversationId);
        console.log('Provider:', data.provider);
      } else if (data.type === 'message') {
        console.log('Chunk:', data.content);
      } else if (data.type === 'done') {
        console.log('Full response:', data.fullContent);
      }
    }
  }
}
```

### Direct Provider Usage

#### OpenAI

```typescript
import * as OpenAI from '@/lib/openai';

// Simple response
const response = await OpenAI.generateResponse(
  'What is the capital of France?',
  'You are a helpful geography assistant.'
);

// Streaming
for await (const chunk of OpenAI.chatStream([
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Tell me a story' }
])) {
  process.stdout.write(chunk);
}

// Embeddings
const embedding = await OpenAI.generateEmbedding('Hello world');
console.log(embedding.length); // 1536 dimensions
```

#### Claude

```typescript
import * as Claude from '@/lib/claude';

// Simple response
const response = await Claude.chat(
  [{ role: 'user', content: 'Hello!' }],
  'You are a friendly assistant'
);

// Streaming
for await (const chunk of Claude.chatStream(
  [{ role: 'user', content: 'Explain quantum computing' }],
  'You are a physics professor'
)) {
  process.stdout.write(chunk);
}
```

### Unified Chat Client

```typescript
import { createChatClient } from '@/lib/chat';

// Create client with fallback
const chatClient = createChatClient({
  provider: 'claude',
  fallbackProvider: 'openai',
  defaultOptions: {
    temperature: 0.7,
    maxTokens: 4096,
  },
});

// Chat with automatic fallback
const response = await chatClient.chat([
  { role: 'system', content: 'You are helpful' },
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);
console.log(response.provider); // 'claude' or 'openai'
console.log(response.usage);
```

### Context Management

```typescript
import { createContext } from '@/lib/chat';

// Create context with configuration
const context = createContext({
  maxMessages: 50,
  maxTokens: 100000,
  preserveSystemMessage: true,
  summarizeOldMessages: true,
});

// Add messages
context.addMessage({
  role: 'user',
  content: 'Hello, I need help',
});

context.addMessage({
  role: 'assistant',
  content: 'Of course! How can I assist you?',
});

// Get messages with system prompt
const messages = context.getMessagesWithSystem(
  'You are a customer support agent'
);

// Get metadata
const metadata = context.getMetadata();
console.log('Message count:', metadata.messageCount);
console.log('Estimated tokens:', metadata.estimatedTokens);
```

### Persona Configuration

```typescript
import { createPersona, PRESET_PERSONAS } from '@/lib/chat';

// Use preset persona
const persona = createPersona('customer-support');

// Generate system prompt
const systemPrompt = persona.generateSystemPrompt(
  'Additional context: Our return policy is 30 days.'
);

// Get greeting
const greeting = persona.getGreeting();
console.log(greeting); // "Hello! I'm here to help you today. How can I assist you?"

// Custom persona
import { createCustomPersona } from '@/lib/chat';

const customPersona = createCustomPersona({
  name: 'Tech Guru',
  role: 'Technical expert',
  tone: 'enthusiastic',
  style: 'detailed',
  communication: {
    useEmojis: true,
    provideStepByStep: true,
  },
  customInstructions: 'Always provide code examples when relevant.',
});
```

## Configuration Options

### Provider Options

```typescript
interface ProviderConfig {
  provider: 'claude' | 'openai';
  fallbackProvider?: 'claude' | 'openai';
  model?: string; // Override default model
  defaultOptions?: {
    temperature?: number; // 0-1, default 0.7
    maxTokens?: number; // Max response length
    stream?: boolean; // Enable streaming
  };
}
```

### Context Options

```typescript
interface ContextConfig {
  maxMessages?: number; // Default: 50
  maxTokens?: number; // Default: 100000
  preserveSystemMessage?: boolean; // Default: true
  summarizeOldMessages?: boolean; // Default: false
}
```

### Persona Options

```typescript
interface PersonaConfig {
  name?: string;
  role?: string;
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic' | 'empathetic' | 'authoritative' | 'playful' | 'formal';
  style: 'concise' | 'detailed' | 'conversational' | 'technical' | 'storytelling' | 'educational';
  expertise?: 'general' | 'e-commerce' | 'customer-support' | 'technical-support' | 'sales' | 'education' | 'healthcare' | 'finance';
  communication?: {
    useEmojis?: boolean;
    useBulletPoints?: boolean;
    includeExamples?: boolean;
    askClarifyingQuestions?: boolean;
    provideStepByStep?: boolean;
  };
  customInstructions?: string;
  greeting?: string;
  responseGuidelines?: string[];
  prohibitedTopics?: string[];
  languages?: string[];
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createChatClient, createContext, createPersona } from '@/lib/chat';

describe('Chat Provider', () => {
  it('should create Claude client', () => {
    const client = createChatClient({ provider: 'claude' });
    expect(client.getProviderType()).toBe('claude');
  });

  it('should manage context correctly', () => {
    const context = createContext({ maxMessages: 5 });
    for (let i = 0; i < 10; i++) {
      context.addMessage({ role: 'user', content: `Message ${i}` });
    }
    expect(context.getMessages().length).toBeLessThanOrEqual(6); // 5 + system
  });

  it('should generate persona system prompts', () => {
    const persona = createPersona('customer-support');
    const prompt = persona.generateSystemPrompt();
    expect(prompt).toContain('customer service');
  });
});
```

## Performance Considerations

### Token Usage Tracking

Monitor token consumption to manage costs:

```typescript
const response = await chatClient.chat(messages);
console.log('Input tokens:', response.usage.inputTokens);
console.log('Output tokens:', response.usage.outputTokens);
console.log('Total tokens:', response.usage.totalTokens);
```

### Cost Comparison (Approximate)

| Provider | Model | Input Cost | Output Cost |
|----------|-------|------------|-------------|
| OpenAI | GPT-4o | $2.50 / 1M | $10.00 / 1M |
| Anthropic | Claude Sonnet 4 | $3.00 / 1M | $15.00 / 1M |

### Optimization Tips

1. **Use Context Limits**: Prevent excessive token usage
2. **Choose Appropriate Models**: Use GPT-4o-mini for simple tasks
3. **Cache System Prompts**: Reuse prompt templates
4. **Implement Rate Limiting**: Prevent abuse
5. **Monitor Usage**: Track costs per user/agent

## Error Handling

```typescript
try {
  const response = await chatClient.chat(messages);
  console.log(response.content);
} catch (error) {
  if (error.message.includes('rate_limit')) {
    // Handle rate limiting
    console.error('Rate limit exceeded, try again later');
  } else if (error.message.includes('API key')) {
    // Handle authentication error
    console.error('Invalid API key');
  } else {
    // Generic error
    console.error('Chat error:', error);
  }
}
```

## Best Practices

1. **Always Use Fallback**: Configure fallback provider for reliability
2. **Manage Context**: Use context manager to prevent token bloat
3. **Validate Input**: Sanitize user messages before sending to API
4. **Stream When Possible**: Improve perceived performance
5. **Monitor Costs**: Track token usage and set alerts
6. **Use Personas**: Consistent behavior across conversations
7. **Handle Errors Gracefully**: Provide fallback responses
8. **Test Thoroughly**: Test with both providers

## Troubleshooting

### Issue: "API key not set"

**Solution**: Ensure environment variables are configured:
```bash
# Check .env.local
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

### Issue: Streaming stops abruptly

**Solution**: Check for network timeouts and implement proper error handling in stream processing.

### Issue: High token usage

**Solution**:
- Reduce `maxTokens` in options
- Use context summarization
- Implement stricter message limits

### Issue: Fallback not working

**Solution**: Verify both API keys are valid and providers are properly initialized.

## Future Enhancements

- [ ] Support for more providers (Google Gemini, Cohere)
- [ ] Conversation branching and replay
- [ ] Advanced caching strategies
- [ ] Multi-modal support (images, files)
- [ ] Function calling integration
- [ ] A/B testing framework for providers
- [ ] Real-time usage analytics dashboard

## Related Documentation

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com)
- [Server-Sent Events (SSE) Guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## Support

For issues and questions:
- GitHub Issues: [omakase-ai/issues](https://github.com/yourusername/omakase-ai/issues)
- Documentation: [docs/](../docs/)
