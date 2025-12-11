/**
 * Password hashing and validation utilities
 * Uses bcryptjs for secure password handling
 */

import { hash, compare } from "bcryptjs";

/**
 * Hash a plaintext password
 * @param password - The plaintext password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Higher = more secure, but slower
  return hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - The plaintext password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
    };
  }

  return { isValid: true };
}
