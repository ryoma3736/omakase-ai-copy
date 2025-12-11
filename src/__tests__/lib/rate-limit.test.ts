import { describe, it, expect, beforeEach } from "vitest";
import {
  RateLimiter,
  RateLimitError,
  apiLimiter,
  chatLimiter,
  strictLimiter,
  getClientIdentifier,
  applyRateLimit,
  withRateLimit,
} from "@/lib/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    // Create a fresh limiter for each test
    limiter = new RateLimiter({
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 3, // 3 requests per minute
    });
  });

  describe("check", () => {
    it("should allow requests within limit", async () => {
      const result1 = await limiter.check("test-user-1");
      const result2 = await limiter.check("test-user-1");
      const result3 = await limiter.check("test-user-1");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it("should throw RateLimitError when limit exceeded", async () => {
      await limiter.check("test-user-2");
      await limiter.check("test-user-2");
      await limiter.check("test-user-2");

      await expect(limiter.check("test-user-2")).rejects.toThrow(RateLimitError);
    });

    it("should track different identifiers separately", async () => {
      // Fill up user-a's limit
      await limiter.check("user-a");
      await limiter.check("user-a");
      await limiter.check("user-a");

      // user-b should still have quota
      const result = await limiter.check("user-b");
      expect(result).toBe(true);
    });
  });

  describe("getStatus", () => {
    it("should return full limit for new identifier", () => {
      const status = limiter.getStatus("new-user");
      expect(status.limit).toBe(3);
      expect(status.remaining).toBe(3);
    });

    it("should return correct remaining count", async () => {
      await limiter.check("status-user");
      await limiter.check("status-user");

      const status = limiter.getStatus("status-user");
      expect(status.remaining).toBe(1);
    });
  });

  describe("reset", () => {
    it("should reset rate limit for identifier", async () => {
      // Use up all requests
      await limiter.check("reset-user");
      await limiter.check("reset-user");
      await limiter.check("reset-user");

      // Should fail
      await expect(limiter.check("reset-user")).rejects.toThrow();

      // Reset
      limiter.reset("reset-user");

      // Should succeed again
      const result = await limiter.check("reset-user");
      expect(result).toBe(true);
    });
  });
});

describe("Pre-configured limiters", () => {
  it("apiLimiter should have 60 requests per minute", () => {
    const status = apiLimiter.getStatus("test");
    expect(status.limit).toBe(60);
  });

  it("chatLimiter should have 20 requests per minute", () => {
    const status = chatLimiter.getStatus("test");
    expect(status.limit).toBe(20);
  });

  it("strictLimiter should have 10 requests per minute", () => {
    const status = strictLimiter.getStatus("test");
    expect(status.limit).toBe(10);
  });
});

describe("getClientIdentifier", () => {
  it("should use user ID when provided", () => {
    const request = new Request("http://localhost");
    const identifier = getClientIdentifier(request, "user-123");
    expect(identifier).toBe("user:user-123");
  });

  it("should use x-forwarded-for header when available", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("ip:192.168.1.1");
  });

  it("should use x-real-ip header as fallback", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "10.0.0.1" },
    });
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("ip:10.0.0.1");
  });

  it("should return unknown when no IP available", () => {
    const request = new Request("http://localhost");
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("ip:unknown");
  });
});

describe("applyRateLimit", () => {
  it("should return null when request is allowed", async () => {
    const limiter = new RateLimiter({
      interval: 60000,
      uniqueTokenPerInterval: 10,
    });

    const result = await applyRateLimit(limiter, "apply-test");
    expect(result).toBeNull();
  });

  it("should return 429 response when limit exceeded", async () => {
    const limiter = new RateLimiter({
      interval: 60000,
      uniqueTokenPerInterval: 1,
    });

    await applyRateLimit(limiter, "apply-test-2");
    const result = await applyRateLimit(limiter, "apply-test-2");

    expect(result).not.toBeNull();
    expect(result?.status).toBe(429);

    const body = await result?.json();
    expect(body.error).toBe("Too many requests");
  });
});

describe("withRateLimit", () => {
  it("should work as middleware wrapper", async () => {
    const limiter = new RateLimiter({
      interval: 60000,
      uniqueTokenPerInterval: 5,
    });

    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "test-ip" },
    });

    const result = await withRateLimit(request, limiter);
    expect(result).toBeNull();
  });

  it("should prefer userId over IP", async () => {
    const limiter = new RateLimiter({
      interval: 60000,
      uniqueTokenPerInterval: 1,
    });

    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "shared-ip" },
    });

    // Use up quota for user-1
    await withRateLimit(request, limiter, "user-1");

    // user-1 should be blocked
    const result1 = await withRateLimit(request, limiter, "user-1");
    expect(result1?.status).toBe(429);

    // user-2 with same IP should still work
    const result2 = await withRateLimit(request, limiter, "user-2");
    expect(result2).toBeNull();
  });
});
