import { Page } from "playwright";
import * as cheerio from "cheerio";

export interface ExtractedContent {
  url: string;
  title: string;
  description: string;
  content: string;
  mainContent?: string;
  products: ProductInfo[];
  images: ImageInfo[];
  links: string[];
  metadata: Record<string, string>;
  structuredData?: Record<string, unknown>[];
  scrapedAt: Date;
}

export interface ProductInfo {
  name: string;
  price?: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
  features?: string[];
  sku?: string;
  availability?: string;
}

export interface ImageInfo {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Content Extractor using Playwright
 * Extracts structured data from web pages
 */
export class ContentExtractor {
  /**
   * Extract all content from a page using Playwright
   */
  async extractFromPage(page: Page): Promise<ExtractedContent> {
    const url = page.url();

    // Extract basic metadata
    const metadata = await this.extractMetadata(page);
    const title = await this.extractTitle(page);
    const description = await this.extractDescription(page);

    // Extract structured data (JSON-LD, microdata)
    const structuredData = await this.extractStructuredData(page);

    // Extract main content
    const content = await this.extractTextContent(page);
    const mainContent = await this.extractMainContent(page);

    // Extract products
    const products = await this.extractProducts(page, structuredData);

    // Extract images
    const images = await this.extractImages(page);

    // Extract links
    const links = await this.extractLinks(page);

    return {
      url,
      title,
      description,
      content,
      mainContent,
      products,
      images,
      links,
      metadata,
      structuredData,
      scrapedAt: new Date(),
    };
  }

  /**
   * Extract metadata from page
   */
  private async extractMetadata(page: Page): Promise<Record<string, string>> {
    return await page.evaluate(() => {
      const metadata: Record<string, string> = {};

      // Extract meta tags
      document.querySelectorAll("meta").forEach((meta) => {
        const name =
          meta.getAttribute("name") ||
          meta.getAttribute("property") ||
          meta.getAttribute("itemprop");
        const content = meta.getAttribute("content");

        if (name && content) {
          metadata[name] = content;
        }
      });

      return metadata;
    });
  }

