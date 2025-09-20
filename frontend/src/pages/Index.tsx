import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { ProductResults } from "@/components/ProductResults";
import {
  Search,
  TrendingDown,
  Bell,
  Shield,
  Zap,
  BarChart,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";

export const Index = () => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [scrapedProduct, setScrapedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchLimitExceeded, setSearchLimitExceeded] = useState(false);
  const searchSectionRef = useRef(null);

  // Unified search state to prevent too many requests
  const [searchState, setSearchState] = useState({
    currentQuery: '',
    lastSearchedQuery: '',
    isSearching: false,
    lastSearchTime: 0,
    searchCount: 0,
    rateLimited: false,
    rateLimitRetryAfter: 0
  });

  // Error type interface
  interface ApiError {
    message: string;
    status?: number;
    retryAfter?: number;
  }

  // Debounce timeout refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 1500; // Increased to 1.5 seconds to be more conservative

  const MAX_SEARCHES = 5;
  const STORAGE_KEY = 'pricetracker_search_count';

  useEffect(() => {
    const storedCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('pricetracker_last_reset');

    if (lastReset !== today) {
      localStorage.setItem(STORAGE_KEY, '0');
      localStorage.setItem('pricetracker_last_reset', today);
    }

    const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    setSearchLimitExceeded(currentCount >= MAX_SEARCHES);
  }, []);

  useEffect(() => {
    if (window.location.hash === '#search') {
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  // Debounced search to prevent excessive API calls
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim() && searchTerm.trim() !== searchState.lastSearchedQuery) {
      setSearchState(prev => ({
        ...prev,
        currentQuery: searchTerm.trim(),
        isSearching: true
      }));

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchTerm.trim());
      }, DEBOUNCE_DELAY);
    } else if (!searchTerm.trim()) {
      setSearchState(prev => ({
        ...prev,
        isSearching: false
      }));
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Unified search function to synchronize both search sections
  const performSearch = async (query: string) => {
    const currentTime = Date.now();
    const minimumInterval = 10000; // Increased from 5s to 10s to be more conservative

    if (currentTime - searchState.lastSearchTime < minimumInterval) {
      console.log(`[SearchSync] Search blocked - ${Math.ceil((minimumInterval - (currentTime - searchState.lastSearchTime)) / 1000)}s remaining`);
      return;
    }

    // Double-check rate limiting just before search
    const timeSinceLastSearch = currentTime - searchState.lastSearchTime;
    if (timeSinceLastSearch < minimumInterval) {
      console.log('[SearchSync] Duplicate call blocked by double-check');
      return;
    }

    setSearchState(prev => ({
      ...prev,
      lastSearchTime: currentTime,
      searchCount: prev.searchCount + 1
    }));

    console.log(`[SearchSync] APPROVED search #${searchState.searchCount + 1} for: "${query}" at ${new Date(currentTime).toISOString()}`);

    // Update shared search state for synchronization AFTER approval
    setSearchState(prev => ({
      ...prev,
      lastSearchedQuery: query,
      currentQuery: query
    }));

    // Return to prevent any further calls
    return;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    if (!isAuthenticated && searchLimitExceeded) {
      setError('Search limit reached. Please signup for unlimited searches.');
      return;
    }

    setLoading(true);
    setError('');
    setScrapedProduct(null);

    try {
      const data = await apiClient.post('/products/scrape', { query: searchTerm });
      setScrapedProduct(data);

      // Increment search count for non-authenticated users
      if (!isAuthenticated) {
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
        localStorage.setItem(STORAGE_KEY, (currentCount + 1).toString());
        setSearchLimitExceeded((currentCount + 1) >= MAX_SEARCHES);
      }
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 429) {
        const retryAfter = error.retryAfter || 1758354973; // Unix timestamp
        const retryDate = new Date(retryAfter * 1000);
        setSearchState(prev => ({
          ...prev,
          rateLimited: true,
          rateLimitRetryAfter: retryAfter
        }));

        // Clear rate limit after the retry time
        if (rateLimitTimeoutRef.current) {
          clearTimeout(rateLimitTimeoutRef.current);
        }
        rateLimitTimeoutRef.current = setTimeout(() => {
          setSearchState(prev => ({
            ...prev,
            rateLimited: false,
            rateLimitRetryAfter: 0
          }));
        }, Math.max(0, retryAfter * 1000 - Date.now()));

        setError(`Rate limited. Try again after ${retryDate.toLocaleTimeString()} (${Math.ceil((retryAfter * 1000 - Date.now()) / 1000 / 60)} minutes)`);
      } else {
        setError(error.message || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  const navigateToSearch = () => {
    if (location.pathname === "/") {
      // Already on home page, just scroll
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigate to home page with hash
      navigate("/#search");
    }
  };

  const features = [
    {
      icon: Search,
      title: "Product Search",
      description: "Search and discover products on your favorite marketplaces"
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified when your tracked items drop in price"
    },
    {
      icon: BarChart,
      title: "Price History",
      description: "View detailed price trends over time"
    },
    {
      icon: Shield,
      title: "Deal Verification",
      description: "Verify deals to ensure authentic savings"
    }
  ];

  return (
    <div style={{ background: '#020617' }}>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)" }}
          />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                    Never Overpay
                  </span>
                  <br />
                  <span className="text-white">Again</span>
                </h1>

                <p className="text-xl text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Track prices across multiple marketplaces, get instant alerts when prices drop,
                  and save thousands on your purchases with our price monitoring system.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={navigateToSearch}
                  size="lg"
                  className="px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
                  }}
                >
                  Start Saving Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                    color: "#22d3ee"
                  }}
                >
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Search Section */}
      <section ref={searchSectionRef} id="search" className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Search & Discover Products
          </h2>
          <p className="text-slate-300 mb-8">
            Search for products on Daraz, PriceOye and get real-time pricing and information instantly.
          </p>

          {/* Search Limit Status */}
          {!isAuthenticated && (
            <div className="bg-slate-800/30 rounded-lg p-4 mb-6 border border-slate-600/50">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-purple-400 font-semibold">Searches Used</div>
                  <div className="text-white text-lg">{parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)}</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-semibold">Remaining</div>
                  <div className="text-white text-lg">{MAX_SEARCHES - parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)}</div>
                </div>
                <div className="text-center">
                  <div className="text-orange-400 font-semibold">Rate Limited</div>
                  <div className={`text-sm ${searchState.rateLimited ? 'text-red-400' : 'text-green-400'}`}>
                    {searchState.rateLimited ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
              {searchLimitExceeded && (
                <div className="mt-3 text-center">
                  <p className="text-red-400 text-sm">Search limit reached!</p>
                  <p className="text-slate-400 text-xs">Sign up for unlimited searches</p>
                </div>
              )}
            </div>
          )}

          {/* Original Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Input
              type="text"
              name="productSearch"
              placeholder="Search for products (e.g., iPhone 14 Pro Max)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || (!isAuthenticated && searchLimitExceeded)}
              style={{
                background: !isAuthenticated && searchLimitExceeded
                  ? "rgba(34, 211, 238, 0.5)"
                  : "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none"
              }}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {/* Display Original Search Results */}
          {error && <p className="text-red-400 mb-4">{error}</p>}

          {scrapedProduct && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl font-bold text-white mb-4">{scrapedProduct.name}</h3>
              {scrapedProduct.imageUrl && (
                <img
                  src={scrapedProduct.imageUrl}
                  alt={scrapedProduct.name}
                  className="w-full max-w-sm mx-auto mb-4 rounded-lg shadow-lg"
                />
              )}
              {scrapedProduct.currentPrice && (
                <p className="text-3xl font-bold text-cyan-400 mb-4">Rs. {scrapedProduct.currentPrice.toLocaleString()}</p>
              )}
              {scrapedProduct.description && (
                <p className="text-slate-300 mb-4">{scrapedProduct.description}</p>
              )}
              {scrapedProduct.category && (
                <p className="text-sm text-slate-400">Category: {scrapedProduct.category}</p>
              )}
              {scrapedProduct.rating && (
                <p className="text-sm text-slate-400">Rating: {scrapedProduct.rating}/5</p>
              )}
              {scrapedProduct.url && (
                <a
                  href={scrapedProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
                >
                  View on Daraz
                </a>
              )}
            </div>
          )}

          <div className="border-t border-slate-600 pt-12">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Multi-Marketplace Search (New Feature)
            </h3>
            <p className="text-slate-300 mb-8 text-sm">
              Search across multiple marketplaces like Daraz, PriceOye and more simultaneously
            </p>

            {/* Search Statistics & Mapping */}
            {searchState.lastSearchedQuery && (
              <div className="bg-slate-800/30 rounded-lg p-4 mb-6 border border-slate-600/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-cyan-400 font-semibold">Query</div>
                    <div className="text-slate-300 truncate">"{searchState.currentQuery}"</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">Marketplace</div>
                    <div className="text-slate-300">All Marketplaces</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">Search #</div>
                    <div className="text-slate-300">{searchState.searchCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-400 font-semibold">Status</div>
                    <div className={`text-sm ${searchState.isSearching ? 'text-yellow-400' : 'text-green-400'}`}>
                      {searchState.isSearching ? 'Searching...' : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* New ProductResults Component */}
            <div className="max-w-6xl mx-auto">
              <ProductResults
                query={searchState.lastSearchedQuery}
                onProductSelect={(product) => {
                  console.log('Product selected from multi-search:', product);
                  // You can add navigation to product detail page here
                }}
              />
            </div>

            {/* Mapping Info for Results */}
            {searchTerm.trim() && (
              <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <h4 className="text-lg font-semibold text-blue-400 mb-3">Search Mapping</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-800/50 rounded p-3">
                    <div className="text-slate-300 font-medium">Your Query</div>
                    <div className="text-white">"{searchTerm}"</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-3">
                    <div className="text-slate-300 font-medium">Mapped To</div>
                    <div className="text-white">Daraz Marketplace Search</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Results are filtered to show only relevant products from Daraz (max 5 per query)
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to make smart purchasing decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border transition-all duration-500 hover:scale-105 hover:border-cyan-400/30 group"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(34, 211, 238, 0.1)",
                    boxShadow: "0 0 20px rgba(34, 211, 238, 0.2)"
                  }}
                >
                  <feature.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div
            className="p-12 rounded-2xl border relative overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
            }}
          >
            {/* Background Animation */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: "linear-gradient(45deg, transparent, rgba(34, 211, 238, 0.1), transparent, rgba(34, 197, 94, 0.1), transparent)"
              }}
            />

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Start Saving?
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Sign up to start tracking prices and saving money effortlessly
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={navigateToSearch}
                  size="lg"
                  className="px-12 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
                  }}
                >
                  Get Started Free
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-12 py-4 text-lg font-medium transition-all duration-300"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: "#a855f7"
                  }}
                >
                  View Pricing
                </Button>
              </div>

              <div className="flex justify-center items-center space-x-6 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
