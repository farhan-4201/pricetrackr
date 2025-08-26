import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, Zap, TrendingDown } from "lucide-react";

// Import the refined ProductCard component
const ProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const lowestPrice = Math.min(...Object.values(product.prices).filter(Boolean));
  const priceEntries = Object.entries(product.prices).filter(([_, price]) => price);

  const marketplaceColors = {
    amazon: "#fb923c",
    ebay: "#3b82f6", 
    aliexpress: "#ef4444"
  };

  return (
    <div 
      className="rounded-xl p-6 border transition-all duration-500 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(34, 211, 238, 0.1)",
        boxShadow: isHovered ? "0 20px 40px rgba(34, 211, 238, 0.2)" : "0 8px 32px rgba(0, 0, 0, 0.3)"
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
            color: "#22d3ee"
          }}
        >
          {product.category}
        </Badge>
        <div 
          className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
            product.priceChange < 0 ? 'text-green-400' : 'text-red-400'
          }`}
          style={{
            background: product.priceChange < 0 
              ? "rgba(34, 197, 94, 0.2)" 
              : "rgba(239, 68, 68, 0.2)",
            backdropFilter: "blur(8px)"
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
            ${lowestPrice?.toFixed(2)}
          </span>
        </div>

        <div className="space-y-2">
          {priceEntries.map(([marketplace, price]) => (
            <div key={marketplace} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ background: marketplaceColors[marketplace] }}
                />
                <span className="capitalize text-slate-300">{marketplace}</span>
              </div>
              <span className="font-medium text-white">${price?.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <Button 
          className="w-full font-medium"
          style={{
            background: "linear-gradient(135deg, #22d3ee, #22c55e)",
            border: "none"
          }}
        >
          Add to Watchlist
        </Button>
      </div>
    </div>
  );
};

const mockProducts = [
  {
    id: "1",
    name: "Apple iPhone 15 Pro Max 256GB - Natural Titanium",
    image: "https://images.unsplash.com/photo-1592286404378-b9d55b7d123b?w=400",
    prices: { amazon: 1199.99, ebay: 1149.99, aliexpress: 1089.99 },
    rating: 4.8,
    reviews: 12847,
    priceChange: -5.2,
    category: "Electronics"
  },
  {
    id: "2", 
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    prices: { amazon: 399.99, ebay: 379.99 },
    rating: 4.7,
    reviews: 8942,
    priceChange: 2.1,
    category: "Audio"
  },
  {
    id: "3",
    name: "NVIDIA GeForce RTX 4080 Gaming Graphics Card",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400",
    prices: { amazon: 1199.99, aliexpress: 1089.99 },
    rating: 4.9,
    reviews: 2156,
    priceChange: -8.7,
    category: "PC Components"
  },
  {
    id: "4",
    name: "Samsung 55\" OLED 4K Smart TV - Crystal UHD",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
    prices: { amazon: 899.99, ebay: 849.99, aliexpress: 799.99 },
    rating: 4.6,
    reviews: 5632,
    priceChange: -12.3,
    category: "TV & Home"
  }
];

export const SearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState(["all"]);
  const [isSearching, setIsSearching] = useState(false);

  const marketplaces = [
    { id: "all", name: "All Marketplaces", color: "rgba(34, 211, 238, 0.2)", textColor: "#22d3ee" },
    { id: "amazon", name: "Amazon", color: "rgba(251, 146, 60, 0.2)", textColor: "#fb923c" },
    { id: "ebay", name: "eBay", color: "rgba(59, 130, 246, 0.2)", textColor: "#3b82f6" },
    { id: "aliexpress", name: "AliExpress", color: "rgba(239, 68, 68, 0.2)", textColor: "#ef4444" }
  ];

  const handleMarketplaceFilter = (marketplaceId) => {
    if (marketplaceId === "all") {
      setSelectedMarketplaces(["all"]);
    } else {
      const newSelection = selectedMarketplaces.includes(marketplaceId)
        ? selectedMarketplaces.filter(id => id !== marketplaceId)
        : [...selectedMarketplaces.filter(id => id !== "all"), marketplaceId];
      
      setSelectedMarketplaces(newSelection.length === 0 ? ["all"] : newSelection);
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 1500);
  };

  return (
    <section className="py-20 px-4" style={{ background: '#020617' }}>
      <div className="container mx-auto max-w-7xl">
        {/* Search Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
            Search & Compare Prices
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Find the best deals across multiple marketplaces with real-time price tracking
          </p>
        </div>

        {/* Enhanced Search Bar */}
        <div 
          className="rounded-xl p-6 mb-8 border"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search for products (e.g., iPhone 15, gaming laptop, wireless headphones)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-white placeholder-slate-400 border-0 text-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(34, 211, 238, 0.2)"
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="px-8 h-14 text-lg font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: isSearching 
                  ? "rgba(34, 211, 238, 0.5)" 
                  : "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 4px 20px rgba(34, 211, 238, 0.3)"
              }}
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Marketplace Filters */}
          <div 
            className="rounded-xl p-4 border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            <h3 className="font-semibold mb-3 flex items-center text-white">
              <Filter className="h-4 w-4 mr-2 text-cyan-400" />
              Marketplaces
            </h3>
            <div className="flex flex-wrap gap-2">
              {marketplaces.map((marketplace) => (
                <Badge
                  key={marketplace.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedMarketplaces.includes(marketplace.id) 
                      ? "shadow-lg" 
                      : "hover:shadow-md opacity-70"
                  }`}
                  style={{
                    background: selectedMarketplaces.includes(marketplace.id) 
                      ? marketplace.color 
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${marketplace.textColor}30`,
                    color: selectedMarketplaces.includes(marketplace.id) 
                      ? marketplace.textColor 
                      : "#94a3b8"
                  }}
                  onClick={() => handleMarketplaceFilter(marketplace.id)}
                >
                  {marketplace.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div 
            className="rounded-xl p-4 border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            <h3 className="font-semibold mb-3 text-white">Sort By</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger 
                className="text-white border-0"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(34, 211, 238, 0.2)"
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent 
                style={{
                  background: "rgba(2, 6, 23, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.2)"
                }}
              >
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="discount">Biggest Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div 
            className="rounded-xl p-4 border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            <h3 className="font-semibold mb-3 text-white">View</h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setViewMode("grid")}
                className={`transition-all duration-300 ${
                  viewMode === "grid" 
                    ? "shadow-lg" 
                    : "hover:shadow-md"
                }`}
                style={{
                  background: viewMode === "grid" 
                    ? "linear-gradient(135deg, #22d3ee, #22c55e)" 
                    : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  color: viewMode === "grid" ? "white" : "#94a3b8"
                }}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                className={`transition-all duration-300 ${
                  viewMode === "list" 
                    ? "shadow-lg" 
                    : "hover:shadow-md"
                }`}
                style={{
                  background: viewMode === "list" 
                    ? "linear-gradient(135deg, #22d3ee, #22c55e)" 
                    : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  color: viewMode === "list" ? "white" : "#94a3b8"
                }}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6">
          <p className="text-slate-400 text-lg">
            Showing <span className="text-cyan-400 font-medium">{mockProducts.length}</span> results for 
            <span className="text-white font-medium"> "{searchQuery || 'popular electronics'}"</span>
          </p>
        </div>

        {/* Product Grid */}
        <div className={`grid gap-6 mb-12 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1 max-w-4xl mx-auto"
        }`}>
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button 
            className="px-12 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
              color: "#22d3ee"
            }}
          >
            Load More Results
          </Button>
        </div>
      </div>
    </section>
  );
};