import React from 'react';
import { AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductResults } from '@/components/ProductResults';
import { ScrapedProduct } from '@/lib/api';
import {
  ProgressiveLoader,
  ProductGridSkeleton,
  LoadingSpinner,
  SearchFormSkeleton,
  Skeleton
} from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

type SearchResultsProps = {
  loading: boolean;
  error: string;
  scrapedProducts: ScrapedProduct[];
  searchQuery: string;
  onRetry: () => void;
};

// Helper function to validate search query
const isValidSearchQuery = (query: string): boolean => {
  if (!query || query.trim().length === 0) return false;
  
  // Check for minimum length
  if (query.trim().length < 2) return false;
  
  // Check if query contains at least some readable characters (letters or numbers)
  const hasReadableChars = /[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(query);
  
  // Check if query is mostly special characters or symbols
  const specialCharRatio = (query.match(/[^a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) || []).length / query.length;
  
  return hasReadableChars && specialCharRatio < 0.7;
};

// Skeleton loader component for product cards
const ProductCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl p-6 border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm"
  >
    <Skeleton className="w-full h-48 rounded-xl mb-4 bg-slate-800/50" />
    <Skeleton className="h-6 w-3/4 mb-3 bg-slate-800/50" />
    <Skeleton className="h-4 w-1/2 mb-4 bg-slate-800/50" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-24 bg-slate-800/50" />
      <Skeleton className="h-10 w-32 rounded-lg bg-slate-800/50" />
    </div>
  </motion.div>
);

export const SearchResults = ({ loading, error, scrapedProducts, searchQuery, onRetry }: SearchResultsProps) => {
  const containerClasses = "text-center py-16 px-6 rounded-2xl bg-slate-900/50 border border-slate-800/50";

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Simple Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">{error}</p>
        <Button onClick={onRetry} className="mt-6" variant="cyber">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (scrapedProducts.length > 0) {
    return <ProductResults query={searchQuery} products={scrapedProducts} />;
  }

  if (searchQuery) {
    // Check if search query is invalid
    if (!isValidSearchQuery(searchQuery)) {
      return (
        <div className={containerClasses}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-xl font-semibold text-white">Invalid Search Query</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            Please enter a valid product name using readable characters. 
            Avoid using only special symbols or unrecognized characters.
          </p>
          <Button onClick={onRetry} className="mt-6" variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Try Different Search
          </Button>
        </div>
      );
    }

    // No products found with valid query
    return (
      <div className={containerClasses}>
        <Search className="w-12 h-12 mx-auto mb-4 text-slate-500" />
        <h3 className="text-xl font-semibold text-white">No Products Found</h3>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          We couldn't find any products matching "<span className="text-white font-medium">{searchQuery}</span>" 
          in available marketplaces.
        </p>
        <p className="text-slate-500 text-sm mt-3">
          Try using different keywords or check your spelling.
        </p>
        <Button onClick={onRetry} className="mt-6" variant="outline">
          <Search className="w-4 h-4 mr-2" />
          Try Another Search
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Search className="w-12 h-12 mx-auto mb-4 text-slate-500" />
      <h3 className="text-xl font-semibold text-white">Search for Products</h3>
      <p className="text-slate-400 mt-2">Enter a product name to find deals across all marketplaces.</p>
    </div>
  );
};