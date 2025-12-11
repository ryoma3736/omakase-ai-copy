/**
 * Shopify Product Management
 * Handles syncing products from Shopify to local database
 */

import { PrismaClient } from '@prisma/client';
import { ShopifyClient, ShopifyProduct } from '../shopify';

const prisma = new PrismaClient();

export interface SyncProductsOptions {
  agentId: string;
  shopifyClient: ShopifyClient;
  limit?: number;
}

export interface SyncResult {
  success: boolean;
  productsAdded: number;
  productsUpdated: number;
  errors: string[];
}

/**
 * Sync products from Shopify to local database
 */
export async function syncProducts(options: SyncProductsOptions): Promise<SyncResult> {
  const { agentId, shopifyClient, limit = 100 } = options;

  const result: SyncResult = {
    success: true,
    productsAdded: 0,
    productsUpdated: 0,
    errors: [],
  };

  try {
    // Get Shopify store configuration
    const shopifyStore = await prisma.shopifyStore.findUnique({
      where: { agentId },
    });

    if (!shopifyStore) {
      throw new Error(`No Shopify store configuration found for agent ${agentId}`);
    }

    // Fetch products from Shopify
    const shopifyProducts = await shopifyClient.getProducts(limit);

    // Sync each product to database
    for (const product of shopifyProducts) {
      try {
        await syncProductToDatabase(shopifyStore.id, product);
        result.productsUpdated++;
      } catch (error) {
        result.errors.push(
          `Failed to sync product ${product.handle}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update store sync timestamp
    await prisma.shopifyStore.update({
      where: { id: shopifyStore.id },
      data: { syncedAt: new Date() },
    });

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Sync a single product to the database (upsert)
 */
async function syncProductToDatabase(
  storeId: string,
  product: ShopifyProduct
): Promise<void> {
  await prisma.shopifyProduct.upsert({
    where: {
      storeId_shopifyId: {
        storeId,
        shopifyId: product.id,
      },
    },
    create: {
      storeId,
      shopifyId: product.id,
      handle: product.handle,
      title: product.title,
      description: product.description || '',
      price: product.price,
      currency: product.currency,
      images: product.images,
      variants: product.variants as any,
      availableForSale: product.availableForSale,
      syncedAt: new Date(),
    },
    update: {
      handle: product.handle,
      title: product.title,
      description: product.description || '',
      price: product.price,
      currency: product.currency,
      images: product.images,
      variants: product.variants as any,
      availableForSale: product.availableForSale,
      syncedAt: new Date(),
    },
  });
}

/**
 * Get all synced products for an agent
 */
export async function getProductsByAgent(agentId: string) {
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
    include: {
      products: {
        orderBy: { syncedAt: 'desc' },
      },
    },
  });

  if (!shopifyStore) {
    return [];
  }

  return shopifyStore.products;
}

/**
 * Get a single product by handle
 */
export async function getProductByHandle(agentId: string, handle: string) {
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
  });

  if (!shopifyStore) {
    return null;
  }

  return prisma.shopifyProduct.findFirst({
    where: {
      storeId: shopifyStore.id,
      handle,
    },
  });
}

/**
 * Search products by title or description
 */
export async function searchProducts(agentId: string, query: string) {
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
  });

  if (!shopifyStore) {
    return [];
  }

  return prisma.shopifyProduct.findMany({
    where: {
      storeId: shopifyStore.id,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { syncedAt: 'desc' },
  });
}

/**
 * Get product recommendations based on user query or context
 */
export async function getProductRecommendations(
  agentId: string,
  userQuery?: string,
  limit: number = 5
) {
  const shopifyStore = await prisma.shopifyStore.findUnique({
    where: { agentId },
  });

  if (!shopifyStore) {
    return [];
  }

  // If user query is provided, search for matching products
  if (userQuery) {
    return prisma.shopifyProduct.findMany({
      where: {
        storeId: shopifyStore.id,
        availableForSale: true,
        OR: [
          { title: { contains: userQuery, mode: 'insensitive' } },
          { description: { contains: userQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { price: 'asc' },
    });
  }

  // Otherwise, return featured/popular products (simple: latest synced)
  return prisma.shopifyProduct.findMany({
    where: {
      storeId: shopifyStore.id,
      availableForSale: true,
    },
    take: limit,
    orderBy: { syncedAt: 'desc' },
  });
}

/**
 * Initialize Shopify store for an agent
 */
export async function initializeShopifyStore(
  agentId: string,
  shopDomain: string,
  storefrontToken: string
) {
  return prisma.shopifyStore.upsert({
    where: { agentId },
    create: {
      agentId,
      shopDomain,
      storefrontToken,
    },
    update: {
      shopDomain,
      storefrontToken,
    },
  });
}
