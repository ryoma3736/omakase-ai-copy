# AI-Powered Web Scraping System

A comprehensive web scraping system with AI-driven content analysis, FAQ generation, and product enhancement capabilities.

## Features

### Core Scraping
- **Playwright Integration**: JavaScript-heavy site support with browser automation
- **Static HTML Scraping**: Fast cheerio-based extraction for static pages
- **Dynamic Content**: Handles SPA and dynamically loaded content
- **Robots.txt Compliance**: Automatic robots.txt checking
- **Rate Limiting**: Built-in rate limiting and delays

### Content Extraction
- Metadata extraction (Open Graph, Twitter Cards, etc.)
- Structured data parsing (JSON-LD, microdata)
- Product information extraction
- Image and link collection
- Main content isolation using heuristics

### AI Analysis (Claude Sonnet 4)
- **FAQ Generation**: Automatically generate customer FAQs from content
- **Content Analysis**: Summarization, keyword extraction, sentiment analysis
- **Product Enhancement**: AI-generated product descriptions and keywords
- **Key Information Extraction**: Company info, contact details, social media

## Architecture

```
src/lib/scraper/
├── browser.ts         # Playwright browser management
├── extractor.ts       # Content extraction logic
├── analyzer.ts        # AI-powered analysis
└── index.ts          # Public exports
```

## Usage

### Basic Scraping

```typescript
import { scrapeWithPlaywright } from '@/lib/scraper';

const content = await scrapeWithPlaywright('https://example.com');
console.log(content.title);
console.log(content.products);
```

### FAQ Generation

```typescript
import { scrapeAndGenerateFAQs } from '@/lib/scraper';

const { content, faqs } = await scrapeAndGenerateFAQs(
  'https://example.com',
  10 // max FAQs
);

faqs.forEach(faq => {
  console.log(`Q: ${faq.question}`);
  console.log(`A: ${faq.answer}`);
});
```

### Content Analysis

```typescript
import { scrapeAndAnalyze } from '@/lib/scraper';

const { content, analysis } = await scrapeAndAnalyze('https://example.com');

console.log('Summary:', analysis.summary);
console.log('Keywords:', analysis.keywords);
console.log('Sentiment:', analysis.sentiment);
```

### Product Enhancement

```typescript
import { scrapeAndEnhanceProducts } from '@/lib/scraper';

const { content, enhancedProducts } = await scrapeAndEnhanceProducts(
  'https://shop.example.com'
);

enhancedProducts.forEach(product => {
  console.log(product.name);
  console.log(product.generatedDescription);
  console.log(product.suggestedKeywords);
});
```

### Complete Scraping (All Features)

```typescript
import { scrapeComplete } from '@/lib/scraper';

const result = await scrapeComplete('https://example.com', {
  generateFAQs: true,
  analyzeContent: true,
  enhanceProducts: true,
  maxFAQs: 10,
});

// Access all results
console.log(result.content);    // Scraped content
console.log(result.faqs);        // Generated FAQs
console.log(result.analysis);    // Content analysis
console.log(result.enhancedProducts); // Enhanced products
```

## API Endpoint

### POST /api/scrape

Scrape a URL with optional AI analysis.

**Request:**
```json
{
  "url": "https://example.com",
  "generateFAQ": true,
  "analyzeContent": true,
  "enhanceProducts": true,
  "maxFAQs": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": {
      "url": "https://example.com",
      "title": "Example Site",
      "description": "...",
      "content": "...",
      "products": [...],
      "images": [...],
      "links": [...],
      "metadata": {...},
      "scrapedAt": "2025-01-01T00:00:00.000Z"
    },
    "faqs": [...],
    "analysis": {...},
    "enhancedProducts": [...]
  }
}
```

### GET /api/scrape?url=...

Quick scrape without AI analysis.

**Example:**
```bash
curl "http://localhost:3000/api/scrape?url=https://example.com"
```

## Testing

### Test Script

```bash
# Test with default URL (example.com)
npx tsx scripts/test-scraper.ts

# Test with custom URL
npx tsx scripts/test-scraper.ts https://your-site.com
```

### API Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "generateFAQ": true,
    "analyzeContent": true
  }'
```

## Configuration

### Browser Settings

Edit `src/lib/scraper/browser.ts` to customize browser behavior:

```typescript
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```

### AI Settings

Edit `src/lib/scraper/analyzer.ts` to adjust AI generation:

```typescript
const response = await generateResponse(prompt, systemPrompt, {
  temperature: 0.2,  // Lower = more consistent
  maxTokens: 4096,   // Max response length
});
```

## Rate Limiting & Ethics

- **Robots.txt Compliance**: Automatically checks and respects robots.txt
- **Rate Limiting**: Built-in 1-second delay between requests
- **User Agent**: Custom user agent identifying the bot
- **Timeout Handling**: 30-second default timeout for page loads

## Error Handling

All functions throw errors for:
- Invalid URLs
- Network failures
- Robots.txt blocking
- Timeout exceeded
- AI API errors

Always wrap calls in try-catch:

```typescript
try {
  const result = await scrapeComplete(url);
} catch (error) {
  console.error('Scraping failed:', error);
}
```

## Performance

- **Static Pages**: ~1-2 seconds
- **Dynamic Pages**: ~3-5 seconds
- **With AI Analysis**: +2-5 seconds
- **With FAQ Generation**: +3-7 seconds

## Limitations

1. **JavaScript Rendering**: Limited to Playwright capabilities
2. **AI Token Limits**: Max 8,000 tokens per content piece
3. **Rate Limits**: Claude API rate limits apply
4. **Memory**: Browser instances consume memory
5. **Authentication**: Does not handle login-required pages

## Dependencies

- `playwright`: Browser automation
- `cheerio`: HTML parsing (fallback)
- `@anthropic-ai/sdk`: Claude AI integration
- Next.js 14+ with App Router

## Environment Variables

```bash
# Required
CLAUDE_API_KEY=your_claude_api_key

# Optional (for enhanced features)
OPENAI_API_KEY=your_openai_api_key  # Future use
```

## Examples

See `/scripts/test-scraper.ts` for a complete working example.

## Troubleshooting

### Playwright Installation Issues

```bash
# Install Playwright browsers
npx playwright install chromium
```

### Memory Issues

The browser manager automatically closes pages and cleans up resources. For long-running scrapes, manually close the browser:

```typescript
import { getBrowserManager } from '@/lib/scraper';

const browser = getBrowserManager();
await browser.init();

// ... scraping operations ...

await browser.close(); // Manual cleanup
```

### Timeout Errors

Increase timeout for slow sites:

```typescript
const content = await scrapeWithPlaywright(url, {
  timeout: 60000, // 60 seconds
});
```

## Future Enhancements

- [ ] Proxy support
- [ ] Cookie management
- [ ] Authentication handling
- [ ] Incremental scraping (only changed content)
- [ ] Webhook notifications
- [ ] Scheduled scraping
- [ ] Multi-language FAQ generation
- [ ] Visual similarity detection
- [ ] Screenshot comparison

## License

See main project LICENSE file.
