/**
 * Shopify Cart Management
 * Handles checkout creation and cart operations
 */

import { ShopifyClient, ShopifyLineItem, ShopifyCheckout } from '../shopify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCartOptions {
  agentId: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

export interface AddToCartOptions {
  agentId: string;
  checkoutId: string;
  variantId: string;
  quantity: number;
}

/**
 * Create a new cart (checkout) with initial items
 */
export async function createCart(options: CreateCartOptions): Promise<ShopifyCheckout> {
  const { agentId, items } = options;

  // Get Shopify store configuration
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
  });

  if (!shopifyStore) {
    throw new Error(`No Shopify store configuration found for agent ${agentId}`);
  }

  // Create Shopify client
  const shopifyClient = new ShopifyClient({
    shopDomain: shopifyStore.shopDomain,
    storefrontAccessToken: shopifyStore.storefrontToken,
  });

  // Create checkout with line items
  const lineItems: ShopifyLineItem[] = items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));

  const checkout = await shopifyClient.createCheckout(lineItems);

  return checkout;
}

/**
 * Add items to an existing cart
 */
export async function addToCart(options: AddToCartOptions): Promise<ShopifyCheckout> {
  const { agentId, checkoutId, variantId, quantity } = options;

  // Get Shopify store configuration
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
  });

  if (!shopifyStore) {
    throw new Error(`No Shopify store configuration found for agent ${agentId}`);
  }

  // Create Shopify client
  const shopifyClient = new ShopifyClient({
    shopDomain: shopifyStore.shopDomain,
    storefrontAccessToken: shopifyStore.storefrontToken,
  });

  // Add item to checkout
  const checkout = await shopifyClient.addToCart(checkoutId, variantId, quantity);

  return checkout;
}

/**
 * Add a product to cart by handle (convenience method)
 */
export async function addProductToCart(
  agentId: string,
  productHandle: string,
  quantity: number = 1,
  checkoutId?: string
): Promise<ShopifyCheckout> {
  // Get Shopify store configuration
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
  });

  if (!shopifyStore) {
    throw new Error(`No Shopify store configuration found for agent ${agentId}`);
  }

  // Get product from database to find variant ID
  const product = await prisma.shopifyProduct.findFirst({
    where: {
      storeId: shopifyStore.id,
      handle: productHandle,
    },
  });

  if (!product) {
    throw new Error(`Product with handle "${productHandle}" not found`);
  }

  // Get the first available variant
  const variants = product.variants as Array<{
    id: string;
    title: string;
    price: number;
    availableForSale: boolean;
  }>;

  const availableVariant = variants.find((v) => v.availableForSale);

  if (!availableVariant) {
    throw new Error(`No available variant found for product "${productHandle}"`);
  }

  // If checkoutId provided, add to existing cart
  if (checkoutId) {
    return addToCart({
      agentId,
      checkoutId,
      variantId: availableVariant.id,
      quantity,
    });
  }

  // Otherwise, create new cart
  return createCart({
    agentId,
    items: [
      {
        variantId: availableVariant.id,
        quantity,
      },
    ],
  });
}

/**
 * Get checkout URL for user to complete purchase
 */
export function getCheckoutUrl(checkout: ShopifyCheckout): string {
  return checkout.webUrl;
}

/**
 * Calculate cart summary
 */
export interface CartSummary {
  itemCount: number;
  totalPrice: number;
  currency: string;
  items: Array<{
    title?: string;
    quantity: number;
    price?: number;
  }>;
}

export function getCartSummary(checkout: ShopifyCheckout): CartSummary {
  const itemCount = checkout.lineItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    itemCount,
    totalPrice: checkout.totalPrice,
    currency: checkout.currency,
    items: checkout.lineItems.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}
