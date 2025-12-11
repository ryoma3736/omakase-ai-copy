/**
 * Vector Knowledge Base Module
 *
 * Embedding生成、テキスト分割、ベクトル検索を提供
 */

export {
  generateEmbedding,
  generateEmbeddings,
  generateEmbeddingWithUsage,
  EMBEDDING_DIMENSIONS,
  type EmbeddingResult,
} from './embedding';

export {
  splitText,
  splitTextWithMetadata,
  estimateChunkSize,
  getChunkStats,
  type ChunkOptions,
  type Chunk,
} from './chunker';

export {
  SimpleVectorStore,
  vectorStore,
  cosineSimilarity,
  type VectorDocument,
  type SearchResult,
  type UpsertOptions,
} from './store';
