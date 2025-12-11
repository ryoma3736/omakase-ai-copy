import { generateResponse } from "../claude";
import { ExtractedContent } from "./extractor";

export interface FAQ {
  question: string;
  answer: string;
  category?: string;
  confidence?: number;
}

export interface ContentAnalysis {
  summary: string;
  keywords: string[];
  categories: string[];
  sentiment?: "positive" | "neutral" | "negative";
  topics: string[];
  language: string;
}

export interface EnhancedProduct {
  name: string;
  price?: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
  features?: string[];
  generatedDescription?: string;
  suggestedKeywords?: string[];
}

/**
 * AI Analyzer for content analysis and FAQ generation
 * Uses Claude AI to analyze and enhance scraped content
 */
export class AIAnalyzer {
  /**
   * Generate FAQs from content
   */
  async generateFAQs(content: ExtractedContent, count: number = 10): Promise<FAQ[]> {
    const mainText = content.mainContent || content.content;

    if (!mainText || mainText.length < 100) {
      return [];
    }

    const prompt = `以下のウェブページの情報から、顧客がよく質問しそうな内容を${count}個程度のFAQとして生成してください。

URL: ${content.url}
タイトル: ${content.title}
説明: ${content.description}

ページ内容:
${mainText.substring(0, 8000)}

以下の形式でJSON配列を返してください:
[
  {
    "question": "具体的な質問文",
    "answer": "詳細な回答",
    "category": "カテゴリ（例: 商品, 配送, 支払い, etc）"
  }
]

重要:
- 質問は実際に顧客が尋ねそうな自然な表現にしてください
- 回答はページ内容に基づいて正確に記述してください
- カテゴリは適切に分類してください
- JSONのみを返し、他の説明文は含めないでください`;

    const systemPrompt = `あなたはECサイトのカスタマーサポート専門家です。
ウェブページの内容から、顧客が本当に知りたい情報をFAQ形式で抽出します。
必ず有効なJSON配列のみを返してください。`;

    try {
      const response = await generateResponse(prompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 4096,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const faqs = JSON.parse(jsonMatch[0]) as FAQ[];
        return faqs.slice(0, count);
      }
      return [];
    } catch (error) {
      console.error("Failed to generate FAQs:", error);
      return [];
    }
  }

