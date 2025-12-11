/**
 * Chat Client Usage Examples
 *
 * This file demonstrates how to use the unified chat client
 * with different providers, contexts, and personas.
 */

import {
  createChatClient,
  createContext,
  createPersona,
  type Message,
} from "@/lib/chat";

// Example 1: Basic Chat with Claude
async function basicClaudeChat() {
  console.log("\n=== Example 1: Basic Claude Chat ===");

  const client = createChatClient({
    provider: "claude",
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  const messages: Message[] = [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "What is the capital of Japan?" },
  ];

  const response = await client.chat(messages);
  console.log("Response:", response.content);
  console.log("Provider:", response.provider);
  console.log("Tokens used:", response.usage.totalTokens);
}

// Example 2: Chat with OpenAI
async function basicOpenAIChat() {
  console.log("\n=== Example 2: Basic OpenAI Chat ===");

  const client = createChatClient({
    provider: "openai",
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  const messages: Message[] = [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Explain machine learning in one sentence" },
  ];

  const response = await client.chat(messages);
  console.log("Response:", response.content);
  console.log("Provider:", response.provider);
  console.log("Tokens used:", response.usage.totalTokens);
}

// Example 3: Chat with Automatic Fallback
async function chatWithFallback() {
  console.log("\n=== Example 3: Chat with Fallback ===");

  const client = createChatClient({
    provider: "claude",
    fallbackProvider: "openai", // Falls back if Claude fails
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  const messages: Message[] = [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Tell me a short joke" },
  ];

  try {
    const response = await client.chat(messages);
    console.log("Response:", response.content);
    console.log("Used provider:", response.provider);
  } catch (error) {
    console.error("Both providers failed:", error);
  }
}

// Example 4: Streaming Response
async function streamingChat() {
  console.log("\n=== Example 4: Streaming Response ===");

  const client = createChatClient({
    provider: "claude",
    defaultOptions: {
      temperature: 0.8,
      maxTokens: 500,
    },
  });

  const messages: Message[] = [
    { role: "system", content: "You are a creative storyteller" },
    { role: "user", content: "Tell me a very short story about a robot" },
  ];

  console.log("Streaming response:");
  let fullResponse = "";

  for await (const chunk of client.chatStream(messages)) {
    process.stdout.write(chunk);
    fullResponse += chunk;
  }

  console.log("\n\nFull response length:", fullResponse.length);
}

// Example 5: Context Management
async function contextManagement() {
  console.log("\n=== Example 5: Context Management ===");

  const context = createContext({
    maxMessages: 10,
    maxTokens: 50000,
    preserveSystemMessage: true,
    summarizeOldMessages: false,
  });

  // Simulate a conversation
  const conversationPairs = [
    ["What is TypeScript?", "TypeScript is a typed superset of JavaScript..."],
    ["How is it different from JavaScript?", "TypeScript adds static typing..."],
    ["Should I use it?", "Yes, TypeScript helps catch errors..."],
  ];

  conversationPairs.forEach(([user, assistant]) => {
    context.addMessage({ role: "user", content: user });
    context.addMessage({ role: "assistant", content: assistant });
  });

  // Add current message
  context.addMessage({
    role: "user",
    content: "Can you summarize our conversation?",
  });

  const metadata = context.getMetadata();
  console.log("Message count:", metadata.messageCount);
  console.log("Estimated tokens:", metadata.estimatedTokens);

  // Get messages with system prompt
  const messages = context.getMessagesWithSystem(
    "You are a helpful programming tutor"
  );

  console.log("Total messages to send:", messages.length);
}

// Example 6: Using Personas
async function personaExample() {
  console.log("\n=== Example 6: Persona Configuration ===");

  // Use preset persona
  const persona = createPersona("technical-expert");

  console.log("Greeting:", persona.getGreeting());
  console.log("\nSystem Prompt:");
  console.log(persona.generateSystemPrompt());

  // Use the persona in a chat
  const client = createChatClient({ provider: "claude" });

  const messages: Message[] = [
    {
      role: "system",
      content: persona.generateSystemPrompt(
        "Our product uses React and TypeScript."
      ),
    },
    { role: "user", content: "How do I fix a TypeScript error?" },
  ];

  const response = await client.chat(messages);
  console.log("\nResponse:", response.content.substring(0, 200) + "...");
}

// Example 7: E-commerce Assistant with Product Recommendations
async function ecommerceAssistant() {
  console.log("\n=== Example 7: E-commerce Assistant ===");

  const persona = createPersona("personal-shopper");
  const client = createChatClient({
    provider: "claude",
    defaultOptions: { temperature: 0.8 },
  });

  const context = createContext({
    maxMessages: 20,
    preserveSystemMessage: true,
  });

  // Simulate product context
  const productContext = `
Available Products:
1. Laptop Pro 15" - $1299 - High-performance laptop for professionals
2. Wireless Earbuds X - $129 - Noise-canceling, 24hr battery
3. Smart Watch Ultra - $399 - Fitness tracking, health monitoring
`;

  const systemPrompt = persona.generateSystemPrompt(productContext);

  context.addMessage({
    role: "user",
    content: "I need something for work and fitness. Budget is $1500.",
  });

  const messages = context.getMessagesWithSystem(systemPrompt);
  const response = await client.chat(messages);

  console.log("Greeting:", persona.getGreeting());
  console.log("\nRecommendation:", response.content);
}

// Example 8: Cost Comparison
async function costComparison() {
  console.log("\n=== Example 8: Cost Comparison ===");

  const prompt: Message[] = [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Explain quantum computing" },
  ];

  // Test with Claude
  const claudeClient = createChatClient({ provider: "claude" });
  const claudeResponse = await claudeClient.chat(prompt);

  console.log("Claude:");
  console.log("  Input tokens:", claudeResponse.usage.inputTokens);
  console.log("  Output tokens:", claudeResponse.usage.outputTokens);
  console.log(
    "  Est. cost: $",
    (
      (claudeResponse.usage.inputTokens * 3.0) / 1_000_000 +
      (claudeResponse.usage.outputTokens * 15.0) / 1_000_000
    ).toFixed(6)
  );

  // Test with OpenAI
  const openaiClient = createChatClient({ provider: "openai" });
  const openaiResponse = await openaiClient.chat(prompt);

  console.log("\nOpenAI:");
  console.log("  Input tokens:", openaiResponse.usage.inputTokens);
  console.log("  Output tokens:", openaiResponse.usage.outputTokens);
  console.log(
    "  Est. cost: $",
    (
      (openaiResponse.usage.inputTokens * 2.5) / 1_000_000 +
      (openaiResponse.usage.outputTokens * 10.0) / 1_000_000
    ).toFixed(6)
  );
}

// Run all examples
async function runAllExamples() {
  try {
    await basicClaudeChat();
    await basicOpenAIChat();
    await chatWithFallback();
    await streamingChat();
    await contextManagement();
    await personaExample();
    await ecommerceAssistant();
    await costComparison();

    console.log("\n=== All examples completed successfully! ===");
  } catch (error) {
    console.error("\n=== Error running examples ===");
    console.error(error);
    console.error("\nMake sure you have set your API keys in .env.local:");
    console.error("  CLAUDE_API_KEY=sk-ant-...");
    console.error("  OPENAI_API_KEY=sk-proj-...");
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicClaudeChat,
  basicOpenAIChat,
  chatWithFallback,
  streamingChat,
  contextManagement,
  personaExample,
  ecommerceAssistant,
  costComparison,
};
