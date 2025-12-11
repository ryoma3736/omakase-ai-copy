/**
 * Vector Embedding Generation Module
 *
 * Gemini Embedding APIを使用してテキストからベクトルembeddingを生成します。
 * Model: embedding-001 (768次元)
 *
 * Gemini embeddingはMTEB多言語ランキング1位で、OpenAIより高精度かつ無料枠あり
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * 単一テキストのembeddingを生成
 *
 * @param text - Embedding化するテキスト
 * @returns 768次元のベクトル配列
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding generation');
  }

  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 複数テキストのembeddingを一括生成
 *
 * @param texts - Embedding化するテキスト配列
 * @returns embeddingベクトル配列
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    throw new Error('Texts array cannot be empty');
  }

  // 空のテキストを除外
  const validTexts = texts.filter(t => t && t.trim().length > 0);
  if (validTexts.length === 0) {
    throw new Error('No valid texts to generate embeddings');
  }

  try {
    // Gemini batch embedding
    const embeddings: number[][] = [];
    for (const text of validTexts) {
      const result = await embeddingModel.embedContent(text);
      embeddings.push(result.embedding.values);
    }
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Embeddingを生成し、使用トークン数も返す
 *
 * @param text - Embedding化するテキスト
 * @returns embedding配列とトークン数（Geminiはトークン数非公開のため推定値）
 */
export async function generateEmbeddingWithUsage(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding generation');
  }

  try {
    const result = await embeddingModel.embedContent(text);

    // Geminiはトークン数を返さないため、文字数から推定（日本語: 約0.5トークン/文字）
    const estimatedTokens = Math.ceil(text.length * 0.5);

    return {
      embedding: result.embedding.values,
      tokens: estimatedTokens,
    };
  } catch (error) {
    console.error('Error generating embedding with usage:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Embeddingの次元数を取得
 * Gemini embedding-001: 768次元
 */
export const EMBEDDING_DIMENSIONS = 768;
