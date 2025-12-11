import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Capturing clone screenshots...');

  // Clone main page
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/clone-main.png', fullPage: true });
  console.log('Captured: /tmp/clone-main.png');

  // Clone pricing page
  await page.goto('http://localhost:3000/pricing', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/clone-pricing.png', fullPage: true });
  console.log('Captured: /tmp/clone-pricing.png');

  await browser.close();
  console.log('\nScreenshots saved!');
  console.log('Compare with original:');
  console.log('  - /tmp/omakase-main.png vs /tmp/clone-main.png');
  console.log('  - /tmp/omakase-pricing.png vs /tmp/clone-pricing.png');
}

captureScreenshots().catch(console.error);
