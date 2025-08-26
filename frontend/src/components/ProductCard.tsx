import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingDown, TrendingUp, Heart, ExternalLink, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image: string;
    prices: {
      amazon?: number;
      ebay?: number;
      aliexpress?: number;
    };
    rating: number;
    reviews: number;
    priceChange: number;
    category: string;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
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
          }`}
          style={{
            background: isWishlisted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            border: isWishlisted ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.2)",
            width: "40px",
            height: "40px",
            padding: "0"
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
        >
          <Heart className={`h-4 w-4 transition-colors duration-300 ${
            isWishlisted ? 'fill-red-400 text-red-400' : 'text-white hover:text-red-400'
          }`} />
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
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-cyan-400 transition-colors duration-300">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center space-x-2">
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
        </div>

        {/* Price Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              ${lowestPrice?.toFixed(2)}
            </span>
            <span className="text-sm text-slate-500">Best Price</span>
          </div>
          
          {/* Marketplace Prices */}
          <div className="space-y-2">
            {priceEntries.map(([marketplace, price]) => (
              <div 
                key={marketplace} 
                className="flex items-center justify-between text-sm p-2 rounded-lg transition-all duration-300 hover:bg-white/5"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      background: marketplaceColors[marketplace as keyof typeof marketplaceColors],
                      boxShadow: `0 0 10px ${marketplaceColors[marketplace as keyof typeof marketplaceColors]}30`
                    }}
                  />
                  <span className="capitalize text-slate-300">{marketplace}</span>
                  {price === lowestPrice && (
                    <Badge 
                      className="text-xs px-1 py-0"
                      style={{
                        background: "rgba(34, 197, 94, 0.2)",
                        color: "#22c55e",
                        border: "1px solid rgba(34, 197, 94, 0.3)"
                      }}
                    >
                      Best
                    </Badge>
                  )}
                </div>
                <span className="font-medium text-white">${price?.toFixed(2)}</span>
              </div>
            ))}
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
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Watchlist
          </Button>
          
          <Button 
            className="transition-all duration-300 hover:scale-110"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#22d3ee",
              width: "44px",
              height: "44px",
              padding: "0"
            }}
          >
            <ExternalLink className="h-4 w-4" />
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