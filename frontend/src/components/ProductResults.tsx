import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ShoppingCart, RefreshCw, Wifi, Network } from "lucide-react";
import { ScrapedProduct } from "@/lib/api";
import { socket, connectWebSocket, sendWebSocketMessage, closeWebSocket } from "@/lib/websocket";
import { toast } from "sonner";
import { ProductCard } from "./ProductCard";
import { MarketplaceComparisonChart } from "./MarketplaceComparisonChart";
import { ProductGridSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import ScrollReveal from 'scrollreveal';

interface ProductResultsProps {
  query: string;
  onProductSelect?: (product: ScrapedProduct) => void;
  className?: string;
  isSearching?: boolean; // Added for synchronization
}

interface APIError {
  message: string;
  status?: number;
  retryAfter?: number;
}

// Extended interface for internal product handling with relevance scoring
interface ProductWithScore extends ScrapedProduct {
  relevanceScore?: number;
}

export const ProductResults: React.FC<ProductResultsProps> = ({
  query,
  onProductSelect,
  className = ""
}) => {
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>("");
  const [noResultsMarketplaces, setNoResultsMarketplaces] = useState<string[]>([]);
  const productContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmedQuery = query?.trim();
    if (trimmedQuery && trimmedQuery !== lastSearchedQuery) {
      setLoading(true);
      setError("");
      setProducts([]);
      setLastSearchedQuery(trimmedQuery);

      connectWebSocket(
        () => {
          console.log('WebSocket connected');
          sendWebSocketMessage(trimmedQuery);
        },
        (data) => {
          setLoading(false);
          if (data.products) {
            setProducts(data.products);
          }
        },
        (error) => {
          setLoading(false);
          setError('WebSocket error');
          console.error('WebSocket error:', error);
        },
        () => {
          console.log('WebSocket disconnected');
        }
      );
    } else if (!trimmedQuery) {
      setProducts([]);
      setError("");
    }

    return () => {
      // Only close the WebSocket if the component is unmounting
      if (socket && socket.readyState === WebSocket.OPEN) {
        closeWebSocket();
      }
    };
  }, [query, lastSearchedQuery]);

  // Initialize ScrollReveal for products when they load
  useEffect(() => {
    if (products.length > 0 && productContainerRef.current) {
      // Configure ScrollReveal
      const sr = ScrollReveal({
        duration: 800,
        distance: '50px',
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        delay: 200,
        viewFactor: 0.15
      });

      // Reveal product cards with stagger
      sr.reveal(productContainerRef.current.querySelectorAll('.product-card'), {
        interval: 150,
        origin: 'bottom',
        distance: '30px'
      });
    }
  }, [products]);



  const marketplaceColors: Record<string, string> = {
    daraz: "#22d3ee",
    priceoye: "#ff4081",
    telemart: "#10b981",
    alibaba: "#ff4081",
    amazon: "#ff9900",
    ebay: "#26a69a"
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Loading State - Skeleton */}
      {loading && (
        <div className="space-y-8">
          {/* Simulate marketplace sections */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-8 rounded-sm bg-slate-700 animate-pulse" />
              <div className="h-6 w-24 bg-slate-700 rounded animate-pulse" />
            </div>
            <ProductGridSkeleton count={6} />
          </div>

          {/* Chart skeleton */}
          <div className="mt-12">
            <ChartSkeleton />
          </div>
        </div>
      )}

      {/* Enhanced Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-8 max-w-md w-full">
            {/* Error Type Detection */}
            {error.toLowerCase().includes('network') || error.toLowerCase().includes('websocket') ? (
              <>
                <Network className="w-12 h-12 text-red-400 mb-4 mx-auto" />
                <h3 className="text-red-400 text-lg font-semibold mb-2 text-center">Connection Error</h3>
                <p className="text-gray-300 text-center text-sm mb-4">
                  Unable to connect to the search service. Please check your internet connection.
                </p>
              </>
            ) : error.toLowerCase().includes('timeout') || error.toLowerCase().includes('server') ? (
              <>
                <RefreshCw className="w-12 h-12 text-yellow-400 mb-4 mx-auto" />
                <h3 className="text-yellow-400 text-lg font-semibold mb-2 text-center">Service Unavailable</h3>
                <p className="text-gray-300 text-center text-sm mb-4">
                  The search service is temporarily unavailable. This usually resolves automatically.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-red-400 mb-4 mx-auto" />
                <h3 className="text-red-400 text-lg font-semibold mb-2 text-center">Search Failed</h3>
                <p className="text-gray-300 text-center text-sm mb-4">
                  An unexpected error occurred while searching for products.
                </p>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => query && sendWebSocketMessage(query)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              {error.toLowerCase().includes('network') && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Check Connection
                </Button>
              )}
            </div>

            {/* Error Details (only in development) */}
            {import.meta.env.DEV && (
              <details className="mt-4 text-xs">
                <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                  Error Details
                </summary>
                <pre className="text-red-300 bg-slate-900/50 p-2 rounded mt-2 whitespace-pre-wrap">
                  {error}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* No Results State */}
      {products.length === 0 && !loading && !error && query && (
        <div className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg">No products found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your search terms or check spelling
          </p>
        </div>
      )}

      {/* Results */}
      {products.length > 0 && !loading && (
        <div>
          {noResultsMarketplaces.length > 0 && (
            <div className="mb-4 p-4 border border-yellow-400/30 bg-yellow-400/10 rounded-lg text-yellow-300 text-sm">
              <p>No relevant products found on: <strong>{noResultsMarketplaces.join(', ')}</strong>. Results from other marketplaces are shown below.</p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold text-white">
                Search Results for "{lastSearchedQuery}"
              </h3>
              {products.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-400">Total Products</p>
                      <p className="text-lg font-bold text-cyan-400">{products.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Marketplaces</p>
                      <p className="text-lg font-bold text-green-400">
                        {new Set(products.map(p => p.marketplace)).size}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Avg Price</p>
                      <p className="text-lg font-bold text-yellow-400">
                        Rs. {Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Price Range</p>
                      <p className="text-lg font-bold text-purple-400">
                        Rs. {Math.round(Math.min(...products.map(p => p.price || Infinity))).toLocaleString()} - {Math.round(Math.max(...products.map(p => p.price || 0))).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Group products by marketplace */}
            <div ref={productContainerRef}>
              {(() => {
                const groupedProducts = products.reduce((acc, product) => {
                  const marketplace = product.marketplace;
                  if (!acc[marketplace]) {
                    acc[marketplace] = [];
                  }
                  acc[marketplace].push(product);
                  return acc;
                }, {} as Record<string, ScrapedProduct[]>);

                return Object.entries(groupedProducts).map(([marketplace, marketplaceProducts]) => (
                  <div key={marketplace} className="mb-8">
                    {/* Marketplace Section Heading */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-4 h-8 rounded-sm"
                        style={{ backgroundColor: marketplaceColors[marketplace.toLowerCase()] }}
                      />
                      <h4 className="text-lg font-semibold text-white">
                        {marketplace}
                      </h4>
                      <Badge variant="secondary" className="bg-cyan-400/20 text-cyan-400 ml-auto">
                        {marketplaceProducts.length} {marketplaceProducts.length === 1 ? 'product' : 'products'}
                      </Badge>
                    </div>

                    {/* Products Grid - 3 columns on desktop, consistent dimensions, showing max 3 products */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
                      {marketplaceProducts.slice(0, 3).map((product, index) => (
                        <div key={`${product.marketplace}-${product.name}-${index}`} className="product-card">
                          <ProductCard
                            product={{
                              id: `${product.marketplace}-${product.name}-${index}`,
                              name: product.name,
                              image: product.imageUrl,
                              price: product.price as number,
                              marketplace: product.marketplace,
                              rating: Number(product.rating) || 0,
                              reviews: 0, // Not available from scraper
                              priceChange: 0, // Not available from scraper
                              category: product.company || "General",
                              url: product.url,
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Show message if more products available */}
                    {marketplaceProducts.length > 3 && (
                      <div className="text-center mt-4">
                        <p className="text-sm text-slate-400">
                          Showing 3 of {marketplaceProducts.length} products from {marketplace}
                        </p>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {/* Marketplace Price Comparison Chart */}
            <div className="mt-12 mb-8">
              <MarketplaceComparisonChart products={products} />
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <span>Query: "{query}"</span>
            <span>Loading: {loading.toString()}</span>
            <span>Products: {products.length}</span>
            <span>Error: {error ? 'Yes' : 'No'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductResults;

/*
USAGE EXAMPLE:

import { ProductResults } from "@/components/ProductResults";

function MySearchComponent() {
  const [query, setQuery] = useState("");

  const handleProductSelect = (product: ScrapedProduct) => {
    console.log("Product selected:", product);
    // Handle product selection logic here
  };

  return (
    <div className="min-h-screen p-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products..."
        className="w-full mb-6 p-4 border rounded-lg"
      />

      <ProductResults
        query={query}
        onProductSelect={handleProductSelect}
        className="mx-auto max-w-6xl"
      />
    </div>
  );
}
*/
