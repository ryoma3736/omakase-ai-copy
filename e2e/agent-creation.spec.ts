import { test, expect } from "@playwright/test";

test.describe("Agent Creation Flow", () => {
  test("should display step 1 - URL input", async ({ page }) => {
    await page.goto("/dashboard/agents/new");

    // Wait for page to load
    await page.waitForSelector("text=サイトURLを入力", { timeout: 10000 });

    // Check step indicator
    await expect(page.getByText("サイトURLを入力").first()).toBeVisible();

    // Check URL input field
    const urlInput = page.getByPlaceholder(/https:\/\/your-shop/i);
    await expect(urlInput).toBeVisible();

    // Check submit button
    const submitButton = page.getByRole("button", { name: /サイトを解析/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled(); // Disabled when empty
  });

  test("should enable button when URL is entered", async ({ page }) => {
    await page.goto("/dashboard/agents/new");

    await page.waitForSelector("text=サイトURLを入力", { timeout: 10000 });

    const urlInput = page.getByPlaceholder(/https:\/\/your-shop/i);
    const submitButton = page.getByRole("button", { name: /サイトを解析/i });

    // Enter a URL
    await urlInput.fill("https://example-shop.com");

    // Button should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test("should navigate to step 2 after URL submission", async ({ page }) => {
    await page.goto("/dashboard/agents/new");

    await page.waitForSelector("text=サイトURLを入力", { timeout: 10000 });

    const urlInput = page.getByPlaceholder(/https:\/\/your-shop/i);
    const submitButton = page.getByRole("button", { name: /サイトを解析/i });

    // Enter URL and submit
    await urlInput.fill("https://example-shop.com");
    await submitButton.click();

    // Should see step 2 content
    await expect(page.getByText("エージェントを設定").first()).toBeVisible();

    // Name should be auto-filled from URL
    const nameInput = page.getByPlaceholder(/例: マイショップアシスタント/i);
    await expect(nameInput).toHaveValue("example-shop.com");
  });

  test("should display tone options in step 2", async ({ page }) => {
    await page.goto("/dashboard/agents/new");

    await page.waitForSelector("text=サイトURLを入力", { timeout: 10000 });

    // Navigate to step 2
    await page.getByPlaceholder(/https:\/\/your-shop/i).fill("https://test.com");
    await page.getByRole("button", { name: /サイトを解析/i }).click();

    // Wait for step 2
    await page.waitForSelector("text=エージェントを設定", { timeout: 5000 });

    // Check tone options using button names (more specific)
    await expect(page.getByRole("button", { name: /丁寧/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /フレンドリー/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /専門的/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /カジュアル/i })).toBeVisible();
  });
});
