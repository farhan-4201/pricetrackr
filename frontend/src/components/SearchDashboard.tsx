import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, Zap, TrendingDown, Loader2 } from "lucide-react";
import { productsAPI } from "@/lib/api";
import { toast } from "sonner";

// ---- Define product type ----
type ScrapedProduct = {
  name: string;
  currentPrice?: number;
  imageUrl?: string;
  url?: string;
  category?: string;
  rating?: number;
  vendor?: string;
  description?: string;
};

// Add this type near the top of the file with other type definitions
type APIError = {
    message: string;
    status?: number;
};

// Export the component to fix React Fast Refresh
export const ProductCard = ({ product }: { product: ScrapedProduct }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToWatchlist = async () => {
    if (!product.name) return;

    try {
      await productsAPI.createProduct({
        name: product.name,
        image: product.imageUrl || '',
        prices: {
          daraz: product.currentPrice || 0
        },
        category: product.category || 'General'
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
  };

  // Make sure to return JSX
  return (
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
        <img
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
          {product.category || 'General'}
        </Badge>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-cyan-400 transition-colors duration-300">
          {product.name}
        </h3>

        {product.currentPrice && (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Rs. {product.currentPrice.toLocaleString()}
            </span>
          </div>
        )}

        {product.vendor && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: marketplaceColors[product.vendor] || "#22d3ee" }}
                />
                <span className="capitalize text-slate-300">{product.vendor}</span>
              </div>
            </div>
          </div>
        )}

        {product.rating && (
          <div className="text-sm text-slate-400">
            Rating: ⭐ {product.rating}/5
          </div>
        )}

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
  );
};



// Export the SearchDashboard component
export const SearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setScrapedProduct(null);

    try {
        const products = await productsAPI.searchDarazProducts(searchQuery);
        setScrapedProduct(products[0]); // Or handle multiple products as needed
    } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || "Failed to search for product");
        toast.error("Failed to search for product");
    } finally {
        setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Daraz Product Search</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="text-white border-cyan-400 hover:bg-cyan-400/10">
              <Zap className="w-4 h-4 mr-2" />
              View Watchlist
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for products on Daraz (e.g., iPhone 14 Pro Max)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4 py-6 text-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400"
            />
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
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">❌ {error}</div>
            <p className="text-gray-400">Try searching with different keywords or check your internet connection.</p>
          </div>
        )}

        {/* Product Result */}
        {scrapedProduct && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductCard product={scrapedProduct} />
          </div>
        )}

        {/* Empty State */}
        {!scrapedProduct && !loading && !error && searchQuery && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enter a product name and click search to find products on Daraz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDashboard;
