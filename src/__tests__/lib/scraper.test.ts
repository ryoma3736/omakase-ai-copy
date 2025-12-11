import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPage, type ScrapedPage, type ExtractedProduct } from "@/lib/scraper";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="Test description">
      <meta property="og:title" content="OG Title">
    </head>
    <body>
      <h1>Hello World</h1>
      <p>Test content</p>
      <a href="/page1">Link 1</a>
      <a href="https://example.com/page2">Link 2</a>
      <img src="/image1.jpg" alt="Image 1">
      <script>console.log('script')</script>
      <style>body { color: red; }</style>
    </body>
    </html>
  `;

  it("should fetch and parse HTML correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await fetchPage("https://example.com");

    expect(result.url).toBe("https://example.com");
    expect(result.title).toBe("Test Page");
    expect(result.description).toBe("Test description");
    expect(result.content).toContain("Hello World");
    expect(result.content).toContain("Test content");
  });

  it("should extract metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await fetchPage("https://example.com");

    expect(result.metadata["description"]).toBe("Test description");
    expect(result.metadata["og:title"]).toBe("OG Title");
  });

  it("should extract and resolve links", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await fetchPage("https://example.com");

    expect(result.links).toContain("https://example.com/page1");
    expect(result.links).toContain("https://example.com/page2");
  });

  it("should extract and resolve images", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await fetchPage("https://example.com");

    expect(result.images).toContain("https://example.com/image1.jpg");
  });

  it("should remove script and style content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await fetchPage("https://example.com");

    expect(result.content).not.toContain("console.log");
    expect(result.content).not.toContain("color: red");
  });

  it("should throw error for non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetchPage("https://example.com/notfound")).rejects.toThrow(
      "Failed to fetch"
    );
  });

  it("should use correct User-Agent header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    await fetchPage("https://example.com");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("OmakaseBot"),
        }),
      })
    );
  });

  it("should handle empty page", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><body></body></html>",
    });

    const result = await fetchPage("https://example.com");

    expect(result.title).toBe("");
    expect(result.links).toHaveLength(0);
    expect(result.images).toHaveLength(0);
  });

  it("should deduplicate links and images", async () => {
    const htmlWithDuplicates = `
      <html><body>
        <a href="/page1">Link</a>
        <a href="/page1">Same Link</a>
        <img src="/image.jpg">
        <img src="/image.jpg">
      </body></html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => htmlWithDuplicates,
    });

    const result = await fetchPage("https://example.com");

    expect(result.links.filter((l) => l.includes("page1"))).toHaveLength(1);
    expect(result.images.filter((i) => i.includes("image.jpg"))).toHaveLength(1);
  });

  it("should skip invalid URLs", async () => {
    const htmlWithInvalidUrls = `
      <html><body>
        <a href="#">Hash link</a>
        <a href="javascript:void(0)">JS link</a>
        <a href="https://valid.com">Valid link</a>
      </body></html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => htmlWithInvalidUrls,
    });

    const result = await fetchPage("https://example.com");

    expect(result.links).not.toContain("#");
    expect(result.links).not.toContain("javascript:void(0)");
    expect(result.links).toContain("https://valid.com/");
  });

  it("should truncate content to 10000 characters", async () => {
    const longContent = "A".repeat(20000);
    const htmlWithLongContent = `<html><body>${longContent}</body></html>`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => htmlWithLongContent,
    });

    const result = await fetchPage("https://example.com");

    expect(result.content.length).toBeLessThanOrEqual(10000);
  });
});

describe("ScrapedPage type", () => {
  it("should have required fields", () => {
    const page: ScrapedPage = {
      url: "https://example.com",
      title: "Test",
      description: "Description",
      content: "Content",
      links: [],
      images: [],
      metadata: {},
    };

    expect(page.url).toBeDefined();
    expect(page.title).toBeDefined();
    expect(page.description).toBeDefined();
    expect(page.content).toBeDefined();
    expect(page.links).toBeDefined();
    expect(page.images).toBeDefined();
    expect(page.metadata).toBeDefined();
  });
});

describe("ExtractedProduct type", () => {
  it("should allow partial product data", () => {
    const product: ExtractedProduct = {
      name: "Test Product",
    };

    expect(product.name).toBe("Test Product");
    expect(product.price).toBeUndefined();
    expect(product.currency).toBeUndefined();
  });

  it("should allow full product data", () => {
    const product: ExtractedProduct = {
      name: "Full Product",
      price: 1000,
      currency: "JPY",
      description: "Product description",
      imageUrl: "https://example.com/image.jpg",
      productUrl: "https://example.com/product",
      category: "Electronics",
      features: ["Feature 1", "Feature 2"],
    };

    expect(product.name).toBe("Full Product");
    expect(product.price).toBe(1000);
    expect(product.features).toHaveLength(2);
  });
});
