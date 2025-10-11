import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, ExternalLink, Trash2, Package, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { watchlistAPI, WatchlistItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function WatchlistPage() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarketplace, setSelectedMarketplace] = useState("all");
  const { toast } = useToast();

  const marketplaceColors: { [key: string]: string } = {
    daraz: "#22d3ee",
    priceoye: "#ff4081",
    amazon: "#fb923c",
    ebay: "#3b82f6",
    aliexpress: "#ef4444",
  };

  const marketplaces = ["all", ...Object.keys(marketplaceColors)];

  // Fetch watchlist items
  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const items = await watchlistAPI.getWatchlist();
      setWatchlistItems(items);
      setFilteredItems(items);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      toast({
        title: "Error",
        description: "Failed to load watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search and marketplace
  useEffect(() => {
    let filtered = watchlistItems;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedMarketplace !== "all") {
      filtered = filtered.filter(item => item.marketplace === selectedMarketplace);
    }

    setFilteredItems(filtered);
  }, [watchlistItems, searchQuery, selectedMarketplace]);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    try {
      await watchlistAPI.removeFromWatchlist(itemId);
      setWatchlistItems(prev => prev.filter(item => item._id !== itemId));
      toast({
        title: "Removed from watchlist",
        description: `${itemName} has been removed from your watchlist`,
      });
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEnableTracking = async (itemId: string, currentStatus: boolean) => {
    try {
      await watchlistAPI.updateWatchlistItem(itemId, { isTracking: !currentStatus });
      setWatchlistItems(prev =>
        prev.map(item =>
          item._id === itemId ? { ...item, isTracking: !currentStatus } : item
        )
      );
      toast({
        title: currentStatus ? "Tracking disabled" : "Tracking enabled",
        description: `Price tracking ${currentStatus ? "disabled" : "enabled"} for this item`,
      });
    } catch (error) {
      console.error("Failed to update tracking:", error);
      toast({
        title: "Error",
        description: "Failed to update tracking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const WatchlistCard = ({ item }: { item: WatchlistItem }) => (
    <motion.div
      className="rounded-xl p-6 border transition-all duration-500 hover:scale-[1.02] cursor-pointer group relative overflow-hidden h-full flex flex-col"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(34, 211, 238, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        minHeight: "320px"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 70%)"
        }}
      />

      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <img
          src={item.image || "/default-product.png"}
          alt={item.name}
          className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
          style={{
            border: "1px solid rgba(34, 211, 238, 0.1)"
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-product.png";
          }}
        />

        {/* Category Badge */}
        <Badge
          className="absolute top-2 left-2 font-medium"
          style={{
            background: "rgba(34, 211, 238, 0.2)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            color: "#22d3ee"
          }}
        >
          {item.category || "General"}
        </Badge>

        {/* Tracking Badge */}
        {item.isTracking && (
          <Badge
            className="absolute top-2 right-2 font-medium"
            style={{
              background: "rgba(34, 197, 94, 0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e"
            }}
          >
            Tracking
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3 relative z-10 flex-grow">
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-cyan-400 transition-colors duration-300 truncate">
          {item.name}
        </h3>

        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {item.currentPrice ? `Rs. ${item.currentPrice.toLocaleString()}` : "Price unavailable"}
            </span>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: marketplaceColors[item.marketplace] || "#666",
                  boxShadow: `0 0 10px ${marketplaceColors[item.marketplace]}30`
                }}
              />
              <span className="capitalize text-sm text-slate-400">{item.marketplace}</span>
            </div>
          </div>
        </div>

        {/* Added Date */}
        <div className="text-xs text-slate-500">
          Added {new Date(item.addedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 pt-4 relative z-10">
        <Button
          className="flex-1 font-medium transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #22d3ee, #22c55e)",
            border: "none",
            boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)"
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.url, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Product
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEnableTracking(item._id, item.isTracking || false);
          }}
          style={{
            background: item.isTracking
              ? "rgba(34, 197, 94, 0.2)"
              : "rgba(255, 255, 255, 0.1)",
            border: item.isTracking
              ? "1px solid rgba(34, 197, 94, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.2)",
            color: item.isTracking ? "#22c55e" : "#fff"
          }}
        >
          <Package className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveItem(item._id, item.name);
          }}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            color: "#ef4444"
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Hover Glow Border */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500"
        style={{
          background: "linear-gradient(45deg, transparent, rgba(34, 211, 238, 0.1), transparent)",
          padding: "1px"
        }}
      >
        <div
          className="w-full h-full rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Heart className="h-8 w-8 text-red-400" />
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
            My Watchlist
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {marketplaces.map(marketplace => (
                <option key={marketplace} value={marketplace}>
                  {marketplace === "all" ? "All Marketplaces" : marketplace.charAt(0).toUpperCase() + marketplace.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="text-slate-400 text-sm">
            {filteredItems.length} of {watchlistItems.length} items
            {searchQuery || selectedMarketplace !== "all" ? " (filtered)" : ""}
          </div>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      ) : watchlistItems.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Heart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-400 mb-2">Your watchlist is empty</h2>
          <p className="text-slate-500 mb-6">Start adding products you love to keep track of them here!</p>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: "linear-gradient(135deg, #22d3ee, #22c55e)",
              border: "none",
              boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)"
            }}
          >
            Browse Products
          </Button>
        </motion.div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-400 mb-2">No items match your filters</h2>
          <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredItems.map((item) => (
            <WatchlistCard key={item._id} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
