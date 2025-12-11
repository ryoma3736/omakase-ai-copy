/**
 * Vector Embedding Generation Module
 *
 * OpenAI Embedding APIを使用してテキストからベクトルembeddingを生成します。
 * Model: text-embedding-3-small (1536次元)
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * 単一テキストのembeddingを生成
 *
 * @param text - Embedding化するテキスト
 * @returns 1536次元のベクトル配列
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding generation');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
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
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: validTexts,
      encoding_format: 'float',
    });

    return response.data.map(d => d.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Embeddingを生成し、使用トークン数も返す
 *
 * @param text - Embedding化するテキスト
 * @returns embedding配列とトークン数
 */
export async function generateEmbeddingWithUsage(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding generation');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens,
    };
  } catch (error) {
    console.error('Error generating embedding with usage:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Embeddingの次元数を取得
 * text-embedding-3-small: 1536次元
 */
export const EMBEDDING_DIMENSIONS = 1536;
