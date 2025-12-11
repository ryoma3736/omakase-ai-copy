/**
 * Knowledge Base Search API
 *
 * POST /api/knowledge/search - セマンティック検索
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vectorStore } from '@/lib/vector';

/**
 * POST /api/knowledge/search
 * セマンティック検索でKnowledgeBaseを検索
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, query, topK = 5 } = body;

    // バリデーション
    if (!agentId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, query' },
        { status: 400 }
      );
    }

    if (typeof topK !== 'number' || topK < 1 || topK > 20) {
      return NextResponse.json(
        { error: 'topK must be a number between 1 and 20' },
        { status: 400 }
      );
    }

    // Agentの所有権チェック
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent || agent.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 });
    }

    // Vector検索実行
    const searchResults = await vectorStore.search(query, agentId, topK);

    // 結果をフォーマット
    const formattedResults = searchResults.map(result => ({
      id: result.id,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      chunkIndex: result.chunkIndex,
      metadata: {
        documentTitle: result.metadata.documentTitle,
        documentSource: result.metadata.documentSource,
        documentType: result.metadata.documentType,
      },
    }));

    // コンテキスト生成（上位N件を結合）
    const context = formattedResults
      .slice(0, Math.min(3, formattedResults.length)) // 上位3件
      .map(r => `### ${r.metadata.documentTitle}\n${r.content}`)
      .join('\n\n---\n\n');

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
      context,
      stats: {
        resultCount: formattedResults.length,
        avgScore: formattedResults.length > 0
          ? formattedResults.reduce((sum, r) => sum + r.score, 0) / formattedResults.length
          : 0,
      },
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/knowledge/search?agentId=xxx&query=xxx
 * GETでも検索可能（簡易版）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const query = searchParams.get('query');
    const topK = parseInt(searchParams.get('topK') || '5', 10);

    if (!agentId || !query) {
      return NextResponse.json(
        { error: 'Missing required parameters: agentId, query' },
        { status: 400 }
      );
    }

    // Agentの所有権チェック
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent || agent.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 });
    }

    // Vector検索実行
    const searchResults = await vectorStore.search(query, agentId, topK);

    // 結果をフォーマット
    const formattedResults = searchResults.map(result => ({
      id: result.id,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      chunkIndex: result.chunkIndex,
      metadata: {
        documentTitle: result.metadata.documentTitle,
        documentSource: result.metadata.documentSource,
        documentType: result.metadata.documentType,
      },
    }));

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
