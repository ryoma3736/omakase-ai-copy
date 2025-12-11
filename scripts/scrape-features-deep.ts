import { chromium } from 'playwright';
import * as fs from 'fs';

async function scrapeOmakaseFeatures() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Omakase.ai 機能・能力 徹底調査 ===\n');

  const allFeatures: Record<string, any> = {};

  // 1. Main page - Hero section features
  console.log('1. メインページの機能を抽出中...');
  await page.goto('https://www.omakase.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const mainPageFeatures = await page.evaluate(() => {
    const features: string[] = [];
    const allText = document.body.innerText;

    // Get all list items, features, capabilities mentioned
    document.querySelectorAll('li, [class*="feature"], [class*="capability"], p, h2, h3, h4').forEach(el => {
      const text = (el as HTMLElement).innerText.trim();
      if (text && text.length > 10 && text.length < 500) {
        features.push(text);
      }
    });

    return {
      fullText: allText,
      features: [...new Set(features)]
    };
  });
  allFeatures.mainPage = mainPageFeatures;

  // 2. Product/Features page
  console.log('2. Product/Featuresページを調査中...');
  try {
    await page.goto('https://www.omakase.ai/product', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    const productFeatures = await page.evaluate(() => {
      return {
        fullText: document.body.innerText,
        title: document.title
      };
    });
    allFeatures.productPage = productFeatures;
  } catch (e) {
    console.log('  Product page not available');
  }

  // 3. Pricing page - extract all plan features
  console.log('3. Pricingページのプラン詳細を抽出中...');
  await page.goto('https://www.omakase.ai/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/omakase-pricing-detail.png', fullPage: true });

  const pricingFeatures = await page.evaluate(() => {
    const plans: Record<string, any>[] = [];

    // Find all pricing cards
    const cards = document.querySelectorAll('[class*="card"], [class*="plan"], [class*="pricing"]');

    cards.forEach(card => {
      const cardText = (card as HTMLElement).innerText;
      if (cardText.includes('$') || cardText.includes('month') || cardText.includes('Products')) {
        plans.push({
          text: cardText,
          features: cardText.split('\n').filter(line => line.trim().length > 0)
        });
      }
    });

    // Get full page text for complete feature list
    const fullText = document.body.innerText;

    // Extract all bullet points / feature items
    const allFeatureItems: string[] = [];
    document.querySelectorAll('li, [class*="check"], [class*="feature"]').forEach(el => {
      const text = (el as HTMLElement).innerText.trim();
      if (text && text.length > 5 && text.length < 200) {
        allFeatureItems.push(text);
      }
    });

    return {
      fullText,
      plans,
      featureItems: [...new Set(allFeatureItems)]
    };
  });
  allFeatures.pricingPage = pricingFeatures;

  // 4. Documentation / Help / API
  console.log('4. ドキュメント・ヘルプページを調査中...');
  const docUrls = [
    'https://www.omakase.ai/docs',
    'https://www.omakase.ai/help',
    'https://www.omakase.ai/api',
    'https://www.omakase.ai/developers',
    'https://www.omakase.ai/faq'
  ];

  for (const url of docUrls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const content = await page.evaluate(() => document.body.innerText);
      if (content && content.length > 100) {
        allFeatures[url] = content;
        console.log(`  Found: ${url}`);
      }
    } catch (e) {
      // Page doesn't exist
    }
  }

  // 5. About page
  console.log('5. Aboutページを調査中...');
  try {
    await page.goto('https://www.omakase.ai/about', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    const aboutContent = await page.evaluate(() => document.body.innerText);
    allFeatures.aboutPage = aboutContent;
  } catch (e) {
    console.log('  About page not available');
  }

  // 6. Try to find demo or how it works
  console.log('6. Demo/How it worksを調査中...');
  try {
    await page.goto('https://www.omakase.ai/demo', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const demoContent = await page.evaluate(() => document.body.innerText);
    if (demoContent && demoContent.length > 100) {
      allFeatures.demoPage = demoContent;
    }
  } catch (e) {
    // Demo page doesn't exist
  }

  await browser.close();

  // Save raw data
  fs.writeFileSync('/tmp/omakase-features-raw.json', JSON.stringify(allFeatures, null, 2));

  // Parse and display features
  console.log('\n\n========================================');
  console.log('=== Omakase.ai 機能・能力 完全リスト ===');
  console.log('========================================\n');

  // Extract unique features from all pages
  const extractedFeatures = new Set<string>();

  // From main page
  if (allFeatures.mainPage?.fullText) {
    const text = allFeatures.mainPage.fullText;
    console.log('【メインページから抽出した機能】');
    console.log(text);
    console.log('\n');
  }

  // From pricing page
  if (allFeatures.pricingPage?.fullText) {
    console.log('【Pricingページから抽出した機能】');
    console.log(allFeatures.pricingPage.fullText);
    console.log('\n');
  }

  console.log('\n=== 調査完了 ===');
  console.log('Raw data saved to: /tmp/omakase-features-raw.json');
}

scrapeOmakaseFeatures().catch(console.error);
