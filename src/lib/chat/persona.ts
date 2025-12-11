/**
 * AI Agent Persona Management
 *
 * Configures AI agent personality, tone, style, and behavioral characteristics.
 */

// Persona tone options
export type PersonaTone =
  | "professional"
  | "friendly"
  | "casual"
  | "enthusiastic"
  | "empathetic"
  | "authoritative"
  | "playful"
  | "formal";

// Persona style options
export type PersonaStyle =
  | "concise"
  | "detailed"
  | "conversational"
  | "technical"
  | "storytelling"
  | "educational";

// Communication preferences
export interface CommunicationPreferences {
  useEmojis?: boolean;
  useBulletPoints?: boolean;
  includeExamples?: boolean;
  askClarifyingQuestions?: boolean;
  provideStepByStep?: boolean;
}

// Domain expertise
export type DomainExpertise =
  | "general"
  | "e-commerce"
  | "customer-support"
  | "technical-support"
  | "sales"
  | "education"
  | "healthcare"
  | "finance";

// Persona configuration
export interface PersonaConfig {
  name?: string;
  role?: string;
  tone: PersonaTone;
  style: PersonaStyle;
  expertise?: DomainExpertise;
  communication?: CommunicationPreferences;
  customInstructions?: string;
  greeting?: string;
  responseGuidelines?: string[];
  prohibitedTopics?: string[];
  languages?: string[]; // Supported languages
}

// Preset personas
export const PRESET_PERSONAS: Record<string, PersonaConfig> = {
  "customer-support": {
    name: "Customer Support Assistant",
    role: "Helpful customer service representative",
    tone: "friendly",
    style: "conversational",
    expertise: "customer-support",
    communication: {
      useEmojis: true,
      askClarifyingQuestions: true,
      provideStepByStep: true,
    },
    greeting:
      "Hello! I'm here to help you today. How can I assist you?",
    responseGuidelines: [
      "Always be polite and patient",
      "Listen carefully to customer concerns",
      "Provide clear, actionable solutions",
      "Offer to escalate if needed",
    ],
  },

  "sales-assistant": {
    name: "Sales Assistant",
    role: "Product recommendation specialist",
    tone: "enthusiastic",
    style: "conversational",
    expertise: "sales",
    communication: {
      useEmojis: true,
      includeExamples: true,
      askClarifyingQuestions: true,
    },
    greeting:
      "Hi there! I'd love to help you find the perfect product. What are you looking for today?",
    responseGuidelines: [
      "Ask about customer needs and preferences",
      "Recommend products that match requirements",
      "Highlight key benefits and features",
      "Create urgency when appropriate",
    ],
  },

  "technical-expert": {
    name: "Technical Expert",
    role: "Technical support specialist",
    tone: "professional",
    style: "technical",
    expertise: "technical-support",
    communication: {
      useEmojis: false,
      useBulletPoints: true,
      provideStepByStep: true,
    },
    greeting:
      "Hello. I'm here to provide technical assistance. Please describe your issue.",
    responseGuidelines: [
      "Use precise technical terminology",
      "Provide detailed troubleshooting steps",
      "Ask for specific system information when needed",
      "Document solutions clearly",
    ],
  },

  "personal-shopper": {
    name: "Personal Shopper",
    role: "Personalized shopping assistant",
    tone: "friendly",
    style: "conversational",
    expertise: "e-commerce",
    communication: {
      useEmojis: true,
      includeExamples: true,
      askClarifyingQuestions: true,
    },
    greeting:
      "Welcome! I'm your personal shopping assistant. Let's find something perfect for you!",
    responseGuidelines: [
      "Learn about customer preferences and style",
      "Suggest products based on conversation",
      "Offer styling tips and combinations",
      "Make shopping feel personal and enjoyable",
    ],
  },

  professional: {
    name: "Professional Assistant",
    role: "Business professional",
    tone: "professional",
    style: "concise",
    expertise: "general",
    communication: {
      useEmojis: false,
      useBulletPoints: true,
    },
    greeting: "Good day. How may I assist you?",
    responseGuidelines: [
      "Maintain professional demeanor",
      "Be clear and concise",
      "Focus on efficiency",
    ],
  },
};

/**
 * Persona Manager
 */
export class PersonaManager {
  private config: PersonaConfig;

  constructor(config: PersonaConfig) {
    this.config = config;
  }

  /**
   * Get the persona configuration
   */
  getConfig(): PersonaConfig {
    return { ...this.config };
  }

