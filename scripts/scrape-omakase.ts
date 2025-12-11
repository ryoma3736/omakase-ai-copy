import { chromium } from 'playwright';
import * as fs from 'fs';

async function scrapeOmakase() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Scraping omakase.ai...');

  // Main page
  await page.goto('https://www.omakase.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const mainPageContent = await page.content();
  const mainPageText = await page.evaluate(() => document.body.innerText);

  // Take screenshot
  await page.screenshot({ path: '/tmp/omakase-main.png', fullPage: true });

  // Get all styles
  const styles = await page.evaluate(() => {
    const styleSheets = Array.from(document.styleSheets);
    const cssRules: string[] = [];
    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => cssRules.push(rule.cssText));
      } catch (e) {
        // Cross-origin stylesheet
      }
    });
    return cssRules.join('\n');
  });

  // Get computed styles for key elements
  const keyElements = await page.evaluate(() => {
    const elements: Record<string, any> = {};

    // Header/Nav
    const header = document.querySelector('header, nav, [class*="header"], [class*="nav"]');
    if (header) {
      elements.header = {
        html: header.outerHTML,
        classes: header.className,
        computedStyle: window.getComputedStyle(header).cssText
      };
    }

    // Hero section
    const hero = document.querySelector('[class*="hero"], main > section:first-of-type, .hero');
    if (hero) {
      elements.hero = {
        html: hero.outerHTML.substring(0, 5000),
        text: (hero as HTMLElement).innerText
      };
    }

    // All sections
    const sections = document.querySelectorAll('section');
    elements.sections = Array.from(sections).map((s, i) => ({
      index: i,
      classes: s.className,
      text: (s as HTMLElement).innerText.substring(0, 1000)
    }));

    // Footer
    const footer = document.querySelector('footer');
    if (footer) {
      elements.footer = {
        html: footer.outerHTML,
        text: (footer as HTMLElement).innerText
      };
    }

    // Colors used
    const allElements = document.querySelectorAll('*');
    const colors = new Set<string>();
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      colors.add(style.backgroundColor);
      colors.add(style.color);
    });
    elements.colors = Array.from(colors).filter(c => c !== 'rgba(0, 0, 0, 0)');

    // Fonts
    const fonts = new Set<string>();
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      fonts.add(style.fontFamily);
    });
    elements.fonts = Array.from(fonts);

    // Buttons
    const buttons = document.querySelectorAll('button, a[class*="button"], [class*="btn"]');
    elements.buttons = Array.from(buttons).slice(0, 10).map(b => ({
      text: (b as HTMLElement).innerText,
      classes: b.className
    }));

    // Links
    const links = document.querySelectorAll('a');
    elements.links = Array.from(links).slice(0, 20).map(l => ({
      text: (l as HTMLElement).innerText,
      href: l.getAttribute('href')
    }));

    return elements;
  });

  // Pricing page
  console.log('Scraping pricing page...');
  await page.goto('https://www.omakase.ai/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/omakase-pricing.png', fullPage: true });

  const pricingText = await page.evaluate(() => document.body.innerText);
  const pricingHTML = await page.content();

  // Features/Product page
  console.log('Scraping features...');
  await page.goto('https://www.omakase.ai/product', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/omakase-product.png', fullPage: true });

  const productText = await page.evaluate(() => document.body.innerText);

  // About page
  console.log('Scraping about...');
  await page.goto('https://www.omakase.ai/about', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const aboutText = await page.evaluate(() => document.body.innerText);

  await browser.close();

  // Save results
  const results = {
    mainPage: {
      text: mainPageText,
      elements: keyElements
    },
    pricing: {
      text: pricingText
    },
    product: {
      text: productText
    },
    about: {
      text: aboutText
    },
    styles: styles.substring(0, 50000)
  };

  fs.writeFileSync('/tmp/omakase-scrape-results.json', JSON.stringify(results, null, 2));

  console.log('\n=== MAIN PAGE TEXT ===');
  console.log(mainPageText);

  console.log('\n=== PRICING TEXT ===');
  console.log(pricingText);

  console.log('\n=== PRODUCT TEXT ===');
  console.log(productText);

  console.log('\n=== KEY ELEMENTS ===');
  console.log(JSON.stringify(keyElements, null, 2));

  console.log('\nScreenshots saved to /tmp/');
  console.log('Full results saved to /tmp/omakase-scrape-results.json');
}

scrapeOmakase().catch(console.error);
