import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { productsAPI, ScrapedProduct } from "@/lib/api";
import { toast } from "sonner";

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

  // Fetch products when query changes (ONLY if it hasn't been searched)
  useEffect(() => {
    const trimmedQuery = query?.trim();
    if (trimmedQuery && trimmedQuery !== lastSearchedQuery) {
      console.log(`[ProductResults] Will search for new query: "${trimmedQuery}"`);
      // Add small delay to allow unified search coordinator to set the flag
      const timer = setTimeout(() => {
        if (trimmedQuery) {
          fetchProducts(trimmedQuery);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (!trimmedQuery) {
      setProducts([]);
      setError("");
    }
  }, [query, lastSearchedQuery]);

  const fetchProducts = async (searchQuery: string) => {
    console.log('[ProductResults] Starting search for:', searchQuery);
    setLoading(true);
    setError("");
    setLastSearchedQuery(searchQuery);

    try {
      const response = await productsAPI.searchAllMarketsProducts(searchQuery);
      console.log('[ProductResults] API response received:', response);

        if (Array.isArray(response) && response.length > 0) {
            // Add relevance scoring and sorting for all marketplace products
            const queryLower = searchQuery.toLowerCase().trim();
            const scoredProducts: ProductWithScore[] = response.map((product: ScrapedProduct): ProductWithScore => {
                const productName = product.name?.toLowerCase() || '';
                const productCompany = product.company?.toLowerCase() || '';

                // Calculate relevance score based on:
                // 1. Full product name match (highest priority)
                // 2. Partial word matches
                // 3. Company name match

                let score = 0;

                // Priority 1: Full query match in product name
                if (productName.includes(queryLower)) {
                    score += 100;
                }

                // Priority 2: Individual words from query match
                const queryWords = queryLower.split(' ');
                for (const word of queryWords) {
                    if (word.length > 2) { // Ignore short words
                        if (productName.includes(word)) {
                            score += 50;
                        }
                        if (productCompany.includes(word)) {
                            score += 20;
                        }
                    }
                }

                // Priority 3: Brand matching (for tech products)
                if (queryLower.includes('iphone') || queryLower.includes('apple')) {
                    if (productName.includes('iphone') || productName.includes('apple')) {
                        score += 40;
                    }
                    if (productCompany && (productCompany.includes('apple') || productName.includes('apple'))) {
                        score += 20;
                    }
                }

                return { ...product, relevanceScore: score };
            });

            // Sort by relevance score (highest first) and limit to 4 most relevant
            scoredProducts.sort((a, b) => b.relevanceScore! - a.relevanceScore!);
            const relevantProducts = scoredProducts.slice(0, 4);

            // Only show products with some relevance score (avoid irrelevant results)
            const finalResults = relevantProducts.filter(product => product.relevanceScore! > 0);

            if (finalResults.length > 0) {
                setProducts(finalResults);
                console.log(`[ProductResults] Found ${finalResults.length} relevant products`);
            } else {
                setProducts([]);
                setError("No products found matching your search");
            }
        } else {
            setProducts([]);
            setError("No products found for this search");
        }
    } catch (err) {
      const error = err as APIError;
      console.error('[ProductResults] Search failed:', error);

      if (error.status === 429) {
        const retryAfter = error.retryAfter || 1758354973; // Unix timestamp
        const retryDate = new Date(retryAfter * 1000);
        setError(`Rate limited! Please wait until ${retryDate.toLocaleTimeString()} before trying again (${Math.ceil((retryAfter * 1000 - Date.now()) / 1000 / 60)} minutes remaining)`);
      } else {
        setError(error.message || "Failed to search for products");
      }

      setProducts([]);
      toast.error(error.status === 429 ? "Rate limited by server. Please try again later." : "Failed to search for products");
    } finally {
      setLoading(false);
    }
  };



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
            onClick={() => query && fetchProducts(query)}
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
              <div
                key={`${product.marketplace}-${product.name}-${index}`}
                className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => onProductSelect?.(product)}
              >
                {/* Product Image */}
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                  />
                  <Badge
                    className="absolute top-2 left-2 font-medium text-xs"
                    style={{
                      background: `${marketplaceColors[product.marketplace.toLowerCase()] || "#22d3ee"}20`,
                      border: `1px solid ${marketplaceColors[product.marketplace.toLowerCase()] || "#22d3ee"}`,
                      color: marketplaceColors[product.marketplace.toLowerCase()] || "#22d3ee",
                    }}
                  >
                    {product.marketplace}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h4>

                  {/* Price */}
                  {product.price !== null && product.price !== undefined && product.price > 0 ? (
                    <div className="flex items-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                        Rs. {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400">Price not available</span>
                    </div>
                  )}

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-300">{product.rating}/5</span>
                      </div>
                    </div>
                  )}

                  {/* Marketplace indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: marketplaceColors[product.marketplace.toLowerCase()] || "#22d3ee" }}
                      />
                      <span className="text-sm text-gray-400 capitalize">{product.marketplace}</span>
                    </div>

                    {product.company && (
                      <span className="text-xs text-gray-500">{product.company}</span>
                    )}
                  </div>

                  {/* Go to Product Button */}
                  <Button
                    className="w-full mt-3 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(product.url, '_blank');
                    }}
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                      border: "none",
                    }}
                  >
                    Go to Product
                  </Button>
                </div>
              </div>
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
