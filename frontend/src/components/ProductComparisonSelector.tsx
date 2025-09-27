import React, { useState, useContext, createContext, ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, GitCompare, ShoppingCart, Star } from "lucide-react";
import { ScrapedProduct } from "@/lib/api";
import { toast } from "sonner";
import { ProductComparisonModal } from "./ProductComparisonModal";

interface ComparisonContextType {
  selectedProducts: ScrapedProduct[];
  addToComparison: (product: ScrapedProduct) => void;
  removeFromComparison: (product: ScrapedProduct) => void;
  clearComparison: () => void;
  isInComparison: (product: ScrapedProduct) => boolean;
  maxProducts: number;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

interface ComparisonProviderProps {
  children: ReactNode;
  maxProducts?: number;
}

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({
  children,
  maxProducts = 4
}) => {
  const [selectedProducts, setSelectedProducts] = useState<ScrapedProduct[]>([]);

  const addToComparison = (product: ScrapedProduct) => {
    if (selectedProducts.length >= maxProducts) {
      toast.error(`Maximum ${maxProducts} products can be compared at once`);
      return;
    }

    // Check if product is already in comparison (by URL to avoid duplicates)
    if (selectedProducts.some(p => p.url === product.url)) {
      toast.warning('Product already in comparison');
      return;
    }

    setSelectedProducts(prev => [...prev, product]);
    toast.success('Product added to comparison');
  };

  const removeFromComparison = (product: ScrapedProduct) => {
    setSelectedProducts(prev => prev.filter(p => p.url !== product.url));
    toast.success('Product removed from comparison');
  };

  const clearComparison = () => {
    setSelectedProducts([]);
    toast.success('Comparison cleared');
  };

  const isInComparison = (product: ScrapedProduct) => {
    return selectedProducts.some(p => p.url === product.url);
  };

  const value = {
    selectedProducts,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    maxProducts
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const ComparisonButton: React.FC<{ product: ScrapedProduct }> = ({ product }) => {
  const { addToComparison, removeFromComparison, isInComparison, selectedProducts, maxProducts } = useComparison();
  const inComparison = isInComparison(product);

  const handleClick = () => {
    if (inComparison) {
      removeFromComparison(product);
    } else {
      addToComparison(product);
    }
  };

  return (
    <Button
      size="sm"
      variant={inComparison ? "default" : "outline"}
      onClick={handleClick}
      disabled={!inComparison && selectedProducts.length >= maxProducts}
      className={`font-medium ${
        inComparison
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
      }`}
    >
      {inComparison ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          In Comparison
        </>
      ) : (
        <>
          <GitCompare className="w-3 h-3 mr-1" />
          Compare ({selectedProducts.length}/{maxProducts})
        </>
      )}
    </Button>
  );
};

export const ComparisonFloatingPanel: React.FC = () => {
  const { selectedProducts, removeFromComparison, clearComparison } = useComparison();

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="fixed bottom-4 right-4 z-50 w-80 bg-slate-900/95 backdrop-blur-md border-slate-700 shadow-2xl">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Compare Products</h3>
              <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                {selectedProducts.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-400 text-red-400 hover:bg-red-400/10"
              onClick={clearComparison}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Products in comparison */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedProducts.map((product, index) => (
              <div key={product.url} className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-400 w-4">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{product.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-cyan-400 capitalize">{product.marketplace}</span>
                    {product.price && (
                      <span className="text-xs text-green-400 font-medium">
                        Rs. {product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-400 text-red-400 hover:bg-red-400/10 h-6 w-6 p-0"
                  onClick={() => removeFromComparison(product)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 mt-4">
            <ProductComparisonModal
              products={selectedProducts}
              trigger={
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  size="sm"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Now
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => {
                selectedProducts.forEach(product => {
                  if (product.url) {
                    window.open(product.url, '_blank');
                  }
                });
                toast.success(`Opened ${selectedProducts.length} product pages`);
              }}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal for comparison (automatically rendered by the button trigger above) */}
      <ProductComparisonModal products={selectedProducts} />
    </>
  );
};

interface ComparisonQuickViewProps {
  product: ScrapedProduct;
  className?: string;
}

export const ComparisonQuickView: React.FC<ComparisonQuickViewProps> = ({
  product,
  className = ""
}) => {
  const { addToComparison, isInComparison } = useComparison();
  const inComparison = isInComparison(product);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <img
          src={product.imageUrl || "/default-avatar.svg"}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm line-clamp-2">{product.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <Badge
              variant="outline"
              className="text-xs capitalize"
              style={{
                borderColor: "#22d3ee",
                color: "#22d3ee"
              }}
            >
              {product.marketplace}
            </Badge>
            {product.price && (
              <span className="text-green-400 font-medium text-sm">
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>
          {product.rating && (
            <div className="flex items-center space-x-1 mt-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-slate-300">{product.rating}/5</span>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant={inComparison ? "default" : "outline"}
          onClick={() => addToComparison(product)}
          disabled={inComparison}
          className={`ml-2 ${inComparison ? "bg-green-600" : ""}`}
        >
          {inComparison ? <Check className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
        </Button>
      </div>
    </Card>
  );
};
