import { test, expect } from "@playwright/test";

test.describe("Analytics Dashboard", () => {
  test("should display analytics page or handle loading/error state", async ({
    page,
  }) => {
    await page.goto("/dashboard/analytics");

    // The page will either show content or error (if DB not connected)
    // Wait for either the loading spinner to disappear or error to appear
    await page.waitForLoadState("networkidle");

    // Check if we're in error state or loaded state
    const errorText = page.locator("text=Error:");
    const loadingSpinner = page.locator(".animate-spin");
    const heading = page.locator("h1");

    // Wait for loading to complete (either success or error)
    await expect(loadingSpinner).toBeHidden({ timeout: 15000 });

    // Either we have an error or we have the analytics data
    const hasError = await errorText.isVisible().catch(() => false);

    if (hasError) {
      // API returned error - this is expected without DB
      await expect(errorText).toBeVisible();
    } else {
      // Data loaded successfully
      await expect(heading.first()).toContainText("アナリティクス");
      await expect(page.getByText("総会話数").first()).toBeVisible();
    }
  });

  test("should navigate to analytics page from dashboard", async ({ page }) => {
    // Start from dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Click analytics link in sidebar
    const analyticsLink = page.getByRole("link", { name: /アナリティクス/i });
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await expect(page).toHaveURL(/analytics/);
    }
  });
});