  /**
   * Extract page title
   */
  private async extractTitle(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // Try multiple sources
      return (
        document.title ||
        document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
        document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
        document.querySelector("h1")?.textContent?.trim() ||
        ""
      );
    });
  }

  /**
   * Extract page description
   */
  private async extractDescription(page: Page): Promise<string> {
    return await page.evaluate(() => {
      return (
        document.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
        ""
      );
    });
  }

  /**
   * Extract structured data (JSON-LD, microdata)
   */
  private async extractStructuredData(
    page: Page
  ): Promise<Record<string, unknown>[]> {
    return await page.evaluate(() => {
      const structuredData: Record<string, unknown>[] = [];

      // Extract JSON-LD
      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((script) => {
          try {
            const data = JSON.parse(script.textContent || "");
            structuredData.push(data);
          } catch {
            // Invalid JSON, skip
          }
        });

      return structuredData;
    });
  }

  /**
   * Extract full text content from page
   */
  private async extractTextContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // Remove unwanted elements
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("script, style, noscript, iframe").forEach((el) => {
        el.remove();
      });

      return clone.textContent?.replace(/\s+/g, " ").trim().substring(0, 50000) || "";
    });
  }

  /**
   * Extract main content from page (heuristic-based)
   */
  private async extractMainContent(page: Page): Promise<string | undefined> {
    return await page.evaluate(() => {
      // Try common main content selectors
      const selectors = [
        "main",
        'article',
        '[role="main"]',
        ".main-content",
        "#main-content",
        ".content",
        "#content",
        ".post-content",
        ".article-content",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          // Remove unwanted elements
          const clone = element.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("script, style, noscript, iframe").forEach((el) => {
            el.remove();
          });

          const text = clone.textContent?.replace(/\s+/g, " ").trim();
          if (text && text.length > 100) {
            return text.substring(0, 20000);
          }
        }
      }

      return undefined;
    });
  }

  /**
   * Extract product information
   */
  private async extractProducts(
    page: Page,
    structuredData?: Record<string, unknown>[]
  ): Promise<ProductInfo[]> {
    const products: ProductInfo[] = [];

    // Extract from structured data first
    if (structuredData) {
      for (const data of structuredData) {
        if (data["@type"] === "Product") {
          products.push(this.parseProductFromStructuredData(data));
        } else if (Array.isArray(data["@graph"])) {
          for (const item of data["@graph"]) {
            if (item["@type"] === "Product") {
              products.push(this.parseProductFromStructuredData(item));
            }
          }
        }
      }
    }

    // Extract from page HTML if no structured data
    if (products.length === 0) {
      const htmlProducts = await page.evaluate(() => {
        const productElements = document.querySelectorAll(
          '[itemtype*="schema.org/Product"], .product, [data-product-id]'
        );

        const products = [];

        for (const el of Array.from(productElements).slice(0, 50)) {
          const htmlEl = el as HTMLElement;

          const name =
            htmlEl.querySelector('[itemprop="name"]')?.textContent?.trim() ||
            htmlEl.querySelector(".product-title, .product-name, h2, h3")?.textContent?.trim() ||
            "";

          const priceText =
            htmlEl.querySelector('[itemprop="price"]')?.textContent?.trim() ||
            htmlEl.querySelector(".price, .product-price")?.textContent?.trim() ||
            "";

          const description =
            htmlEl.querySelector('[itemprop="description"]')?.textContent?.trim() ||
            htmlEl.querySelector(".description, .product-description")?.textContent?.trim() ||
            "";

          const imageUrl =
            htmlEl.querySelector<HTMLImageElement>('[itemprop="image"]')?.src ||
            htmlEl.querySelector<HTMLImageElement>(".product-image img, img")?.src ||
            "";

          if (name) {
            products.push({
              name,
              priceText,
              description,
              imageUrl,
            });
          }
        }

        return products;
      });

      for (const product of htmlProducts) {
        products.push({
          name: product.name,
          price: this.parsePrice(product.priceText),
          currency: this.parseCurrency(product.priceText),
          description: product.description || undefined,
          imageUrl: product.imageUrl || undefined,
        });
      }
    }

    return products;
  }

  /**
   * Parse product from structured data
   */
  private parseProductFromStructuredData(data: Record<string, unknown>): ProductInfo {
    const offers = data.offers as Record<string, unknown> | undefined;

    return {
      name: String(data.name || ""),
      description: String(data.description || ""),
      imageUrl: String(data.image || ""),
      price: offers ? Number(offers.price) : undefined,
      currency: offers ? String(offers.priceCurrency || "JPY") : undefined,
      availability: offers ? String(offers.availability || "") : undefined,
      sku: data.sku ? String(data.sku) : undefined,
      category: data.category ? String(data.category) : undefined,
    };
  }

  /**
   * Extract images from page
   */
  private async extractImages(page: Page): Promise<ImageInfo[]> {
    return await page.evaluate(() => {
      const images: ImageInfo[] = [];
      const seenUrls = new Set<string>();

      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || img.getAttribute("data-src");
        if (src && !seenUrls.has(src)) {
          seenUrls.add(src);
          images.push({
            url: src,
            alt: img.alt || undefined,
            width: img.naturalWidth || undefined,
            height: img.naturalHeight || undefined,
          });
        }
      });

      return images.slice(0, 100); // Limit to 100 images
    });
  }

  /**
   * Extract links from page
   */
  private async extractLinks(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const links: string[] = [];
      const seenUrls = new Set<string>();

      document.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("javascript:") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:")
        ) {
          try {
            const url = new URL(href, window.location.href).toString();
            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              links.push(url);
            }
          } catch {
            // Invalid URL
          }
        }
      });

      return links.slice(0, 500); // Limit to 500 links
    });
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string): number | undefined {
    if (!priceText) return undefined;

    // Remove currency symbols and non-numeric characters except dots and commas
    const cleaned = priceText.replace(/[^\d.,]/g, "");

    // Handle Japanese format: 1,000 or 1,000.00
    const normalized = cleaned.replace(/,/g, "");

    const price = parseFloat(normalized);
    return isNaN(price) ? undefined : price;
  }

  /**
   * Parse currency from text
   */
  private parseCurrency(priceText: string): string {
    if (!priceText) return "JPY";

    if (priceText.includes("¥") || priceText.includes("円")) {
      return "JPY";
    } else if (priceText.includes("$")) {
      return "USD";
    } else if (priceText.includes("€")) {
      return "EUR";
    }

    return "JPY"; // Default to JPY
  }
}
