import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingDown, TrendingUp, Heart, ExternalLink, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { watchlistAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    marketplace: string;
    rating: number;
    reviews: number;
    priceChange: number;
    category: string;
    url: string;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const marketplaceColors: { [key: string]: string } = {
    daraz: "#22d3ee",
    priceoye: "#ff4081",
    amazon: "#fb923c",
    ebay: "#3b82f6",
    aliexpress: "#ef4444",
  };

  // Check watchlist status on component mount
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      try {
        const response = await watchlistAPI.checkWatchlistStatus(product.id);
        setIsWishlisted(response.inWatchlist);
      } catch (error) {
        // Silently fail - user might not be logged in
        console.log('Unable to check watchlist status:', error);
      }
    };

    checkWatchlistStatus();
  }, [product.id]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (loading) return;

    setLoading(true);

    try {
      if (isWishlisted) {
        // Remove from watchlist
        const response = await watchlistAPI.checkWatchlistStatus(product.id);
        if (response.item) {
          await watchlistAPI.removeFromWatchlist(response.item._id);
          setIsWishlisted(false);
          toast({
            title: "Removed from watchlist",
            description: `Removed ${product.name} from your watchlist`,
          });
        }
      } else {
        // Add to watchlist
        console.log('Adding to watchlist:', {
          productId: product.id,
          name: product.name,
          image: product.image,
          marketplace: product.marketplace,
          category: product.category,
          currentPrice: product.price,
          url: product.url,
        });
        await watchlistAPI.addToWatchlist({
          productId: product.id,
          name: product.name,
          image: product.image,
          marketplace: product.marketplace.toLowerCase(), // Convert to lowercase to match enum
          category: product.category,
          currentPrice: product.price || undefined, // Convert 0/null to undefined since schema allows null
          url: product.url,
        });
        setIsWishlisted(true);
        toast({
          title: "Added to watchlist",
          description: `Added ${product.name} to your watchlist`,
        });
      }
    } catch (error) {
      console.error('Watchlist operation failed:', error);
      toast({
        title: "Error",
        description: "Unable to update watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 border transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-cyan-400/50 cursor-pointer group relative overflow-hidden h-full flex flex-col bg-slate-900/50"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "420px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.08) 0%, transparent 70%)"
        }}
      />

      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Wishlist Button */}
        <Button
          variant="outline"
          size="icon"
          className={`absolute top-2 right-2 transition-all duration-300 h-9 w-9 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          } ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
          onClick={handleWishlistClick}
          disabled={loading}
        >
          <Heart className={`h-4 w-4 transition-colors duration-300 ${
            isWishlisted ? 'fill-red-400 text-red-400' : 'text-white hover:text-red-400'
          } ${loading ? 'animate-pulse' : ''}`} />
        </Button>

        {/* Category Badge */}
        <Badge
          variant="outline"
          className="absolute top-2 left-2 font-medium text-cyan-300 border-cyan-300/20"
        >
          {product.category}
        </Badge>

        {/* Price Change Indicator */}
        {product.priceChange !== 0 && (
          <div
            className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
              product.priceChange < 0 ? 'text-green-400' : 'text-red-400'
            }`}
            style={{
              background: product.priceChange < 0
                ? "rgba(34, 197, 94, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
              backdropFilter: "blur(8px)",
              border: product.priceChange < 0
                ? "1px solid rgba(34, 197, 94, 0.2)"
                : "1px solid rgba(239, 68, 68, 0.2)"
            }}
          >
            {product.priceChange < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            <span>{Math.abs(product.priceChange)}%</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3 flex-grow flex flex-col">
        <h3 className="font-semibold text-base leading-snug text-white group-hover:text-cyan-300 transition-colors duration-300 flex-grow">
          {product.name}
        </h3>

        {/* Price & Marketplace Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {product.price ? `Rs. ${product.price.toLocaleString()}` : "N/A"}
            </span>
            <div className="flex items-center space-x-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: marketplaceColors[product.marketplace.toLowerCase()],
                  boxShadow: `0 0 8px ${marketplaceColors[product.marketplace.toLowerCase()]}50`
                }}
              />
              <span className="capitalize text-xs text-slate-400">{product.marketplace}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 pt-4 mt-auto">
        <Button
          variant="cyber"
          className="flex-1 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            window.open(product.url, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Go to Store
        </Button>
      </div>
    </div>
  );
};
