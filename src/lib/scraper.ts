import * as cheerio from "cheerio";
import { generateResponse } from "./claude";

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  content: string;
  links: string[];
  images: string[];
  metadata: Record<string, string>;
}

export interface ExtractedProduct {
  name: string;
  price?: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
  features?: string[];
}

/**
 * Fetch and parse HTML from a URL
 */
export async function fetchPage(url: string): Promise<ScrapedPage> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; OmakaseBot/1.0; +https://omakase-ai-clone.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script and style tags
  $("script, style, noscript").remove();

  // Extract metadata
  const metadata: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property");
    const content = $(el).attr("content");
    if (name && content) {
      metadata[name] = content;
    }
  });

  // Extract links
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      try {
        const absoluteUrl = new URL(href, url).toString();
        links.push(absoluteUrl);
      } catch {
        // Invalid URL, skip
      }
    }
  });

  // Extract images
  const images: string[] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      try {
        const absoluteUrl = new URL(src, url).toString();
        images.push(absoluteUrl);
      } catch {
        // Invalid URL, skip
      }
    }
  });

  // Get page content
  const title = $("title").text().trim() || metadata["og:title"] || "";
  const description =
    metadata["description"] || metadata["og:description"] || "";
  const content = $("body").text().replace(/\s+/g, " ").trim().substring(0, 10000);

  return {
    url,
    title,
    description,
    content,
    links: [...new Set(links)],
    images: [...new Set(images)],
    metadata,
  };
}

/**
 * Extract product information from HTML using Claude AI
 */
export async function extractProducts(
  page: ScrapedPage
): Promise<ExtractedProduct[]> {
  const prompt = `以下のウェブページの情報から、商品情報を抽出してJSON配列形式で返してください。

URL: ${page.url}
タイトル: ${page.title}
説明: ${page.description}

ページ内容:
${page.content.substring(0, 5000)}

以下の形式でJSON配列を返してください。商品が見つからない場合は空の配列 [] を返してください:
[
  {
    "name": "商品名",
    "price": 1000,
    "currency": "JPY",
    "description": "商品の説明",
    "category": "カテゴリ",
    "features": ["特徴1", "特徴2"]
  }
]

JSONのみを返し、他の説明文は含めないでください。`;

  const systemPrompt = `あなたはECサイトの商品情報を抽出する専門家です。
ウェブページの内容から商品情報を正確に抽出し、構造化されたJSONデータとして返してください。
必ず有効なJSON配列のみを返してください。`;

  try {
    const response = await generateResponse(prompt, systemPrompt, {
      temperature: 0.1, // Low temperature for consistent extraction
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const products = JSON.parse(jsonMatch[0]) as ExtractedProduct[];
      return products;
    }
    return [];
  } catch (error) {
    console.error("Failed to extract products:", error);
    return [];
  }
}

/**
 * Extract FAQ and common questions from page content
 */
export async function extractFAQ(
  page: ScrapedPage
): Promise<Array<{ question: string; answer: string }>> {
  const prompt = `以下のウェブページの情報から、よくある質問（FAQ）を抽出してJSON配列形式で返してください。

URL: ${page.url}
タイトル: ${page.title}

ページ内容:
${page.content.substring(0, 5000)}

以下の形式でJSON配列を返してください。FAQが見つからない場合は空の配列 [] を返してください:
[
  {
    "question": "質問",
    "answer": "回答"
  }
]

JSONのみを返し、他の説明文は含めないでください。`;

  const systemPrompt = `あなたはウェブページからFAQ情報を抽出する専門家です。
ページ内容からよくある質問と回答を抽出し、構造化されたJSONデータとして返してください。
必ず有効なJSON配列のみを返してください。`;

  try {
    const response = await generateResponse(prompt, systemPrompt, {
      temperature: 0.1,
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Failed to extract FAQ:", error);
    return [];
  }
}

/**
 * Scrape multiple pages from a website
 */
export async function scrapeWebsite(
  startUrl: string,
  maxPages: number = 10
): Promise<ScrapedPage[]> {
  const visited = new Set<string>();
  const toVisit = [startUrl];
  const pages: ScrapedPage[] = [];
  const baseUrl = new URL(startUrl);

  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift()!;

    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const page = await fetchPage(url);
      pages.push(page);

      // Add internal links to queue
      for (const link of page.links) {
        try {
          const linkUrl = new URL(link);
          if (
            linkUrl.hostname === baseUrl.hostname &&
            !visited.has(link) &&
            !toVisit.includes(link)
          ) {
            toVisit.push(link);
          }
        } catch {
          // Invalid URL, skip
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
    }
  }

  return pages;
}
