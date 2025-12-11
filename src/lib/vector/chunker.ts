/**
 * Text Chunking Module
 *
 * 長文テキストを適切なサイズのチャンクに分割します。
 * 段落境界を考慮し、オーバーラップを設定可能です。
 */

export interface ChunkOptions {
  chunkSize?: number;     // デフォルト: 1000文字
  chunkOverlap?: number;  // デフォルト: 200文字
  separator?: string;     // デフォルト: '\n\n' (段落区切り)
}

export interface Chunk {
  content: string;
  index: number;
  metadata?: {
    startChar: number;
    endChar: number;
    originalLength: number;
  };
}

/**
 * テキストをチャンクに分割
 *
 * @param text - 分割するテキスト
 * @param options - チャンク設定
 * @returns チャンク配列
 */
export function splitText(text: string, options: ChunkOptions = {}): string[] {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separator = '\n\n',
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // 段落で分割
  const paragraphs = text.split(new RegExp(`${separator}+`)).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();

    // 段落自体がchunkSizeより大きい場合、文単位で分割
    if (trimmedPara.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const sentences = splitBySentence(trimmedPara);
      let sentenceChunk = '';

      for (const sentence of sentences) {
        if ((sentenceChunk + sentence).length > chunkSize && sentenceChunk) {
          chunks.push(sentenceChunk.trim());
          // オーバーラップを適用
          sentenceChunk = sentenceChunk.slice(-chunkOverlap) + sentence;
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
        }
      }

      if (sentenceChunk) {
        currentChunk = sentenceChunk;
      }
      continue;
    }

    // 現在のチャンクに段落を追加すると大きすぎる場合
    if ((currentChunk + separator + trimmedPara).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // オーバーラップを適用
      currentChunk = currentChunk.slice(-chunkOverlap) + separator + trimmedPara;
    } else {
      currentChunk += (currentChunk ? separator : '') + trimmedPara;
    }
  }

  // 残りのチャンクを追加
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * メタデータ付きでチャンクを生成
 *
 * @param text - 分割するテキスト
 * @param options - チャンク設定
 * @returns メタデータ付きチャンク配列
 */
export function splitTextWithMetadata(text: string, options: ChunkOptions = {}): Chunk[] {
  const chunks = splitText(text, options);
  const originalLength = text.length;

  let currentPosition = 0;

  return chunks.map((content, index) => {
    const startChar = currentPosition;
    const endChar = startChar + content.length;
    currentPosition = endChar;

    return {
      content,
      index,
      metadata: {
        startChar,
        endChar,
        originalLength,
      },
    };
  });
}

/**
 * 文単位で分割（日本語・英語対応）
 *
 * @param text - 分割するテキスト
 * @returns 文の配列
 */
function splitBySentence(text: string): string[] {
  // 日本語の句点(。)、英語のピリオド(.?!)で分割
  const sentenceRegex = /([^。.!?]+[。.!?]+)/g;
  const matches = text.match(sentenceRegex);
  const sentences: string[] = matches ? [...matches] : [];

  // マッチしなかった残りの部分を取得
  const remaining = text.replace(sentenceRegex, '').trim();
  if (remaining) {
    sentences.push(remaining);
  }

  return sentences.filter(s => s.trim().length > 0);
}

/**
 * チャンクサイズの推定（バイト数ベース）
 *
 * @param text - テキスト
 * @returns バイト数
 */
export function estimateChunkSize(text: string): number {
  return new Blob([text]).size;
}

/**
 * チャンクの統計情報を取得
 *
 * @param chunks - チャンク配列
 * @returns 統計情報
 */
export function getChunkStats(chunks: string[]): {
  count: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  totalLength: number;
} {
  if (chunks.length === 0) {
    return {
      count: 0,
      avgLength: 0,
      minLength: 0,
      maxLength: 0,
      totalLength: 0,
    };
  }

  const lengths = chunks.map(c => c.length);
  const totalLength = lengths.reduce((sum, len) => sum + len, 0);

  return {
    count: chunks.length,
    avgLength: Math.round(totalLength / chunks.length),
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    totalLength,
  };
}