  /**
   * Analyze content and extract insights
   */
  async analyzeContent(content: ExtractedContent): Promise<ContentAnalysis> {
    const mainText = content.mainContent || content.content;

    if (!mainText || mainText.length < 50) {
      return {
        summary: content.description || "",
        keywords: [],
        categories: [],
        topics: [],
        language: "ja",
      };
    }

    const prompt = `以下のウェブページの内容を分析し、構造化されたJSON形式で返してください。

タイトル: ${content.title}
説明: ${content.description}

ページ内容:
${mainText.substring(0, 8000)}

以下の形式でJSONオブジェクトを返してください:
{
  "summary": "ページ内容の簡潔な要約（200文字程度）",
  "keywords": ["重要キーワード1", "重要キーワード2", ...],
  "categories": ["カテゴリ1", "カテゴリ2"],
  "sentiment": "positive/neutral/negative",
  "topics": ["主要トピック1", "主要トピック2", ...],
  "language": "ja/en/etc"
}

重要:
- summaryは内容を正確に要約してください
- keywordsは検索に重要な単語を5-10個選んでください
- categoriesはビジネス分類（EC、サービス、情報など）を1-3個選んでください
- sentimentはページ全体の雰囲気を判定してください
- topicsは主要な話題を3-5個抽出してください
- JSONのみを返し、他の説明文は含めないでください`;

    const systemPrompt = `あなたはウェブコンテンツ分析の専門家です。
ページ内容を深く理解し、構造化された分析結果を提供します。
必ず有効なJSONオブジェクトのみを返してください。`;

    try {
      const response = await generateResponse(prompt, systemPrompt, {
        temperature: 0.1,
        maxTokens: 2048,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]) as ContentAnalysis;
        return analysis;
      }

      // Fallback
      return {
        summary: content.description || "",
        keywords: [],
        categories: [],
        topics: [],
        language: "ja",
      };
    } catch (error) {
      console.error("Failed to analyze content:", error);
      return {
        summary: content.description || "",
        keywords: [],
        categories: [],
        topics: [],
        language: "ja",
      };
    }
  }

  /**
   * Enhance product descriptions using AI
   */
  async enhanceProducts(
    products: Array<{
      name: string;
      price?: number;
      currency?: string;
      description?: string;
      imageUrl?: string;
      productUrl?: string;
      category?: string;
      features?: string[];
    }>,
    pageContext?: string
  ): Promise<EnhancedProduct[]> {
    if (products.length === 0) {
      return [];
    }

    // Process in batches of 5
    const batchSize = 5;
    const enhanced: EnhancedProduct[] = [];

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const prompt = `以下の商品情報を分析し、説明文を改善して、検索キーワードを提案してください。

${pageContext ? `ページ背景情報:\n${pageContext.substring(0, 1000)}\n` : ""}

商品リスト:
${batch.map((p, idx) => `
${idx + 1}. ${p.name}
   価格: ${p.price ? `${p.price} ${p.currency || "JPY"}` : "不明"}
   説明: ${p.description || "なし"}
   カテゴリ: ${p.category || "不明"}
`).join("\n")}

以下の形式でJSON配列を返してください:
[
  {
    "index": 0,
    "generatedDescription": "魅力的で分かりやすい商品説明文（100-200文字）",
    "suggestedKeywords": ["検索キーワード1", "検索キーワード2", ...]
  }
]

重要:
- generatedDescriptionは既存の説明を改善し、商品の魅力を伝えてください
- suggestedKeywordsは検索で見つかりやすいキーワードを5-10個提案してください
- JSONのみを返し、他の説明文は含めないでください`;

      const systemPrompt = `あなたはECサイトの商品マーケティング専門家です。
商品情報を分析し、魅力的な説明文と効果的な検索キーワードを生成します。
必ず有効なJSON配列のみを返してください。`;

      try {
        const response = await generateResponse(prompt, systemPrompt, {
          temperature: 0.3,
          maxTokens: 2048,
        });

        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const enhancements = JSON.parse(jsonMatch[0]) as Array<{
            index: number;
            generatedDescription: string;
            suggestedKeywords: string[];
          }>;

          for (const enhancement of enhancements) {
            const product = batch[enhancement.index];
            if (product) {
              enhanced.push({
                ...product,
                generatedDescription: enhancement.generatedDescription,
                suggestedKeywords: enhancement.suggestedKeywords,
              });
            }
          }
        } else {
          // No enhancement, just copy
          enhanced.push(...batch);
        }
      } catch (error) {
        console.error("Failed to enhance products:", error);
        // Add without enhancement
        enhanced.push(...batch);
      }

      // Rate limiting between batches
      if (i + batchSize < products.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return enhanced;
  }

  /**
   * Extract key information from content
   */
  async extractKeyInfo(
    content: ExtractedContent
  ): Promise<{
    companyName?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    businessHours?: string;
    socialMedia?: {
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  }> {
    const mainText = content.mainContent || content.content;

    const prompt = `以下のウェブページから、企業・店舗の基本情報を抽出してJSON形式で返してください。

URL: ${content.url}
タイトル: ${content.title}

ページ内容:
${mainText.substring(0, 5000)}

以下の形式でJSONオブジェクトを返してください:
{
  "companyName": "企業名または店舗名",
  "contactInfo": {
    "email": "メールアドレス",
    "phone": "電話番号",
    "address": "住所"
  },
  "businessHours": "営業時間",
  "socialMedia": {
    "twitter": "TwitterアカウントURL",
    "facebook": "FacebookアカウントURL",
    "instagram": "InstagramアカウントURL"
  }
}

情報が見つからない場合は該当フィールドを省略してください。
JSONのみを返し、他の説明文は含めないでください。`;

    const systemPrompt = `あなたはウェブページから企業情報を抽出する専門家です。
正確な情報のみを抽出し、推測は避けてください。
必ず有効なJSONオブジェクトのみを返してください。`;

    try {
      const response = await generateResponse(prompt, systemPrompt, {
        temperature: 0.0,
        maxTokens: 1024,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error("Failed to extract key info:", error);
      return {};
    }
  }

  /**
   * Generate chatbot training data from content
   */
  async generateTrainingData(
    content: ExtractedContent,
    faqs: FAQ[]
  ): Promise<Array<{ input: string; output: string; category?: string }>> {
    const trainingData: Array<{
      input: string;
      output: string;
      category?: string;
    }> = [];

    // Add FAQ-based training data
    for (const faq of faqs) {
      trainingData.push({
        input: faq.question,
        output: faq.answer,
        category: faq.category,
      });

      // Generate variations
      const variations = await this.generateQuestionVariations(faq.question);
      for (const variation of variations) {
        trainingData.push({
          input: variation,
          output: faq.answer,
          category: faq.category,
        });
      }
    }

    return trainingData;
  }

  /**
   * Generate question variations for training data
   */
  private async generateQuestionVariations(question: string): Promise<string[]> {
    const prompt = `以下の質問の言い換えバリエーションを3-5個生成してください:

元の質問: ${question}

JSON配列形式で返してください:
["言い換え1", "言い換え2", "言い換え3"]

JSONのみを返してください。`;

    const systemPrompt = `あなたは自然な日本語の言い換え専門家です。
同じ意味の質問を異なる表現で生成します。`;

    try {
      const response = await generateResponse(prompt, systemPrompt, {
        temperature: 0.7,
        maxTokens: 512,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as string[];
      }
      return [];
    } catch (error) {
      console.error("Failed to generate variations:", error);
      return [];
    }
  }
}
