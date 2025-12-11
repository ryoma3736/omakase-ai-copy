import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should display the landing page correctly", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/Omakase AI/i);

    // Check hero section
    await expect(page.locator("h1")).toContainText(/URLを入れるだけ/i);

    // Check CTA button exists (use first() to avoid strict mode violation)
    const ctaButton = page.getByRole("link", { name: /無料で始める/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click login link in header
    await page.getByRole("navigation").getByRole("link", { name: /ログイン/i }).click();

    // Should be on login page
    await expect(page).toHaveURL(/login/);
  });

  test("should display 3-step features", async ({ page }) => {
    await page.goto("/");

    // Check step headings using more specific selectors
    await expect(page.getByRole("heading", { name: "URLを入力" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AIが学習" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ウィジェット設置" })).toBeVisible();
  });
});
