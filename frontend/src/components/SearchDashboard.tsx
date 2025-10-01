import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ProductResults } from "@/components/ProductResults";
import { ScrapedProduct } from "@/lib/api";
import {
  connectWebSocket,
  sendWebSocketMessage,
  closeWebSocket,
} from "@/lib/websocket";
import { LazyImage } from "@/components/LazyImage";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import {
  ComparisonProvider,
  useComparison
} from "@/context/ComparisonContext";
import {
  ComparisonFloatingPanel,
  ComparisonButton
} from "@/components/ProductComparisonSelector";

// Error Boundary Component with proper types
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Search component error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="text-red-400 p-4 border border-red-400 rounded">
            <h3>Something went wrong!</h3>
            <p>{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Add this type near the top of the file with other type definitions
type APIError = {
    message: string;
    status?: number;
};



// Export the SearchDashboard component
export const SearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Force re-render function
  const [forceUpdate, setForceUpdate] = useState(0);
  const triggerUpdate = () => setForceUpdate(prev => prev + 1);

  // Refs for input and dropdown
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recent_searches');
    if (storedSearches) {
      try {
        const parsed = JSON.parse(storedSearches);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.warn('Failed to parse recent searches from localStorage:', error);
        setRecentSearches([]);
      }
    }
  }, []);

  // Update suggestions when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = recentSearches
        .filter(search =>
          search.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(recentSearches.length > 0);
    }
    setSelectedSuggestionIndex(-1);
  }, [searchQuery, recentSearches]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save search to localStorage
  const saveRecentSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== trimmedQuery);
      const updated = [trimmedQuery, ...filtered].slice(0, 10); // Keep only 10 recent searches
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle input change with suggestion filtering
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (recentSearches.length > 0) {
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(undefined, suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          e.preventDefault();
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          setSearchQuery(selectedSuggestion);
          setShowSuggestions(false);
          handleSearch(undefined, selectedSuggestion);
        }
        // If no suggestion is selected, let the form submit
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();

    const currentQuery = queryOverride || searchQuery;

    if (!currentQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setError("");
    setScrapedProducts([]);
    setShowSuggestions(false);
    saveRecentSearch(currentQuery);

    connectWebSocket(
      () => {
        console.log("WebSocket connected");
        sendWebSocketMessage(currentQuery.trim());
      },
      (data) => {
        if (data.type === 'RESULT') {
          setScrapedProducts(prev => [...prev, ...data.payload.products]);
        } else if (data.type === 'NO_RESULTS') {
          toast.info(`No products found on ${data.payload.marketplace}`);
        } else if (data.type === 'ERROR') {
          toast.error(`Error from ${data.payload.marketplace}: ${data.payload.message}`);
        } else if (data.type === 'DONE') {
          setLoading(false);
          closeWebSocket();
        }
      },
      (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection failed");
        setLoading(false);
      },
      () => {
        console.log("WebSocket disconnected");
        setLoading(false);
      }
    );
  };



  // Debug effect to monitor state changes
  useEffect(() => {
    // Optionally log or handle scrapedProducts change
  }, [scrapedProducts]);

  return (
    <ErrorBoundary>
      <ComparisonProvider>
        <div>
          <div className="max-w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="float">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-glow">
                   Multi-Marketplace Product Search 
                </h1>
                <p className="text-cyan-300 mt-2 text-lg shimmer px-2 py-1 rounded">Find the best deals across Daraz, PriceOye & more!</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                >
                  <Search className="w-4 h-4 mr-2" />
                  View Watchlist
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 mb-8 animated-border p-1 rounded-xl">
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

                {/* Autosuggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
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
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className={`py-6 px-8 text-lg font-bold hover-scale breath-glow ${
                  loading || !searchQuery.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  background: loading || !searchQuery.trim()
                    ? "rgba(107, 114, 128, 0.5)"
                    : "linear-gradient(135deg, #22d3ee, #22c55e)",
                  border: "none",
                  minWidth: "140px",
                  borderRadius: "0.75rem",
                  boxShadow: loading || !searchQuery.trim()
                    ? "none"
                    : "0 10px 40px rgba(34, 211, 238, 0.3)",
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

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
                <p className="text-gray-300">Searching for products...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">❌ {error}</div>
                <p className="text-gray-400">Try searching with different keywords or check your internet connection.</p>
              </div>
            )}

            {/* Product Results */}
            <ProductResults query={searchQuery} products={scrapedProducts} />

            {/* Empty State */}
            {scrapedProducts.length === 0 && !loading && !error && searchQuery && (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No products found. Try searching with different keywords.</p>
              </div>
            )}

            {/* Initial State */}
            {!searchQuery && !loading && (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter a product name and click search to find products from all marketplaces.</p>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Floating Panel */}
        <ComparisonFloatingPanel />
      </ComparisonProvider>
    </ErrorBoundary>
  );
};

export default SearchDashboard;
