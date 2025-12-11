/**
 * Shopify Storefront API Client
 * Handles GraphQL queries to Shopify Storefront API
 */

export interface ShopifyConfig {
  shopDomain: string;
  storefrontAccessToken: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  price: number;
  currency: string;
  images: string[];
  variants: ShopifyVariant[];
  availableForSale: boolean;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: number;
  currency: string;
  availableForSale: boolean;
  quantityAvailable?: number;
}

export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  lineItems: ShopifyLineItem[];
  totalPrice: number;
  currency: string;
}

export interface ShopifyLineItem {
  variantId: string;
  quantity: number;
  title?: string;
  price?: number;
}

export class ShopifyClient {
  private shopDomain: string;
  private storefrontAccessToken: string;
  private apiVersion: string = '2024-10';

  constructor(config: ShopifyConfig) {
    this.shopDomain = config.shopDomain;
    this.storefrontAccessToken = config.storefrontAccessToken;
  }

  /**
   * Execute a GraphQL query against Shopify Storefront API
   */
  private async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const endpoint = `https://${this.shopDomain}/api/${this.apiVersion}/graphql.json`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
    }

    return json.data as T;
  }

  /**
   * Fetch all products from the store
   */
  async getProducts(limit: number = 20): Promise<ShopifyProduct[]> {
    const query = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              description
              handle
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                  }
                }
              }
              availableForSale
            }
          }
        }
      }
    `;

    const data = await this.query<{
      products: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            description: string;
            handle: string;
            priceRange: {
              minVariantPrice: {
                amount: string;
                currencyCode: string;
              };
            };
            images: {
              edges: Array<{
                node: {
                  url: string;
                  altText: string;
                };
              }>;
            };
            variants: {
              edges: Array<{
                node: {
                  id: string;
                  title: string;
                  price: {
                    amount: string;
                    currencyCode: string;
                  };
                  availableForSale: boolean;
                  quantityAvailable?: number;
                };
              }>;
            };
            availableForSale: boolean;
          };
        }>;
      };
    }>(query, { first: limit });

    return data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      handle: node.handle,
      price: parseFloat(node.priceRange.minVariantPrice.amount),
      currency: node.priceRange.minVariantPrice.currencyCode,
      images: node.images.edges.map((img) => img.node.url),
      variants: node.variants.edges.map(({ node: variant }) => ({
        id: variant.id,
        title: variant.title,
        price: parseFloat(variant.price.amount),
        currency: variant.price.currencyCode,
        availableForSale: variant.availableForSale,
        quantityAvailable: variant.quantityAvailable,
      })),
      availableForSale: node.availableForSale,
    }));
  }

  /**
   * Fetch a single product by handle
   */
  async getProduct(handle: string): Promise<ShopifyProduct | null> {
    const query = `
      query getProduct($handle: String!) {
        product(handle: $handle) {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
              }
            }
          }
          availableForSale
        }
      }
    `;

    const data = await this.query<{
      product: {
        id: string;
        title: string;
        description: string;
        handle: string;
        priceRange: {
          minVariantPrice: {
            amount: string;
            currencyCode: string;
          };
        };
        images: {
          edges: Array<{
            node: {
              url: string;
              altText: string;
            };
          }>;
        };
        variants: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              price: {
                amount: string;
                currencyCode: string;
              };
              availableForSale: boolean;
              quantityAvailable?: number;
            };
          }>;
        };
        availableForSale: boolean;
      } | null;
    }>(query, { handle });

    if (!data.product) {
      return null;
    }

    const product = data.product;

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      handle: product.handle,
      price: parseFloat(product.priceRange.minVariantPrice.amount),
      currency: product.priceRange.minVariantPrice.currencyCode,
      images: product.images.edges.map((img) => img.node.url),
      variants: product.variants.edges.map(({ node: variant }) => ({
        id: variant.id,
        title: variant.title,
        price: parseFloat(variant.price.amount),
        currency: variant.price.currencyCode,
        availableForSale: variant.availableForSale,
        quantityAvailable: variant.quantityAvailable,
      })),
      availableForSale: product.availableForSale,
    };
  }

  /**
   * Create a checkout (cart)
   */
  async createCheckout(lineItems: ShopifyLineItem[]): Promise<ShopifyCheckout> {
    const query = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            lineItems(first: 250) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            totalPrice {
              amount
              currencyCode
            }
          }
          checkoutUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const input = {
      lineItems: lineItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };

    const data = await this.query<{
      checkoutCreate: {
        checkout: {
          id: string;
          webUrl: string;
          lineItems: {
            edges: Array<{
              node: {
                id: string;
                title: string;
                quantity: number;
                variant: {
                  id: string;
                  price: {
                    amount: string;
                    currencyCode: string;
                  };
                };
              };
            }>;
          };
          totalPrice: {
            amount: string;
            currencyCode: string;
          };
        };
        checkoutUserErrors: Array<{
          code: string;
          field: string[];
          message: string;
        }>;
      };
    }>(query, { input });

    if (data.checkoutCreate.checkoutUserErrors.length > 0) {
      throw new Error(
        `Checkout creation failed: ${data.checkoutCreate.checkoutUserErrors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const checkout = data.checkoutCreate.checkout;

    return {
      id: checkout.id,
      webUrl: checkout.webUrl,
      lineItems: checkout.lineItems.edges.map(({ node }) => ({
        variantId: node.variant.id,
        quantity: node.quantity,
        title: node.title,
        price: parseFloat(node.variant.price.amount),
      })),
      totalPrice: parseFloat(checkout.totalPrice.amount),
      currency: checkout.totalPrice.currencyCode,
    };
  }

  /**
   * Add line items to an existing checkout
   */
  async addToCart(
    checkoutId: string,
    variantId: string,
    quantity: number
  ): Promise<ShopifyCheckout> {
    const query = `
      mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
        checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
          checkout {
            id
            webUrl
            lineItems(first: 250) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            totalPrice {
              amount
              currencyCode
            }
          }
          checkoutUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const data = await this.query<{
      checkoutLineItemsAdd: {
        checkout: {
          id: string;
          webUrl: string;
          lineItems: {
            edges: Array<{
              node: {
                id: string;
                title: string;
                quantity: number;
                variant: {
                  id: string;
                  price: {
                    amount: string;
                    currencyCode: string;
                  };
                };
              };
            }>;
          };
          totalPrice: {
            amount: string;
            currencyCode: string;
          };
        };
        checkoutUserErrors: Array<{
          code: string;
          field: string[];
          message: string;
        }>;
      };
    }>(query, {
      checkoutId,
      lineItems: [{ variantId, quantity }],
    });

    if (data.checkoutLineItemsAdd.checkoutUserErrors.length > 0) {
      throw new Error(
        `Add to cart failed: ${data.checkoutLineItemsAdd.checkoutUserErrors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const checkout = data.checkoutLineItemsAdd.checkout;

    return {
      id: checkout.id,
      webUrl: checkout.webUrl,
      lineItems: checkout.lineItems.edges.map(({ node }) => ({
        variantId: node.variant.id,
        quantity: node.quantity,
        title: node.title,
        price: parseFloat(node.variant.price.amount),
      })),
      totalPrice: parseFloat(checkout.totalPrice.amount),
      currency: checkout.totalPrice.currencyCode,
    };
  }
}

/**
 * Create a Shopify client instance from environment variables
 */
export function createShopifyClient(config?: ShopifyConfig): ShopifyClient {
  const shopDomain = config?.shopDomain || process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontAccessToken =
    config?.storefrontAccessToken || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!shopDomain || !storefrontAccessToken) {
    throw new Error(
      'Shopify configuration missing. Provide SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN'
    );
  }

  return new ShopifyClient({
    shopDomain,
    storefrontAccessToken,
  });
}
