"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
}

interface ProductCardProps {
  product: Product;
  onProductClick?: (productId: string) => void;
  primaryColor?: string;
  compact?: boolean;
}

export function ProductCard({
  product,
  onProductClick,
  primaryColor = "#6366f1",
  compact = false,
}: ProductCardProps) {
  const handleClick = () => {
    onProductClick?.(product.id);

    // Track click event
    if (typeof window !== 'undefined' && window.omakase) {
      window.omakase('trackEvent', {
        event: 'product.clicked',
        productId: product.id,
        productName: product.name,
        price: product.price,
      });
    }

    // Open product URL in new tab
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'JPY') {
      return `¥${price.toLocaleString()}`;
    } else if (currency === 'USD') {
      return `$${price.toLocaleString()}`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-white"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {product.imageUrl && (
          <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {product.name}
          </h4>
          <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-0">
        {product.imageUrl && (
          <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {product.category && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700">
                  {product.category}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold" style={{ color: primaryColor }}>
              {formatPrice(product.price, product.currency)}
            </span>
          </div>

          <Button
            onClick={handleClick}
            className="w-full"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            詳細を見る
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProductListProps {
  products: Product[];
  onProductClick?: (productId: string) => void;
  primaryColor?: string;
  compact?: boolean;
  maxItems?: number;
}

export function ProductList({
  products,
  onProductClick,
  primaryColor,
  compact = true,
  maxItems = 3,
}: ProductListProps) {
  const displayProducts = products.slice(0, maxItems);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", !compact && "grid grid-cols-2 gap-3")}>
      {displayProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onProductClick={onProductClick}
          primaryColor={primaryColor}
          compact={compact}
        />
      ))}
    </div>
  );
}

// Type augmentation for window.omakase
declare global {
  interface Window {
    omakase?: (command: string, data?: unknown) => void;
  }
}
