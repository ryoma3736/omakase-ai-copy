import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  UsageLimitError,
  PLAN_LIMITS,
  getPlanLimits,
  hasUnlimitedChats,
} from "@/lib/usage";

// Note: Most functions in usage.ts require database access.
// Those are tested in integration tests. Here we test pure functions.

describe("PLAN_LIMITS", () => {
  it("should have correct limits for INTERN plan", () => {
    expect(PLAN_LIMITS.INTERN.chatLimit).toBe(1000);
    expect(PLAN_LIMITS.INTERN.dataLimitMB).toBe(100);
  });

  it("should have correct limits for ASSOCIATE plan", () => {
    expect(PLAN_LIMITS.ASSOCIATE.chatLimit).toBe(10000);
    expect(PLAN_LIMITS.ASSOCIATE.dataLimitMB).toBe(1024); // 1GB
  });

  it("should have correct limits for PRINCIPAL plan", () => {
    expect(PLAN_LIMITS.PRINCIPAL.chatLimit).toBe(-1); // Unlimited
    expect(PLAN_LIMITS.PRINCIPAL.dataLimitMB).toBe(10240); // 10GB
  });
});

describe("getPlanLimits", () => {
  it("should return INTERN limits for intern plan", () => {
    const limits = getPlanLimits("INTERN");
    expect(limits.chatLimit).toBe(1000);
  });

  it("should return ASSOCIATE limits for associate plan", () => {
    const limits = getPlanLimits("ASSOCIATE");
    expect(limits.chatLimit).toBe(10000);
  });

  it("should return PRINCIPAL limits for principal plan", () => {
    const limits = getPlanLimits("PRINCIPAL");
    expect(limits.chatLimit).toBe(-1);
  });

  it("should be case insensitive", () => {
    const limits1 = getPlanLimits("intern");
    const limits2 = getPlanLimits("Intern");
    expect(limits1.chatLimit).toBe(limits2.chatLimit);
  });

  it("should return INTERN limits for unknown plan", () => {
    const limits = getPlanLimits("UNKNOWN");
    expect(limits.chatLimit).toBe(PLAN_LIMITS.INTERN.chatLimit);
  });
});

describe("hasUnlimitedChats", () => {
  it("should return false for INTERN plan", () => {
    expect(hasUnlimitedChats("INTERN")).toBe(false);
  });

  it("should return false for ASSOCIATE plan", () => {
    expect(hasUnlimitedChats("ASSOCIATE")).toBe(false);
  });

  it("should return true for PRINCIPAL plan", () => {
    expect(hasUnlimitedChats("PRINCIPAL")).toBe(true);
  });
});

describe("UsageLimitError", () => {
  it("should create error with correct properties", () => {
    const error = new UsageLimitError("INTERN", 1000, 1000, "chat");

    expect(error.name).toBe("UsageLimitError");
    expect(error.plan).toBe("INTERN");
    expect(error.currentUsage).toBe(1000);
    expect(error.limit).toBe(1000);
    expect(error.usageType).toBe("chat");
    expect(error.message).toContain("chat usage limit exceeded");
  });

  it("should create error for data usage type", () => {
    const error = new UsageLimitError("ASSOCIATE", 1024, 1024, "data");

    expect(error.usageType).toBe("data");
    expect(error.message).toContain("data usage limit exceeded");
  });

  it("should be instanceof Error", () => {
    const error = new UsageLimitError("INTERN", 100, 100, "chat");
    expect(error instanceof Error).toBe(true);
  });
});
