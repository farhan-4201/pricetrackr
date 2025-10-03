import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ComparisonProvider } from '@/context/ComparisonContext';
import { ComparisonFloatingPanel } from '@/components/ProductComparisonSelector';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSearch } from '@/hooks/useSearch';
import { SearchForm } from '@/components/SearchForm';
import { SearchResults } from '@/components/SearchResults';

export const SearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { scrapedProducts, loading, error, handleSearch } = useSearch();

  const onSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  return (
    <ErrorBoundary>
      <ComparisonProvider>
        <div>
          <div className="max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Multi-Marketplace Product Search
                </h1>
                <p className="text-cyan-300 mt-2 text-base">
                  Find the best deals across Daraz, PriceOye & more!
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="cyber">
                  <Search className="w-4 h-4 mr-2" />
                  View Watchlist
                </Button>
              </div>
            </div>

            {/* Search Form */}
            <SearchForm
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={onSearch}
              loading={loading}
            />

            {/* Search Results */}
            <SearchResults
              loading={loading}
              error={error}
              scrapedProducts={scrapedProducts}
              searchQuery={searchQuery}
              onRetry={() => handleSearch(searchQuery)}
            />
          </div>
        </div>

        {/* Comparison Floating Panel */}
        <ComparisonFloatingPanel />
      </ComparisonProvider>
    </ErrorBoundary>
  );
};

export default SearchDashboard;
