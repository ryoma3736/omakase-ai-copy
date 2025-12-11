/**
 * Rate Limiting Utilities
 *
 * Implements sliding window rate limiting for API endpoints.
 * Uses in-memory store for single-instance deployments.
 * Can be upgraded to Redis for distributed systems.
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per window
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Key format: "ip:<ip>" or "user:<userId>"
const rateLimitStore = new Map<string, RateLimitStore>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export class RateLimitError extends Error {
  public retryAfter: number;
  public limit: number;
  public remaining: number;

  constructor(retryAfter: number, limit: number, remaining: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private interval: number;
  private limit: number;

  constructor(config: RateLimitConfig) {
    this.interval = config.interval;
    this.limit = config.uniqueTokenPerInterval;
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP or user ID)
   * @returns Promise resolving to true if allowed
   * @throws RateLimitError if limit exceeded
   */
  async check(identifier: string): Promise<boolean> {
    const now = Date.now();
    const key = identifier;
    const store = rateLimitStore.get(key);

    if (!store || store.resetTime < now) {
      // First request or window expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.interval,
      });
      return true;
    }

    if (store.count >= this.limit) {
      // Limit exceeded
      const retryAfter = Math.ceil((store.resetTime - now) / 1000);
      throw new RateLimitError(retryAfter, this.limit, 0);
    }

    // Increment count
    store.count += 1;
    rateLimitStore.set(key, store);
    return true;
  }

  /**
   * Get current rate limit status
   * @param identifier - Unique identifier
   * @returns Current limit status
   */
  getStatus(identifier: string): {
    limit: number;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    const store = rateLimitStore.get(identifier);

    if (!store || store.resetTime < now) {
      return {
        limit: this.limit,
        remaining: this.limit,
        reset: now + this.interval,
      };
    }

    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - store.count),
      reset: store.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   * @param identifier - Unique identifier
   */
  reset(identifier: string): void {
    rateLimitStore.delete(identifier);
  }
}

/**
 * Default rate limiters for different API endpoints
 */

// General API rate limiter: 60 requests per minute
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60,
});

// Chat API rate limiter: 20 requests per minute
export const chatLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 20,
});

// Aggressive rate limiter: 10 requests per minute (for sensitive endpoints)
export const strictLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10,
});

/**
 * Get client identifier from request
 * Prefers user ID, falls back to IP address
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 * @param limiter - Rate limiter instance
 * @param identifier - Client identifier
 * @returns Response with rate limit headers or null if allowed
 */
export async function applyRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<Response | null> {
  try {
    await limiter.check(identifier);
    return null; // Allow request
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: error.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(error.retryAfter),
            "X-RateLimit-Limit": String(error.limit),
            "X-RateLimit-Remaining": String(error.remaining),
            "X-RateLimit-Reset": String(
              Math.floor(Date.now() / 1000) + error.retryAfter
            ),
          },
        }
      );
    }
    throw error;
  }
}

/**
 * Middleware wrapper for rate limiting
 * Usage in API routes:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await withRateLimit(request, chatLimiter);
 *   if (rateLimitResult) return rateLimitResult;
 *   // ... your handler code
 * }
 * ```
 */
export async function withRateLimit(
  request: Request,
  limiter: RateLimiter,
  userId?: string
): Promise<Response | null> {
  const identifier = getClientIdentifier(request, userId);
  return applyRateLimit(limiter, identifier);
}
