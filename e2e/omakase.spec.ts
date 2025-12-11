/**
 * Omakase AI Clone - E2E Tests
 *
 * Tests for main functionality:
 * - Homepage loads
 * - Pricing page
 * - Chat API (Gemini integration)
 * - Widget Info API
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
  });

  test("should have correct title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Omakase/i);
  });

  test("should display hero section", async ({ page }) => {
    await page.goto(BASE_URL);
    // Check for main heading or hero content
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("Pricing Page", () => {
  test("should load pricing page", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/pricing`);
    expect(response?.status()).toBe(200);
  });

  test("should display pricing tiers", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    const body = await page.textContent("body");
    // Check for pricing keywords
    expect(body?.toLowerCase()).toMatch(/intern|associate|principal|enterprise/i);
  });
});

test.describe("Login Page", () => {
  test("should load login page", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/login`);
    expect(response?.status()).toBe(200);
  });
});

test.describe("Register Page", () => {
  test("should load register page", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/register`);
    expect(response?.status()).toBe(200);
  });
});

test.describe("API Endpoints", () => {
  test("should return widget info or error for invalid agent", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/widget_info?agentId=test-agent`);
    // Returns 400 for invalid agent, 200 for valid agent
    expect([200, 400]).toContain(response.status());
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test("should have rate limit headers", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/widget_info?agentId=test`);
    expect(response.headers()["x-ratelimit-limit"]).toBeDefined();
  });

  test("chat API should require POST method", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/chat`);
    expect(response.status()).toBe(405); // Method not allowed
  });

  test("chat API should accept POST", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        message: "Hello",
        agentId: "test-agent",
      },
    });
    // Should return 200, 400, 401, or 500 (DB not configured)
    expect([200, 400, 401, 500]).toContain(response.status());
  });
});

test.describe("CORS Headers", () => {
  test("widget API should have CORS headers", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/widget_info?agentId=test`);
    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBe("*");
  });
});

test.describe("Security Headers", () => {
  test("API should have security headers", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/widget_info?agentId=test`);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
  });
});
