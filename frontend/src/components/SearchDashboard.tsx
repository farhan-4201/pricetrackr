import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, Zap, TrendingDown } from "lucide-react";

// ---- Define product type ----
type Product = {
  id: string;
  name: string;
  image: string;
  prices: Record<string, number>; // marketplace -> price
  rating: number;
  reviews: number;
  priceChange: number;
  category: string;
};

// Export the component to fix React Fast Refresh
export const ProductCard = ({ product }: { product: Product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fixed type predicate syntax
  const lowestPrice = Math.min(
    ...Object.values(product.prices).filter((p): p is number => typeof p === "number")
  );

  // Fixed type predicate syntax for priceEntries
  const priceEntries = Object.entries(product.prices).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number"
  );

  const marketplaceColors: Record<string, string> = {
    amazon: "#fb923c",
    ebay: "#3b82f6",
    aliexpress: "#ef4444",
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
          src={product.image}
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
          {product.category}
        </Badge>
        <div
          className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
            product.priceChange < 0 ? "text-green-400" : "text-red-400"
          }`}
          style={{
            background:
              product.priceChange < 0
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <TrendingDown className="h-3 w-3" />
          <span>{Math.abs(product.priceChange)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-cyan-400 transition-colors duration-300">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            ${lowestPrice.toFixed(2)}
          </span>
        </div>

        <div className="space-y-2">
          {priceEntries.map(([marketplace, price]) => (
            <div
              key={marketplace}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: marketplaceColors[marketplace] }}
                />
                <span className="capitalize text-slate-300">{marketplace}</span>
              </div>
              <span className="font-medium text-white">
                ${price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Button
          className="w-full font-medium"
          style={{
            background: "linear-gradient(135deg, #22d3ee, #22c55e)",
            border: "none",
          }}
        >
          Add to Watchlist
        </Button>
      </div>
    </div>
  );
};

// Mock data for demonstration
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    prices: { amazon: 129.99, ebay: 119.99, aliexpress: 89.99 },
    rating: 4.5,
    reviews: 234,
    priceChange: -12,
    category: "Electronics"
  },
  // Add more mock products as needed
];

// Export the SearchDashboard component
export const SearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">PriceTrackr</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="text-white border-cyan-400 hover:bg-cyan-400/10">
              <Zap className="w-4 h-4 mr-2" />
              Tracked Items
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400"
            />
          </div>
          
          <div className="flex gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="home">Home</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="border-gray-600 hover:bg-gray-700"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {mockProducts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
};