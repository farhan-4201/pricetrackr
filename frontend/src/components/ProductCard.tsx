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
      className="rounded-xl p-6 border transition-all duration-700 hover:scale-[1.03] hover:rotate-1 cursor-pointer group relative overflow-hidden h-full flex flex-col color-shift-hover"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(34, 211, 238, 0.1)",
        boxShadow: isHovered
          ? "0 25px 50px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)"
          : "0 8px 32px rgba(0, 0, 0, 0.3)",
        minHeight: "400px", // Consistent minimum height
        transform: isHovered ? "translateY(-8px) rotateX(5deg)" : "translateY(0) rotateX(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Glow */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 70%)"
        }}
      />

      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          style={{
            border: "1px solid rgba(34, 211, 238, 0.1)"
          }}
        />
        
        {/* Wishlist Button */}
        <Button
          className={`absolute top-2 right-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          } ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
          style={{
            background: isWishlisted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            border: isWishlisted ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.2)",
            width: "40px",
            height: "40px",
            padding: "0"
          }}
          onClick={handleWishlistClick}
          disabled={loading}
        >
          <Heart className={`h-4 w-4 transition-colors duration-300 ${
            isWishlisted ? 'fill-red-400 text-red-400' : 'text-white hover:text-red-400'
          } ${loading ? 'animate-pulse' : ''}`} />
        </Button>
        
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
          {product.category}
        </Badge>

        {/* Price Change Indicator */}
        <div 
          className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
            product.priceChange < 0 ? 'text-green-400' : 'text-red-400'
          }`}
          style={{
            background: product.priceChange < 0 
              ? "rgba(34, 197, 94, 0.2)" 
              : "rgba(239, 68, 68, 0.2)",
            backdropFilter: "blur(8px)",
            border: product.priceChange < 0 
              ? "1px solid rgba(34, 197, 94, 0.3)" 
              : "1px solid rgba(239, 68, 68, 0.3)"
          }}
        >
          {product.priceChange < 0 ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
          <span>{Math.abs(product.priceChange)}%</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-4 relative z-10">
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-cyan-400 transition-colors duration-300 truncate">
          {product.name}
        </h3>
        
        {/* Rating - Removed based on user feedback */}
        {/* <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 transition-colors duration-300 ${
                  i < Math.floor(product.rating) 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-slate-600'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm text-slate-400">
            {product.rating} ({product.reviews.toLocaleString()})
          </span>
        </div> */}

        {/* Price Section */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {product.price ? `Rs. ${product.price.toLocaleString()}` : "N/A"}
            </span>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: marketplaceColors[product.marketplace.toLowerCase()],
                  boxShadow: `0 0 10px ${marketplaceColors[product.marketplace.toLowerCase()]}30`
                }}
              />
              <span className="capitalize text-sm text-slate-400">{product.marketplace}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <Button
            className="flex-1 font-medium transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #22d3ee, #22c55e)",
              border: "none",
              boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)"
            }}
            onClick={(e) => {
              e.stopPropagation();
              window.open(product.url, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Product
          </Button>

          <Button
            className={`flex-1 font-medium transition-all duration-300 ${
              isWishlisted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
            } ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
            style={{
              border: "none",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
              background: isWishlisted
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #374151, #4b5563)",
            }}
            onClick={handleWishlistClick}
            disabled={loading}
          >
            <Heart className={`h-4 w-4 mr-2 transition-colors duration-300 ${
              isWishlisted ? 'fill-current' : ''
            }`} />
            {loading ? '...' : (isWishlisted ? 'In Watchlist' : 'Add to Watchlist')}
          </Button>
        </div>
      </div>

      {/* Hover Glow Border */}
      <div 
        className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: "linear-gradient(45deg, transparent, rgba(34, 211, 238, 0.1), transparent)",
          padding: "1px"
        }}
      >
        <div 
          className="w-full h-full rounded-xl"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
        />
      </div>
    </div>
  );
};
