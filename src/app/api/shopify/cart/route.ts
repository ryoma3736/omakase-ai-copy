/**
 * Shopify Cart API
 * POST /api/shopify/cart/create - Create new cart
 * POST /api/shopify/cart/add - Add items to existing cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCart, addToCart, addProductToCart, getCartSummary } from '@/lib/shopify/cart';

/**
 * POST /api/shopify/cart/create
 * Create a new cart with initial items
 * Body:
 *   - agentId: string (required)
 *   - items: Array<{ variantId: string, quantity: number }> (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, items, productHandle, quantity } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    let checkout;

    // If productHandle is provided, use convenience method
    if (productHandle) {
      checkout = await addProductToCart(agentId, productHandle, quantity || 1);
    } else {
      // Otherwise, require items array
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'items array is required or productHandle must be provided' },
          { status: 400 }
        );
      }

      checkout = await createCart({
        agentId,
        items,
      });
    }

    const summary = getCartSummary(checkout);

    return NextResponse.json({
      success: true,
      checkout: {
        id: checkout.id,
        webUrl: checkout.webUrl,
        totalPrice: checkout.totalPrice,
        currency: checkout.currency,
      },
      summary,
    });
  } catch (error) {
    console.error('Failed to create cart:', error);
    return NextResponse.json(
      {
        error: 'Failed to create cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shopify/cart/add
 * Add items to an existing cart
 * Body:
 *   - agentId: string (required)
 *   - checkoutId: string (required)
 *   - variantId: string (required if productHandle not provided)
 *   - productHandle: string (optional, alternative to variantId)
 *   - quantity: number (required)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, checkoutId, variantId, productHandle, quantity } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    if (!checkoutId) {
      return NextResponse.json({ error: 'checkoutId is required' }, { status: 400 });
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'quantity must be greater than 0' }, { status: 400 });
    }

    let checkout;

    // If productHandle is provided, use convenience method
    if (productHandle) {
      checkout = await addProductToCart(agentId, productHandle, quantity, checkoutId);
    } else {
      // Otherwise, require variantId
      if (!variantId) {
        return NextResponse.json(
          { error: 'variantId or productHandle is required' },
          { status: 400 }
        );
      }

      checkout = await addToCart({
        agentId,
        checkoutId,
        variantId,
        quantity,
      });
    }

    const summary = getCartSummary(checkout);

    return NextResponse.json({
      success: true,
      checkout: {
        id: checkout.id,
        webUrl: checkout.webUrl,
        totalPrice: checkout.totalPrice,
        currency: checkout.currency,
      },
      summary,
    });
  } catch (error) {
    console.error('Failed to add to cart:', error);
    return NextResponse.json(
      {
        error: 'Failed to add to cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
