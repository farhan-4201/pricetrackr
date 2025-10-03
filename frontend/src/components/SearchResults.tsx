import React from 'react';
import { Loader2, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductResults } from '@/components/ProductResults';
import { ScrapedProduct } from '@/lib/api';

type SearchResultsProps = {
  loading: boolean;
  error: string;
  scrapedProducts: ScrapedProduct[];
  searchQuery: string;
  onRetry: () => void;
};

export const SearchResults = ({ loading, error, scrapedProducts, searchQuery, onRetry }: SearchResultsProps) => {
  const containerClasses = "text-center py-16 px-6 rounded-2xl bg-slate-900/50 border border-slate-800/50";

  if (loading) {
    return (
      <div className={containerClasses}>
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
        <h3 className="text-xl font-semibold text-white">Searching for products...</h3>
        <p className="text-slate-400 text-sm mt-2">This may take a few moments</p>
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
    return (
      <div className={containerClasses}>
        <Search className="w-12 h-12 mx-auto mb-4 text-slate-500" />
        <h3 className="text-xl font-semibold text-white">No Products Found</h3>
        <p className="text-slate-400 mt-2">Try searching with different keywords.</p>
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
