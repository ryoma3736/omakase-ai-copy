import { chromium, Browser, Page, BrowserContext } from "playwright";

/**
 * Browser Manager for Playwright
 * Handles browser lifecycle and page creation for web scraping
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the browser instance
   */
  async init(): Promise<void> {
    if (this.initialized && this.browser) {
      return;
    }

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

      this.context = await this.browser.newContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1920, height: 1080 },
        locale: "ja-JP",
      });

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize browser:", error);
      throw new Error("Browser initialization failed");
    }
  }

  /**
   * Create a new page
   */
  async newPage(): Promise<Page> {
    if (!this.initialized || !this.context) {
      await this.init();
    }

    const page = await this.context!.newPage();

    // Set default timeout
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    return page;
  }

  /**
   * Navigate to a URL and wait for content to load
   */
  async goto(
    page: Page,
    url: string,
    options?: {
      waitUntil?: "load" | "domcontentloaded" | "networkidle";
      timeout?: number;
    }
  ): Promise<void> {
    try {
      await page.goto(url, {
        waitUntil: options?.waitUntil || "networkidle",
        timeout: options?.timeout || 30000,
      });

      // Wait for body to be visible
      await page.waitForSelector("body", { timeout: 5000 });
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Execute JavaScript on the page
   */
  async evaluate<T>(page: Page, pageFunction: () => T): Promise<T> {
    return await page.evaluate(pageFunction);
  }

  /**
   * Take a screenshot of the page
   */
  async screenshot(
    page: Page,
    options?: { path?: string; fullPage?: boolean }
  ): Promise<Buffer> {
    return await page.screenshot({
      fullPage: options?.fullPage ?? false,
      path: options?.path,
      type: "png",
    });
  }

  /**
   * Wait for a specific selector to appear
   */
  async waitForSelector(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<void> {
    await page.waitForSelector(selector, { timeout: timeout || 10000 });
  }

  /**
   * Check if robots.txt allows scraping
   */
  async checkRobotsTxt(baseUrl: string): Promise<boolean> {
    try {
      const robotsUrl = new URL("/robots.txt", baseUrl).toString();
      const page = await this.newPage();

      try {
        const response = await page.goto(robotsUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });

        if (!response || response.status() === 404) {
          // No robots.txt, allow scraping
          return true;
        }

        const content = await page.content();
        const text = await page.evaluate(() => document.body.textContent || "");

        // Simple check for Disallow: / in robots.txt
        const disallowAll = /Disallow:\s*\/\s*$/m.test(text);

        await page.close();
        return !disallowAll;
      } catch {
        await page.close();
        return true; // If robots.txt can't be fetched, assume allowed
      }
    } catch {
      return true; // If any error, assume allowed
    }
  }

  /**
   * Close a page
   */
  async closePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch (error) {
      console.error("Error closing page:", error);
    }
  }

  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.initialized = false;
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }

  /**
   * Get browser status
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let browserManager: BrowserManager | null = null;

/**
 * Get the singleton browser manager instance
 */
export function getBrowserManager(): BrowserManager {
  if (!browserManager) {
    browserManager = new BrowserManager();
  }
  return browserManager;
}

/**
 * Cleanup browser manager on process exit
 */
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (browserManager) {
      browserManager.close().catch(console.error);
    }
  });

  process.on("SIGINT", () => {
    if (browserManager) {
      browserManager.close().catch(console.error);
    }
    process.exit(0);
  });
}
