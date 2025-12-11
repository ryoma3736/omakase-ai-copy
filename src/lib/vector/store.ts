/**
 * Vector Store Implementation
 *
 * シンプルなインメモリベクトル検索（pgvectorなしバージョン）
 * コサイン類似度でセマンティック検索を実行
 */

import { generateEmbedding, generateEmbeddings } from './embedding';
import { splitText } from './chunker';
import { prisma } from '@/lib/prisma';

export interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    type: 'product' | 'faq' | 'page' | 'custom';
    agentId: string;
    title?: string;
    sourceUrl?: string;
  };
}

export interface SearchResult {
  id: string;
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  chunkIndex: number;
}

export interface UpsertOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * コサイン類似度を計算
 *
 * @param a - ベクトルA
 * @param b - ベクトルB
 * @returns 類似度 (0〜1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * SimpleVectorStore クラス
 * Prisma + インメモリコサイン類似度検索
 */
export class SimpleVectorStore {
  /**
   * ドキュメントをチャンク化してVector DBに保存
   *
   * @param documents - 保存するドキュメント配列
   * @param options - チャンク化オプション
   */
  async upsert(documents: VectorDocument[], options: UpsertOptions = {}): Promise<void> {
    const { chunkSize = 1000, chunkOverlap = 200 } = options;

    for (const doc of documents) {
      // ドキュメントをチャンクに分割
      const chunks = splitText(doc.content, { chunkSize, chunkOverlap });

      if (chunks.length === 0) {
        console.warn(`No chunks generated for document ${doc.id}`);
        continue;
      }

      // Embeddingを生成
      const embeddings = await generateEmbeddings(chunks);

      // KnowledgeDocumentを作成
      const knowledgeDoc = await prisma.knowledgeDocument.create({
        data: {
          agentId: doc.metadata.agentId,
          title: doc.metadata.title || 'Untitled Document',
          content: doc.content,
          source: doc.metadata.source,
          sourceUrl: doc.metadata.sourceUrl || null,
          type: doc.metadata.type,
        },
      });

      // KnowledgeChunkを一括作成
      const chunkData = chunks.map((chunk, index) => ({
        documentId: knowledgeDoc.id,
        content: chunk,
        embedding: embeddings[index],
        chunkIndex: index,
        metadata: {
          ...doc.metadata,
          chunkSize,
          chunkOverlap,
        },
      }));

      await prisma.knowledgeChunk.createMany({
        data: chunkData,
      });

      console.log(`Upserted document ${doc.id}: ${chunks.length} chunks`);
    }
  }

  /**
   * セマンティック検索
   *
   * @param query - 検索クエリ
   * @param agentId - Agent ID
   * @param topK - 取得する結果数（デフォルト: 5）
   * @returns 検索結果配列
   */
  async search(query: string, agentId: string, topK = 5): Promise<SearchResult[]> {
    // クエリのEmbeddingを生成
    const queryEmbedding = await generateEmbedding(query);

    // 該当Agentの全チャンクを取得
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        document: {
          agentId,
        },
      },
      include: {
        document: true,
      },
    });

    if (chunks.length === 0) {
      return [];
    }

    // コサイン類似度を計算
    const results = chunks.map(chunk => ({
      id: chunk.id,
      documentId: chunk.documentId,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
      metadata: {
        ...chunk.metadata as Record<string, any>,
        documentTitle: chunk.document.title,
        documentSource: chunk.document.source,
        documentType: chunk.document.type,
      },
      chunkIndex: chunk.chunkIndex,
    }));

    // スコア降順でソートし、上位K件を返す
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * ドキュメント削除
   *
   * @param documentIds - 削除するドキュメントID配列
   */
  async delete(documentIds: string[]): Promise<void> {
    await prisma.knowledgeDocument.deleteMany({
      where: {
        id: {
          in: documentIds,
        },
      },
    });

    console.log(`Deleted ${documentIds.length} documents`);
  }

  /**
   * Agent IDでドキュメントをすべて削除
   *
   * @param agentId - Agent ID
   */
  async deleteByAgent(agentId: string): Promise<void> {
    const result = await prisma.knowledgeDocument.deleteMany({
      where: {
        agentId,
      },
    });

    console.log(`Deleted ${result.count} documents for agent ${agentId}`);
  }

  /**
   * Agentの統計情報を取得
   *
   * @param agentId - Agent ID
   * @returns 統計情報
   */
  async getStats(agentId: string): Promise<{
    documentCount: number;
    chunkCount: number;
    totalContentLength: number;
  }> {
    const documents = await prisma.knowledgeDocument.findMany({
      where: { agentId },
      include: {
        chunks: true,
      },
    });

    const documentCount = documents.length;
    const chunkCount = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);
    const totalContentLength = documents.reduce((sum, doc) => sum + doc.content.length, 0);

    return {
      documentCount,
      chunkCount,
      totalContentLength,
    };
  }
}

/**
 * デフォルトのVector Storeインスタンス
 */
export const vectorStore = new SimpleVectorStore();
