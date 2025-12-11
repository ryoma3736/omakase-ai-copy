import type { Agent, Product, KnowledgeBase } from "@prisma/client";

export interface PersonalityConfig {
  tone: "formal" | "friendly" | "professional" | "casual";
  formalityLevel: number; // 1-10
  emojiUsage: number; // 0-10
  customInstructions?: string;
  greetingMessage?: string;
  farewellMessage?: string;
}

export interface PromptContext {
  agent: Agent;
  products: Product[];
  knowledgeBase: KnowledgeBase[];
  personality?: PersonalityConfig;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal:
    "丁寧語を使い、敬語を適切に使用してください。フォーマルで礼儀正しい対応をしてください。",
  friendly:
    "フレンドリーで親しみやすい口調で話してください。カジュアルな表現も適度に使ってください。",
  professional:
    "専門的で信頼感のある口調で話してください。製品知識を活かした的確なアドバイスを心がけてください。",
  casual:
    "カジュアルでリラックスした口調で話してください。お客様と友達のように会話してください。",
};

/**
 * Generate system prompt for AI agent based on context
 */
export function generateSystemPrompt(context: PromptContext): string {
  const { agent, products, knowledgeBase, personality } = context;

  // Base instructions
  let systemPrompt = `あなたは「${agent.name}」という名前のAI接客アシスタントです。

## あなたの役割
あなたはECサイトの接客AIエージェントとして、お客様の質問に答え、商品をおすすめし、購入をサポートします。

## 担当サイト
${agent.websiteUrl}
${agent.description ? `\n説明: ${agent.description}` : ""}

`;

  // Personality instructions
  if (personality) {
    systemPrompt += `## 口調・性格
${TONE_INSTRUCTIONS[personality.tone] || TONE_INSTRUCTIONS.friendly}
`;

    if (personality.formalityLevel > 7) {
      systemPrompt += `非常に丁寧な言葉遣いを心がけてください。\n`;
    } else if (personality.formalityLevel < 4) {
      systemPrompt += `カジュアルな言葉遣いでOKです。\n`;
    }

    if (personality.emojiUsage > 5) {
      systemPrompt += `適度に絵文字を使って、温かみのある対応をしてください。\n`;
    } else if (personality.emojiUsage === 0) {
      systemPrompt += `絵文字は使わないでください。\n`;
    }

    if (personality.customInstructions) {
      systemPrompt += `\n特別な指示: ${personality.customInstructions}\n`;
    }
  }

  // Product catalog
  if (products.length > 0) {
    systemPrompt += `\n## 取り扱い商品
以下の商品を取り扱っています。お客様の要望に合わせて適切な商品をおすすめしてください。

`;
    products.forEach((product, index) => {
      systemPrompt += `### ${index + 1}. ${product.name}
`;
      if (product.price) {
        systemPrompt += `- 価格: ${product.currency} ${product.price}\n`;
      }
      if (product.description) {
        systemPrompt += `- 説明: ${product.description}\n`;
      }
      if (product.category) {
        systemPrompt += `- カテゴリ: ${product.category}\n`;
      }
      if (product.features && product.features.length > 0) {
        systemPrompt += `- 特徴: ${product.features.join(", ")}\n`;
      }
      if (product.productUrl) {
        systemPrompt += `- 商品ページ: ${product.productUrl}\n`;
      }
      systemPrompt += "\n";
    });
  }

  // Knowledge base context
  if (knowledgeBase.length > 0) {
    systemPrompt += `\n## ナレッジベース
以下の情報を参考にして回答してください。

`;
    knowledgeBase.forEach((kb) => {
      if (kb.status === "READY") {
        systemPrompt += `### ${kb.title}
${kb.content.substring(0, 2000)}${kb.content.length > 2000 ? "..." : ""}

`;
      }
    });
  }

  // Response guidelines
  systemPrompt += `## 回答のガイドライン
1. お客様の質問に対して、的確で役立つ回答をしてください
2. 商品をおすすめする際は、お客様のニーズを理解した上で提案してください
3. 分からないことは正直に伝え、無理に回答しないでください
4. 購入を強要せず、お客様のペースに合わせてください
5. 回答は簡潔にまとめ、必要に応じて詳細を補足してください
6. 商品をおすすめする際は、可能であれば商品ページへのリンクも案内してください

## 禁止事項
- 競合他社の悪口を言うこと
- 虚偽の情報を提供すること
- 個人情報を聞き出すこと
- 政治的・宗教的な話題に関与すること
`;

  return systemPrompt;
}

/**
 * Generate a default personality config
 */
export function getDefaultPersonality(): PersonalityConfig {
  return {
    tone: "friendly",
    formalityLevel: 5,
    emojiUsage: 3,
    greetingMessage: "こんにちは！何かお探しですか？お気軽にご質問ください。",
    farewellMessage:
      "ご質問ありがとうございました！またいつでもお気軽にどうぞ。",
  };
}
