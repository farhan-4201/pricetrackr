import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink, Check, X, AlertTriangle } from "lucide-react";
import { ScrapedProduct } from "@/lib/api";
import { LazyImage } from "./LazyImage";

interface ProductComparisonTableProps {
  products: ScrapedProduct[];
  onRemoveProduct?: (product: ScrapedProduct) => void;
  className?: string;
}

interface ComparisonFeature {
  key: string;
  label: string;
  value: (product: ScrapedProduct) => string | number | React.ReactNode;
  priority: number; // Higher priority shows first
  highlight?: (value: string | number | React.ReactNode, product: ScrapedProduct) => boolean;
}

export const ProductComparisonTable: React.FC<ProductComparisonTableProps> = ({
  products,
  onRemoveProduct,
  className = ""
}) => {
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'marketplace'>('price');

  if (products.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white mb-2">No products selected</h3>
        <p className="text-slate-400">Select products from different marketplaces to compare them side by side.</p>
      </Card>
    );
  }

  if (products.length === 1) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white mb-2">Select more products</h3>
        <p className="text-slate-400">Add at least 2 products from different marketplaces to enable comparison.</p>
      </Card>
    );
  }

  // Sort products based on criteria
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price': {
        return (a.price || 0) - (b.price || 0);
      }
      case 'rating': {
        const aRating = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating || '0') || 0;
        const bRating = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating || '0') || 0;
        return bRating - aRating;
      }
      case 'marketplace': {
        return a.marketplace.localeCompare(b.marketplace);
      }
      default:
        return 0;
    }
  });

  // Find best and worst values for highlighting
  const getBestPrice = () => Math.min(...products.map(p => p.price || Infinity).filter(p => p !== Infinity));
  const getBestRating = () => {
    const ratings = products.map(p => {
      const rating = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating || '0') || 0;
      return rating;
    }).filter(r => r > 0);
    return ratings.length > 0 ? Math.max(...ratings) : 0;
  };

  const bestPrice = getBestPrice();
  const bestRating = getBestRating();

  const comparisonFeatures: ComparisonFeature[] = [
    {
      key: 'name',
      label: 'Product',
      priority: 10,
      value: (product) => (
        <div className="flex items-center space-x-3">
          <LazyImage
            src={product.imageUrl || "/default-avatar.svg"}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white text-sm line-clamp-2">{product.name}</h4>
            <p className="text-xs text-slate-400">{product.company || 'Unknown Brand'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'marketplace',
      label: 'Store',
      priority: 9,
      value: (product) => {
        const colors: Record<string, string> = {
          daraz: "#22d3ee",
          priceoye: "#ff4081",
          telemart: "#10b981",
          alibaba: "#ff4081",
          amazon: "#ff9900",
          ebay: "#26a69a"
        };

        return (
          <Badge
            variant="outline"
            className="capitalize font-medium"
            style={{
              borderColor: colors[product.marketplace.toLowerCase()] || "#64748b",
              color: colors[product.marketplace.toLowerCase()] || "#64748b"
            }}
          >
            {product.marketplace}
          </Badge>
        );
      }
    },
    {
      key: 'price',
      label: 'Price',
      priority: 8,
      value: (product) => product.price ? `Rs. ${product.price.toLocaleString()}` : 'N/A',
      highlight: (value, product) => product.price === bestPrice
    },
    {
      key: 'rating',
      label: 'Rating',
      priority: 7,
      value: (product) => {
        const rating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating || '0') || 0;
        return rating > 0 ? (
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-xs text-slate-400">/5</span>
          </div>
        ) : (
          <span className="text-slate-400 text-sm">No rating</span>
        );
      },
      highlight: (_, product) => {
        const rating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating || '0') || 0;
        return rating === bestRating && rating > 0;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      priority: 6,
      value: (product) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
            onClick={() => window.open(product.url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          {onRemoveProduct && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-400 text-red-400 hover:bg-red-400/10"
              onClick={() => onRemoveProduct(product)}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const sortedFeatures = comparisonFeatures.sort((a, b) => b.priority - a.priority);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 bg-slate-900/50 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Product Comparison</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white"
            >
              <option value="price">Price (Low to High)</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="marketplace">Marketplace</option>
            </select>
          </div>
        </div>

        {/* Best deal banner */}
        {bestPrice !== Infinity && (
          <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Best Deal:</span>
              <span className="text-white">Rs. {bestPrice.toLocaleString()}</span>
              <span className="text-slate-400 text-sm">from {products.find(p => p.price === bestPrice)?.marketplace}</span>
            </div>
            {bestRating > 0 && (
              <div className="flex items-center space-x-2 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-yellow-400 font-medium">Highest Rated:</span>
                <span className="text-white">{bestRating}/5</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              {sortedFeatures.map((feature) => (
                <th key={feature.key} className="text-left p-4 text-sm font-medium text-slate-300 uppercase tracking-wider">
                  {feature.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, productIndex) => (
              <tr key={`${product.marketplace}-${product.name}-${productIndex}`} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                {sortedFeatures.map((feature) => {
                  const value = feature.value(product);
                  const isHighlighted = feature.highlight ? feature.highlight(value, product) : false;

                  return (
                    <td key={feature.key} className={`p-4 ${isHighlighted ? 'bg-green-900/10' : ''}`}>
                      {typeof value === 'string' || typeof value === 'number' || React.isValidElement(value) ? (
                        <div className={`${isHighlighted ? 'text-green-400 font-medium' : 'text-white'}`}>
                          {value}
                        </div>
                      ) : (
                        <div className={`${isHighlighted ? 'border-green-400' : ''}`}>
                          {String(value)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
