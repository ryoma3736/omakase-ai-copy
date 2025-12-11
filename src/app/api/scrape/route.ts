import { NextRequest, NextResponse } from "next/server";
import { getBrowserManager } from "@/lib/scraper/browser";
import { ContentExtractor } from "@/lib/scraper/extractor";
import { AIAnalyzer } from "@/lib/scraper/analyzer";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

interface ScrapeRequest {
  url: string;
  generateFAQ?: boolean;
  analyzeContent?: boolean;
  enhanceProducts?: boolean;
  maxFAQs?: number;
}

interface ScrapeResponse {
  success: boolean;
  data?: {
    content: {
      url: string;
      title: string;
      description: string;
      content: string;
      mainContent?: string;
      products: unknown[];
      images: unknown[];
      links: string[];
      metadata: Record<string, string>;
      scrapedAt: string;
    };
    faqs?: Array<{ question: string; answer: string; category?: string }>;
    analysis?: {
      summary: string;
      keywords: string[];
      categories: string[];
      topics: string[];
      sentiment?: string;
      language: string;
    };
    enhancedProducts?: unknown[];
  };
  error?: string;
  message?: string;
}

/**
 * POST /api/scrape
 * Scrape a URL and optionally analyze content with AI
 */
export async function POST(request: NextRequest): Promise<NextResponse<ScrapeResponse>> {
  try {
    const body = (await request.json()) as ScrapeRequest;
    const {
      url,
      generateFAQ = false,
      analyzeContent = false,
      enhanceProducts = false,
      maxFAQs = 10,
    } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    // Initialize browser and extractors
    const browserManager = getBrowserManager();
    await browserManager.init();

    let page = null;

    try {
      // Check robots.txt
      const robotsAllowed = await browserManager.checkRobotsTxt(url);
      if (!robotsAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Scraping not allowed by robots.txt",
          },
          { status: 403 }
        );
      }

      // Create page and navigate
      page = await browserManager.newPage();
      await browserManager.goto(page, url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Extract content
      const extractor = new ContentExtractor();
      const extractedContent = await extractor.extractFromPage(page);

      // Prepare response
      const response: ScrapeResponse = {
        success: true,
        data: {
          content: {
            ...extractedContent,
            scrapedAt: extractedContent.scrapedAt.toISOString(),
          },
        },
      };

      // Generate FAQs if requested
      if (generateFAQ) {
        const analyzer = new AIAnalyzer();
        const faqs = await analyzer.generateFAQs(extractedContent, maxFAQs);
        response.data!.faqs = faqs;
      }

      // Analyze content if requested
      if (analyzeContent) {
        const analyzer = new AIAnalyzer();
        const analysis = await analyzer.analyzeContent(extractedContent);
        response.data!.analysis = analysis;
      }

      // Enhance products if requested
      if (enhanceProducts && extractedContent.products.length > 0) {
        const analyzer = new AIAnalyzer();
        const enhancedProducts = await analyzer.enhanceProducts(
          extractedContent.products,
          extractedContent.mainContent || extractedContent.content
        );
        response.data!.enhancedProducts = enhancedProducts;
      }

      return NextResponse.json(response);
    } finally {
      // Cleanup
      if (page) {
        await browserManager.closePage(page);
      }
    }
  } catch (error) {
    console.error("Scrape API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape?url=...
 * Quick scrape without AI analysis
 */
export async function GET(request: NextRequest): Promise<NextResponse<ScrapeResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    // Initialize browser
    const browserManager = getBrowserManager();
    await browserManager.init();

    let page = null;

    try {
      // Check robots.txt
      const robotsAllowed = await browserManager.checkRobotsTxt(url);
      if (!robotsAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Scraping not allowed by robots.txt",
          },
          { status: 403 }
        );
      }

      // Create page and navigate
      page = await browserManager.newPage();
      await browserManager.goto(page, url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Extract content
      const extractor = new ContentExtractor();
      const extractedContent = await extractor.extractFromPage(page);

      return NextResponse.json({
        success: true,
        data: {
          content: {
            ...extractedContent,
            scrapedAt: extractedContent.scrapedAt.toISOString(),
          },
        },
      });
    } finally {
      // Cleanup
      if (page) {
        await browserManager.closePage(page);
      }
    }
  } catch (error) {
    console.error("Scrape API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
