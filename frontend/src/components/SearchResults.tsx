import React from 'react';
import { AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductResults } from '@/components/ProductResults';
import { ScrapedProduct } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type SearchResultsProps = {
  loading: boolean;
  error: string;
  scrapedProducts: ScrapedProduct[];
  searchQuery: string;
  onRetry: () => void;
};

// Skeleton loader for product cards
const ProductCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl p-6 border border-gray-300 dark:border-slate-800/50 
               bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm"
  >
    <Skeleton className="w-full h-48 rounded-xl mb-4 bg-gray-200 dark:bg-slate-800/50" />
    <Skeleton className="h-6 w-3/4 mb-3 bg-gray-200 dark:bg-slate-800/50" />
    <Skeleton className="h-4 w-1/2 mb-4 bg-gray-200 dark:bg-slate-800/50" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-slate-800/50" />
      <Skeleton className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-slate-800/50" />
    </div>
  </motion.div>
);

export const SearchResults = ({ loading, error, scrapedProducts, searchQuery, onRetry }: SearchResultsProps) => {
  const containerClasses =
    'text-center py-20 px-8 rounded-3xl border backdrop-blur-sm flex flex-col items-center justify-center min-h-[500px] ' +
    'bg-white/70 border-gray-300 text-gray-800 shadow-sm ' +
    'dark:bg-slate-900/50 dark:border-slate-800/50 dark:text-white';

  if (loading) {
    return (
      <div className="space-y-6 mt-8">
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
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500 dark:text-red-400" />
        <h3 className="text-2xl font-semibold text-red-600 dark:text-red-400">An Error Occurred</h3>
        <p className="text-gray-600 dark:text-slate-400 mt-3 max-w-md mx-auto text-lg">{error}</p>
        <Button
          onClick={onRetry}
          className="mt-8 px-8 py-6 text-lg font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, #22d3ee, #22c55e)',
            border: 'none',
            borderRadius: '0.75rem',
          }}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (scrapedProducts.length > 0) {
    return (
      <div className="mt-8">
        <ProductResults query={searchQuery} products={scrapedProducts} />
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className={containerClasses}>
        <Search className="w-16 h-16 mx-auto mb-6 text-gray-500 dark:text-slate-500" />
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">No Products Found</h3>
        <p className="text-gray-600 dark:text-slate-400 mt-3 text-lg">
          Try searching with different keywords.
        </p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* TezBazar Animation */}
      <div className="flex justify-center w-full">
        <DotLottieReact
          src="/tezbazar.json"
          loop
          autoplay
          className="w-full h-auto max-w-2xl"
          style={{ maxWidth: '700px' }}
        />
      </div>
      <p className="text-gray-600 dark:text-slate-400 mt-6 text-lg">
        Start searching for products to compare prices
      </p>
    </div>
  );
};

export default SearchResults;
