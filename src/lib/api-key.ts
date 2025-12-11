/**
 * API Key Management
 * Generate and validate API keys for widget authentication
 */

import { randomBytes, createHmac } from "crypto";

/**
 * Generate a secure API key
 * Format: omk_live_<32_hex_chars> or omk_test_<32_hex_chars>
 */
export function generateApiKey(mode: "live" | "test" = "live"): string {
  const randomPart = randomBytes(16).toString("hex");
  return `omk_${mode}_${randomPart}`;
}

/**
 * Hash an API key for storage
 * We store hashed keys for security
 */
export function hashApiKey(apiKey: string): string {
  const secret = process.env.API_KEY_SECRET || "default-secret-change-in-production";
  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

/**
 * Verify an API key against a hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return computedHash === hash;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): {
  isValid: boolean;
  error?: string;
} {
  // Expected format: omk_live_<32_hex> or omk_test_<32_hex>
  const pattern = /^omk_(live|test)_[a-f0-9]{32}$/;

  if (!pattern.test(apiKey)) {
    return {
      isValid: false,
      error: "Invalid API key format",
    };
  }

  return { isValid: true };
}

/**
 * Extract mode from API key
 */
export function extractApiKeyMode(apiKey: string): "live" | "test" | null {
  if (apiKey.startsWith("omk_live_")) return "live";
  if (apiKey.startsWith("omk_test_")) return "test";
  return null;
}

/**
 * Generate a JWT token for widget authentication
 * This is used for widget-to-server communication
 */
export function generateWidgetToken(agentId: string, apiKey: string): string {
  const payload = {
    agentId,
    apiKey: apiKey.substring(0, 10) + "...", // Don't include full key
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  // In production, use a proper JWT library
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Validate widget token
 */
export function validateWidgetToken(token: string): {
  isValid: boolean;
  agentId?: string;
  error?: string;
} {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());

    if (decoded.exp < Date.now()) {
      return {
        isValid: false,
        error: "Token expired",
      };
    }

    return {
      isValid: true,
      agentId: decoded.agentId,
    };
  } catch {
    return {
      isValid: false,
      error: "Invalid token",
    };
  }
}
