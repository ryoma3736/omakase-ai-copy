import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should display login page with OAuth options", async ({ page }) => {
    await page.goto("/login");

    // Check page title/heading - matches "Omakase AI Clone"
    await expect(page.locator("text=Omakase AI Clone")).toBeVisible();

    // Check OAuth buttons (Japanese text)
    const googleButton = page.getByRole("button", { name: /Google/i });
    const githubButton = page.getByRole("button", { name: /GitHub/i });

    await expect(googleButton).toBeVisible();
    await expect(githubButton).toBeVisible();
  });

  test("should have Google and GitHub login buttons", async ({ page }) => {
    await page.goto("/login");

    // Check buttons contain correct text
    await expect(page.locator("text=Googleでログイン")).toBeVisible();
    await expect(page.locator("text=GitHubでログイン")).toBeVisible();
  });

  test("should display terms and privacy notice", async ({ page }) => {
    await page.goto("/login");

    // Check for terms text
    await expect(page.locator("text=利用規約")).toBeVisible();
    await expect(page.locator("text=プライバシーポリシー")).toBeVisible();
  });
});
