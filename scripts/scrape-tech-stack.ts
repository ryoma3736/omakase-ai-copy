import { chromium } from 'playwright';

async function scrapeTechStack() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Omakase.ai 技術スタック・API調査 ===\n');

  // Intercept network requests
  const apiCalls: string[] = [];
  const externalServices: Set<string> = new Set();

  page.on('request', request => {
    const url = request.url();
    if (!url.includes('omakase.ai') && !url.includes('localhost')) {
      externalServices.add(new URL(url).hostname);
    }
    if (url.includes('/api/') || url.includes('graphql')) {
      apiCalls.push(`${request.method()} ${url}`);
    }
  });

  console.log('1. メインページのネットワークリクエストを監視中...');
  await page.goto('https://www.omakase.ai', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Get page source for tech detection
  const pageSource = await page.content();

  // Detect technologies from HTML
  const techDetection = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const detected: Record<string, boolean> = {};

    // Framework detection
    detected['Next.js'] = html.includes('__NEXT') || html.includes('_next');
    detected['React'] = html.includes('react') || html.includes('__react');
    detected['Vue'] = html.includes('__vue') || html.includes('v-');
    detected['Angular'] = html.includes('ng-') || html.includes('angular');

    // Analytics & Tracking
    detected['Google Analytics'] = html.includes('gtag') || html.includes('google-analytics');
    detected['Google Tag Manager'] = html.includes('googletagmanager');
    detected['Segment'] = html.includes('segment.com') || html.includes('analytics.js');
    detected['Mixpanel'] = html.includes('mixpanel');
    detected['Hotjar'] = html.includes('hotjar');
    detected['Intercom'] = html.includes('intercom');
    detected['Crisp'] = html.includes('crisp.chat');

    // Payment
    detected['Stripe'] = html.includes('stripe.com') || html.includes('js.stripe');
    detected['PayPal'] = html.includes('paypal');

    // Auth
    detected['Auth0'] = html.includes('auth0');
    detected['Firebase Auth'] = html.includes('firebase') && html.includes('auth');
    detected['Clerk'] = html.includes('clerk');

    // AI/Voice Services
    detected['OpenAI'] = html.includes('openai');
    detected['ElevenLabs'] = html.includes('elevenlabs');
    detected['Deepgram'] = html.includes('deepgram');
    detected['AssemblyAI'] = html.includes('assemblyai');
    detected['Whisper'] = html.includes('whisper');
    detected['Vapi'] = html.includes('vapi');
    detected['Play.ht'] = html.includes('play.ht');

    // Database/Backend
    detected['Supabase'] = html.includes('supabase');
    detected['Firebase'] = html.includes('firebase');
    detected['Prisma'] = html.includes('prisma');
    detected['MongoDB'] = html.includes('mongodb');

    // CDN/Hosting
    detected['Vercel'] = html.includes('vercel');
    detected['Cloudflare'] = html.includes('cloudflare');
    detected['AWS'] = html.includes('amazonaws');

    // Other services
    detected['Shopify'] = html.includes('shopify') || html.includes('myshopify');
    detected['Rewardful'] = html.includes('rewardful');
    detected['Reddit Pixel'] = html.includes('rdt');
    detected['LinkedIn Pixel'] = html.includes('linkedin') && html.includes('insight');

    return detected;
  });

  // Check for specific script tags
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
  });

  // Check meta tags
  const metaTags = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.getAttribute('name'),
      property: m.getAttribute('property'),
      content: m.getAttribute('content')
    }));
  });

  // Try to access widget/chat functionality
  console.log('\n2. チャットウィジェットのAPI調査中...');

  // Look for widget initialization
  const widgetInfo = await page.evaluate(() => {
    // @ts-ignore
    const win = window as any;
    return {
      hasOmakaseWidget: typeof win.Omakase !== 'undefined',
      hasVapi: typeof win.Vapi !== 'undefined',
      hasIntercom: typeof win.Intercom !== 'undefined',
      hasCrisp: typeof win.$crisp !== 'undefined',
      globalVars: Object.keys(win).filter(k =>
        k.toLowerCase().includes('omakase') ||
        k.toLowerCase().includes('voice') ||
        k.toLowerCase().includes('chat') ||
        k.toLowerCase().includes('widget') ||
        k.toLowerCase().includes('ai')
      )
    };
  });

  await browser.close();

  // Output results
  console.log('\n========================================');
  console.log('=== 検出された技術スタック ===');
  console.log('========================================\n');

  console.log('【フレームワーク & ライブラリ】');
  Object.entries(techDetection).forEach(([tech, detected]) => {
    if (detected && ['Next.js', 'React', 'Vue', 'Angular'].includes(tech)) {
      console.log(`  ✓ ${tech}`);
    }
  });

  console.log('\n【アナリティクス & トラッキング】');
  Object.entries(techDetection).forEach(([tech, detected]) => {
    if (detected && ['Google Analytics', 'Google Tag Manager', 'Segment', 'Mixpanel', 'Hotjar', 'Reddit Pixel', 'LinkedIn Pixel', 'Rewardful'].includes(tech)) {
      console.log(`  ✓ ${tech}`);
    }
  });

  console.log('\n【決済】');
  Object.entries(techDetection).forEach(([tech, detected]) => {
    if (detected && ['Stripe', 'PayPal'].includes(tech)) {
      console.log(`  ✓ ${tech}`);
    }
  });

  console.log('\n【AI/Voice サービス】');
  Object.entries(techDetection).forEach(([tech, detected]) => {
    if (detected && ['OpenAI', 'ElevenLabs', 'Deepgram', 'AssemblyAI', 'Whisper', 'Vapi', 'Play.ht'].includes(tech)) {
      console.log(`  ✓ ${tech}`);
    }
  });

  console.log('\n【外部サービス接続先】');
  externalServices.forEach(service => {
    console.log(`  - ${service}`);
  });

  console.log('\n【スクリプトURL】');
  scripts.filter(s => s).slice(0, 20).forEach(script => {
    console.log(`  - ${script}`);
  });

  console.log('\n【ウィジェット情報】');
  console.log(JSON.stringify(widgetInfo, null, 2));

  console.log('\n【検出APIコール】');
  apiCalls.forEach(call => {
    console.log(`  - ${call}`);
  });

  // Summary
  console.log('\n========================================');
  console.log('=== 推定される必要なAPI/サービス ===');
  console.log('========================================\n');

  console.log('【必須】');
  console.log('  1. AI/LLM API (OpenAI, Anthropic, etc.) - チャット応答生成');
  console.log('  2. Voice AI API (ElevenLabs, Deepgram, Vapi) - 音声合成/認識');
  console.log('  3. Stripe - 決済処理');
  console.log('  4. Database (PostgreSQL/Supabase) - データ保存');
  console.log('  5. Shopify API - ストア連携');

  console.log('\n【オプション】');
  console.log('  - Web Scraping API - サイト自動学習');
  console.log('  - Vector Database (Pinecone, etc.) - ナレッジベース');
  console.log('  - Analytics (Google Analytics, Segment)');
}

scrapeTechStack().catch(console.error);
