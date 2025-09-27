import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { productsAPI } from "@/lib/api";
import { toast } from "sonner";
import { ProductResults } from "@/components/ProductResults";
import { ScrapedProduct } from "@/lib/api";
import { LazyImage } from "@/components/LazyImage";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import {
  ComparisonProvider,
  ComparisonFloatingPanel,
  ComparisonButton,
  useComparison
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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

// Export the component to fix React Fast Refresh
export const ProductCard = ({ product }: { product: ScrapedProduct }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Use comparison context
  const { isInComparison } = useComparison();
  const inComparison = isInComparison(product);

  const handleAddToWatchlist = async () => {
    if (!product.name) return;

    try {
      const priceField: Record<string, number> = {};
      if (typeof product.price === 'number' && product.marketplace) {
        priceField[product.marketplace.toLowerCase()] = product.price;
      }

      await productsAPI.createProduct({
        name: product.name,
        image: product.imageUrl || '',
        prices: priceField,
        category: 'General',
        vendor: product.marketplace.toLowerCase(),
        url: product.url,
        currentPrice: typeof product.price === 'number' && product.price > 0 ? product.price : 0
      });

      setIsWishlisted(true);
      toast.success("Product added to watchlist!");
    } catch (error) {
      toast.error("Failed to add product to watchlist");
      console.error(error);
    }
  };

  const marketplaceColors: Record<string, string> = {
    daraz: "#22d3ee",
    priceoye: "#ff4081",
    alibaba: "#ff4081",
    amazon: "#ff9900",
    ebay: "#26a69a"
  };

  // Make sure to return JSX
  return (
    <ErrorBoundary>
      <div
        className="rounded-xl p-6 border transition-all duration-500 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(34, 211, 238, 0.1)",
          boxShadow: isHovered
            ? "0 20px 40px rgba(34, 211, 238, 0.2)"
            : "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-lg">
          <LazyImage
            src={product.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <Badge
            className="absolute top-2 left-2 font-medium"
            style={{
              background: "rgba(34, 211, 238, 0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              color: "#22d3ee",
            }}
          >
            {product.marketplace}
          </Badge>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-cyan-400 transition-colors duration-300">
            {product.name}
          </h3>

          {product.price !== null && product.price !== undefined && product.price > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Rs. {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Price not available
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: marketplaceColors[product.marketplace.toLowerCase()] || "#22d3ee" }}
                />
                <span className="capitalize text-slate-300">{product.marketplace}</span>
              </div>
            </div>
          </div>

          {product.rating && (
            <div className="text-sm text-slate-400">
              Rating: ⭐ {product.rating}/5
            </div>
          )}

          {product.company && (
            <div className="text-sm text-slate-400">
              By: {product.company}
            </div>
          )}

          <div className="space-y-2">
            <ComparisonButton product={product} />
            <Button
              className="w-full font-medium"
              onClick={handleAddToWatchlist}
              disabled={isWishlisted}
              style={{
                background: isWishlisted
                  ? "#22c55e"
                  : "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
              }}
            >
              {isWishlisted ? "Added to Watchlist" : "Add to Watchlist"}
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
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
    saveRecentSearch(suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSearch();
      }
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
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          setSearchQuery(selectedSuggestion);
          setShowSuggestions(false);
          saveRecentSearch(selectedSuggestion);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Save search to recent searches
    saveRecentSearch(searchQuery);

    setLoading(true);
    setError("");
    setScrapedProducts([]);
    setShowSuggestions(false);

    try {
      // Call the fixed productsAPI which always returns an array!
      const products = await productsAPI.searchAllMarketsProducts(searchQuery);

      if (Array.isArray(products) && products.length > 0) {
        setScrapedProducts(products);
        triggerUpdate();
      } else if (Array.isArray(products) && products.length === 0) {
        setScrapedProducts([]);
        setError("No products found for this search");
      } else {
        setError("Invalid response format - expected array");
        toast.error("Invalid response format");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to search for product");
      toast.error(error.message || "Failed to search for product");
    } finally {
      setLoading(false);
    }
  };



  // Debug effect to monitor state changes
  useEffect(() => {
    // Optionally log or handle scrapedProducts change
  }, [scrapedProducts]);

  return (
    <ErrorBoundary>
      <ComparisonProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">Multi-Marketplace Product Search</h1>
              <div className="flex items-center space-x-4">
                <Button variant="outline" className="text-white border-cyan-400 hover:bg-cyan-400/10">
                  <Search className="w-4 h-4 mr-2" />
                  View Watchlist
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  ref={inputRef}
                  placeholder="Search for products across Daraz, PriceOye, and more (e.g., iPhone 14 Pro Max)"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-4 py-6 text-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400"
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
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                  border: "none",
                  minWidth: "120px"
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

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
            <ProductResults query={searchQuery} />

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
