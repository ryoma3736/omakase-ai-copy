/**
 * Shopify Products API
 * GET /api/shopify/products - List products or search
 * POST /api/shopify/products - Sync products from Shopify
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getProductsByAgent,
  searchProducts,
  syncProducts,
  getProductRecommendations,
} from '@/lib/shopify/products';
import { createShopifyClient } from '@/lib/shopify';

/**
 * GET /api/shopify/products
 * List products or search
 * Query params:
 *   - agentId: string (required)
 *   - search: string (optional)
 *   - recommend: boolean (optional)
 *   - limit: number (optional, for recommendations)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const searchQuery = searchParams.get('search');
    const recommend = searchParams.get('recommend') === 'true';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    // Get recommendations
    if (recommend) {
      const products = await getProductRecommendations(agentId, searchQuery || undefined, limit);
      return NextResponse.json({
        products,
        count: products.length,
      });
    }

    // Search products
    if (searchQuery) {
      const products = await searchProducts(agentId, searchQuery);
      return NextResponse.json({
        products,
        count: products.length,
        query: searchQuery,
      });
    }

    // Get all products
    const products = await getProductsByAgent(agentId);
    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shopify/products
 * Sync products from Shopify Storefront API
 * Body:
 *   - agentId: string (required)
 *   - limit: number (optional, default 100)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, limit = 100 } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    // Create Shopify client from agent's store configuration
    // Note: This requires the ShopifyStore to be already configured in the database
    const shopifyClient = createShopifyClient();

    // Sync products
    const result = await syncProducts({
      agentId,
      shopifyClient,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Product sync failed',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productsAdded: result.productsAdded,
      productsUpdated: result.productsUpdated,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Failed to sync products:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
