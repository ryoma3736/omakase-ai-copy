/**
 * Chat Module - Unified LLM Integration
 *
 * Exports all chat-related functionality including providers,
 * context management, and persona configuration.
 */

// Provider exports
export {
  ChatClient,
  ProviderFactory,
  createChatClient,
  createDefaultChatClient,
} from "./provider";
export type {
  ChatProvider,
  ChatResponse,
  Message,
  ChatOptions,
  ProviderType,
  ProviderConfig,
} from "./provider";

// Context exports
export {
  ChatContext,
  createContext,
  createContextFromMessages,
  mergeContexts,
} from "./context";
export type {
  ContextConfig,
  ContextMetadata,
} from "./context";

// Persona exports
export {
  PersonaManager,
  PRESET_PERSONAS,
  createPersona,
  createCustomPersona,
  getDefaultPersona,
  listPresetPersonas,
} from "./persona";
export type {
  PersonaConfig,
  PersonaTone,
  PersonaStyle,
  CommunicationPreferences,
  DomainExpertise,
} from "./persona";
