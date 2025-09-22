import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { ScrapedProduct } from "@/lib/api";
import { socket, connectWebSocket, sendWebSocketMessage, closeWebSocket } from "@/lib/websocket";
import { toast } from "sonner";
import { ProductCard } from "./ProductCard";

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



  const marketplaceColors: Record<string, string> = {
    daraz: "#22d3ee",
    priceoye: "#ff4081",
    alibaba: "#ff4081",
    amazon: "#ff9900",
    ebay: "#26a69a"
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
          <p className="text-gray-300 text-lg">Searching for products...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-red-400 text-lg font-medium mb-2">Search Failed</p>
          <p className="text-gray-400 text-center">{error}</p>
          <Button
            onClick={() => query && sendWebSocketMessage(query)}
            variant="outline"
            className="mt-4 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
            disabled={loading}
          >
            Try Again
          </Button>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Search Results for "{lastSearchedQuery}"
            </h3>
            <Badge variant="secondary" className="bg-cyan-400/20 text-cyan-400">
              {products.length} {products.length === 1 ? 'product' : 'products'} found
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={`${product.marketplace}-${product.name}-${index}`}
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
            ))}
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
