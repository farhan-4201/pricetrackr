import React, { useState, useContext, createContext, ReactNode } from 'react';
import { ScrapedProduct } from "@/lib/api";
import { toast } from "sonner";

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
