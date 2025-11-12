import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Search } from 'lucide-react';
import { ComparisonProvider } from '@/context/ComparisonContext';
import { ComparisonFloatingPanel } from '@/components/ProductComparisonSelector';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSearch } from '@/hooks/useSearch';
import { SearchForm } from '@/components/SearchForm';
import { SearchResults } from '@/components/SearchResults';
import { useNavigate } from 'react-router-dom';

export const SearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { scrapedProducts, loading, error, handleSearch } = useSearch();
  const navigate = useNavigate();

  const onSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  return (
    <ErrorBoundary>
      <ComparisonProvider>
        <div 
          className="w-full min-h-screen py-12"
          style={{
            backgroundColor: "#020617"
          }}
        >
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6">

            {/* Quick Actions */}
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => navigate('/watchlist')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Heart className="w-4 h-4 mr-2" />
                My Watchlist
              </Button>
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