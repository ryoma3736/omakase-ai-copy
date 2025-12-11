/**
 * Knowledge Base API
 *
 * POST   /api/knowledge - ドキュメント追加
 * GET    /api/knowledge?agentId=xxx - ドキュメント一覧取得
 * DELETE /api/knowledge?id=xxx - ドキュメント削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vectorStore } from '@/lib/vector';
import type { VectorDocument } from '@/lib/vector';

/**
 * POST /api/knowledge
 * ドキュメントをVector DBに追加
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, title, content, source, sourceUrl, type } = body;

    // バリデーション
    if (!agentId || !title || !content || !source || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, title, content, source, type' },
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

    // VectorDocumentを作成
    const document: VectorDocument = {
      id: `doc_${Date.now()}`,
      content,
      metadata: {
        source,
        type,
        agentId,
        title,
        sourceUrl: sourceUrl || undefined,
      },
    };

    // Vector Storeに保存（チャンク化 + Embedding生成）
    await vectorStore.upsert([document]);

    // 統計情報を取得
    const stats = await vectorStore.getStats(agentId);

    return NextResponse.json({
      success: true,
      message: 'Document added to knowledge base',
      stats,
    });
  } catch (error) {
    console.error('Error adding knowledge document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/knowledge?agentId=xxx
 * Agentのドキュメント一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId parameter' }, { status: 400 });
    }

    // Agentの所有権チェック
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent || agent.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 });
    }

    // ドキュメント一覧を取得
    const documents = await prisma.knowledgeDocument.findMany({
      where: { agentId },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 統計情報を取得
    const stats = await vectorStore.getStats(agentId);

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        sourceUrl: doc.sourceUrl,
        type: doc.type,
        contentLength: doc.content.length,
        chunkCount: doc.chunks.length,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge?id=xxx
 * ドキュメントを削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // ドキュメントの所有権チェック
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
      include: {
        agent: {
          include: { user: true },
        },
      },
    });

    if (!document || document.agent.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 403 });
    }

    // ドキュメント削除
    await vectorStore.delete([documentId]);

    return NextResponse.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
