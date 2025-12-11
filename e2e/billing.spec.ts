import { test, expect } from "@playwright/test";

test.describe("Billing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/settings/billing");
    // Wait for page to load
    await page.waitForSelector("text=料金プラン", { timeout: 10000 });
  });

  test("should display pricing plans", async ({ page }) => {
    // Check all 4 plans are displayed using headings
    await expect(page.getByRole("heading", { name: "Free" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Intern" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Associate" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Principal" }).first()).toBeVisible();
  });

  test("should display pricing amounts", async ({ page }) => {
    // Check pricing using more specific selectors
    await expect(page.getByText("¥9,800").first()).toBeVisible();
    await expect(page.getByText("¥29,800").first()).toBeVisible();
    await expect(page.getByText("¥98,000").first()).toBeVisible();
  });

  test("should highlight popular plan", async ({ page }) => {
    // Check for "人気" badge using first()
    await expect(page.getByText("人気").first()).toBeVisible();
  });

  test("should have checkout buttons for paid plans", async ({ page }) => {
    // Check for selection buttons
    const selectButtons = page.getByRole("button", { name: /このプランを選択/i });
    const count = await selectButtons.count();
    expect(count).toBe(3); // 3 paid plans
  });
});
