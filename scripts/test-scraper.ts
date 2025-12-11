/**
 * Test script for the web scraping system
 * Usage: npx tsx scripts/test-scraper.ts [URL]
 */

import { scrapeComplete } from "../src/lib/scraper";

async function main() {
  const testUrl = process.argv[2] || "https://example.com";

  console.log("Starting web scraping test...");
  console.log(`Target URL: ${testUrl}\n`);

  try {
    const result = await scrapeComplete(testUrl, {
      generateFAQs: true,
      analyzeContent: true,
      enhanceProducts: true,
      maxFAQs: 5,
    });

    console.log("=== SCRAPING RESULTS ===\n");

    console.log("Title:", result.content.title);
    console.log("Description:", result.content.description);
    console.log("Content length:", result.content.content.length, "characters");
    console.log("Products found:", result.content.products.length);
    console.log("Images found:", result.content.images.length);
    console.log("Links found:", result.content.links.length);

    if (result.analysis) {
      console.log("\n=== CONTENT ANALYSIS ===");
      console.log("Summary:", result.analysis.summary);
      console.log("Keywords:", result.analysis.keywords.join(", "));
      console.log("Categories:", result.analysis.categories.join(", "));
      console.log("Topics:", result.analysis.topics.join(", "));
      console.log("Sentiment:", result.analysis.sentiment);
      console.log("Language:", result.analysis.language);
    }

    if (result.faqs && result.faqs.length > 0) {
      console.log("\n=== GENERATED FAQS ===");
      result.faqs.forEach((faq, index) => {
        console.log(`\n${index + 1}. ${faq.question}`);
        console.log(`   Category: ${faq.category || "N/A"}`);
        console.log(`   Answer: ${faq.answer.substring(0, 200)}...`);
      });
    }

    if (result.enhancedProducts && result.enhancedProducts.length > 0) {
      console.log("\n=== ENHANCED PRODUCTS ===");
      result.enhancedProducts.slice(0, 3).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Price: ${product.price} ${product.currency || "JPY"}`);
        if (product.generatedDescription) {
          console.log(`   Generated: ${product.generatedDescription}`);
        }
        if (product.suggestedKeywords) {
          console.log(
            `   Keywords: ${product.suggestedKeywords.slice(0, 5).join(", ")}`
          );
        }
      });
    }

    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Error during scraping:", error);
    process.exit(1);
  }
}

main();
