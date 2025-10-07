import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Clock } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

type SearchFormProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  loading: boolean;
};

export const SearchForm = ({ searchQuery, setSearchQuery, onSearch, loading }: SearchFormProps) => {
  const {
    suggestions,
    showSuggestions,
    selectedSuggestionIndex,
    inputRef,
    dropdownRef,
    saveRecentSearch,
    handleInputChange,
    handleInputFocus,
    handleSuggestionClick,
    handleKeyDown,
  } = useSearchSuggestions({ searchQuery, onSearch, setSearchQuery });

  const handleSearchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery || loading) {
      return;
    }

    console.log('[SearchForm] Search button clicked with query:', trimmedQuery);
    saveRecentSearch(trimmedQuery);
    onSearch(trimmedQuery);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery || loading) {
      return;
    }
    
    console.log('[SearchForm] Form submitted with query:', trimmedQuery);
    saveRecentSearch(trimmedQuery);
    onSearch(trimmedQuery);
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col lg:flex-row gap-4 mb-8 p-1 rounded-xl border-2 border-cyan-400/30 bg-gradient-to-r from-slate-900/50 to-purple-900/50">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5 pulse-glow" />
        <Input
          ref={inputRef}
          placeholder="🔍 Search for products across Daraz, PriceOye, and more (e.g., iPhone 14 Pro Max)"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-6 text-lg border-cyan-400/30 bg-gradient-to-r from-slate-900/50 to-purple-900/50 glass-card text-white placeholder-cyan-300/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 hover-scale"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div className="p-2 border-b border-gray-700">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Recent searches</span>
              </div>
            </div>

            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-4 py-3 cursor-pointer flex items-center space-x-3 hover:bg-gray-700 transition-colors ${
                  index === selectedSuggestionIndex ? 'bg-gray-700 text-cyan-400' : 'text-white'
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={handleSearchClick}
        disabled={loading || !searchQuery.trim()}
        className={`py-6 px-8 text-lg font-bold ${
          loading || !searchQuery.trim() ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: loading || !searchQuery.trim()
            ? 'rgba(107, 114, 128, 0.5)'
            : 'linear-gradient(135deg, #22d3ee, #22c55e)',
          border: 'none',
          minWidth: '140px',
          borderRadius: '0.75rem',
          boxShadow: loading || !searchQuery.trim()
            ? 'none'
            : '0 10px 40px rgba(34, 211, 238, 0.3)',
          pointerEvents: loading || !searchQuery.trim() ? 'none' : 'auto',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-white" />
            <span>Searching...</span>
          </>
        ) : (
          <>
            <Search className="w-5 h-5 mr-2" />
            <span>Search</span>
          </>
        )}
      </Button>
    </form>
  );
};