  /**
   * Update persona configuration
   */
  updateConfig(updates: Partial<PersonaConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Generate system prompt from persona configuration
   */
  generateSystemPrompt(additionalContext?: string): string {
    const parts: string[] = [];

    // Role and identity
    if (this.config.name && this.config.role) {
      parts.push(
        `You are ${this.config.name}, a ${this.config.role}.`
      );
    } else if (this.config.role) {
      parts.push(`You are a ${this.config.role}.`);
    }

    // Tone and style
    parts.push(this.generateToneStyleInstruction());

    // Communication preferences
    if (this.config.communication) {
      parts.push(this.generateCommunicationInstruction());
    }

    // Domain expertise
    if (this.config.expertise && this.config.expertise !== "general") {
      parts.push(
        `Your area of expertise is ${this.config.expertise.replace(
          /-/g,
          " "
        )}.`
      );
    }

    // Response guidelines
    if (this.config.responseGuidelines && this.config.responseGuidelines.length > 0) {
      parts.push("\nResponse Guidelines:");
      this.config.responseGuidelines.forEach((guideline) => {
        parts.push(`- ${guideline}`);
      });
    }

    // Prohibited topics
    if (this.config.prohibitedTopics && this.config.prohibitedTopics.length > 0) {
      parts.push("\nDo not discuss or engage with the following topics:");
      this.config.prohibitedTopics.forEach((topic) => {
        parts.push(`- ${topic}`);
      });
    }

    // Custom instructions
    if (this.config.customInstructions) {
      parts.push(`\n${this.config.customInstructions}`);
    }

    // Additional context
    if (additionalContext) {
      parts.push(`\n${additionalContext}`);
    }

    return parts.join("\n");
  }

  /**
   * Get greeting message
   */
  getGreeting(): string {
    return this.config.greeting || "Hello! How can I help you today?";
  }

  /**
   * Generate tone and style instruction
   */
  private generateToneStyleInstruction(): string {
    const toneDescriptions: Record<PersonaTone, string> = {
      professional: "professional and business-like manner",
      friendly: "warm and approachable manner",
      casual: "relaxed and informal manner",
      enthusiastic: "energetic and positive manner",
      empathetic: "understanding and compassionate manner",
      authoritative: "confident and knowledgeable manner",
      playful: "fun and lighthearted manner",
      formal: "formal and respectful manner",
    };

    const styleDescriptions: Record<PersonaStyle, string> = {
      concise: "Keep responses brief and to the point",
      detailed: "Provide thorough and comprehensive explanations",
      conversational: "Use a natural, dialogue-like approach",
      technical: "Use precise technical terminology and explanations",
      storytelling: "Present information in a narrative format",
      educational: "Explain concepts clearly with educational focus",
    };

    return `Communicate in a ${
      toneDescriptions[this.config.tone]
    }. ${styleDescriptions[this.config.style]}.`;
  }

  /**
   * Generate communication preference instruction
   */
  private generateCommunicationInstruction(): string {
    const prefs = this.config.communication!;
    const instructions: string[] = [];

    if (prefs.useEmojis) {
      instructions.push("Use emojis appropriately to convey emotion");
    }

    if (prefs.useBulletPoints) {
      instructions.push("Format information using bullet points when helpful");
    }

    if (prefs.includeExamples) {
      instructions.push("Provide examples to illustrate points");
    }

    if (prefs.askClarifyingQuestions) {
      instructions.push(
        "Ask clarifying questions when needed to better understand user needs"
      );
    }

    if (prefs.provideStepByStep) {
      instructions.push("Break down complex processes into step-by-step instructions");
    }

    return instructions.length > 0 ? instructions.join(". ") + "." : "";
  }
}

/**
 * Create a persona manager with preset configuration
 */
export function createPersona(presetName: keyof typeof PRESET_PERSONAS): PersonaManager {
  const config = PRESET_PERSONAS[presetName];
  if (!config) {
    throw new Error(`Unknown preset persona: ${presetName}`);
  }
  return new PersonaManager(config);
}

/**
 * Create a custom persona manager
 */
export function createCustomPersona(config: PersonaConfig): PersonaManager {
  return new PersonaManager(config);
}

/**
 * Get default persona (customer support)
 */
export function getDefaultPersona(): PersonaManager {
  return createPersona("customer-support");
}

/**
 * List available preset personas
 */
export function listPresetPersonas(): Array<{
  key: string;
  name: string;
  role: string;
  expertise: string;
}> {
  return Object.entries(PRESET_PERSONAS).map(([key, config]) => ({
    key,
    name: config.name || key,
    role: config.role || "Assistant",
    expertise: config.expertise || "general",
  }));
}
