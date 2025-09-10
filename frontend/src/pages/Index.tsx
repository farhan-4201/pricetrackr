import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import {
  Search,
  TrendingDown,
  Bell,
  Shield,
  Zap,
  BarChart,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";

export const Index = () => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [scrapedProduct, setScrapedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchLimitExceeded, setSearchLimitExceeded] = useState(false);
  const searchSectionRef = useRef(null);

  const MAX_SEARCHES = 5;
  const STORAGE_KEY = 'pricetracker_search_count';

  useEffect(() => {
    const storedCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('pricetracker_last_reset');

    if (lastReset !== today) {
      localStorage.setItem(STORAGE_KEY, '0');
      localStorage.setItem('pricetracker_last_reset', today);
    }

    const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    setSearchLimitExceeded(currentCount >= MAX_SEARCHES);
  }, []);

  useEffect(() => {
    if (window.location.hash === '#search') {
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    if (!isAuthenticated && searchLimitExceeded) {
      setError('Search limit reached. Please signup for unlimited searches.');
      return;
    }

    setLoading(true);
    setError('');
    setScrapedProduct(null);

    try {
      const data = await apiClient.post('/products/scrape', { product_name: searchTerm });
      setScrapedProduct(data);

      // Increment search count for non-authenticated users
      if (!isAuthenticated) {
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
        localStorage.setItem(STORAGE_KEY, (currentCount + 1).toString());
        setSearchLimitExceeded((currentCount + 1) >= MAX_SEARCHES);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const navigateToSearch = () => {
    if (location.pathname === "/") {
      // Already on home page, just scroll
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigate to home page with hash
      navigate("/#search");
    }
  };

  const features = [
    {
      icon: Search,
      title: "Product Search",
      description: "Search and discover products on your favorite marketplaces"
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified when your tracked items drop in price"
    },
    {
      icon: BarChart,
      title: "Price History",
      description: "View detailed price trends over time"
    },
    {
      icon: Shield,
      title: "Deal Verification",
      description: "Verify deals to ensure authentic savings"
    }
  ];

  return (
    <div style={{ background: '#020617' }}>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)" }}
          />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                    Never Overpay
                  </span>
                  <br />
                  <span className="text-white">Again</span>
                </h1>

                <p className="text-xl text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Track prices across multiple marketplaces, get instant alerts when prices drop,
                  and save thousands on your purchases with our price monitoring system.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={navigateToSearch}
                  size="lg"
                  className="px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
                  }}
                >
                  Start Saving Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                    color: "#22d3ee"
                  }}
                >
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Search Section */}
      <section ref={searchSectionRef} className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Search & Discover Products
          </h2>
          <p className="text-slate-300 mb-8">
            Search for products on Daraz and get real-time pricing and information instantly. {!isAuthenticated && `(${MAX_SEARCHES - (parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10))} searches remaining)`}
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Input
              type="text"
              placeholder="Search for products (e.g., iPhone 14 Pro Max)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || (!isAuthenticated && searchLimitExceeded)}
              style={{
                background: !isAuthenticated && searchLimitExceeded
                  ? "rgba(34, 211, 238, 0.5)"
                  : "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none"
              }}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          {scrapedProduct && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">{scrapedProduct.name}</h3>
              {scrapedProduct.imageUrl && (
                <img
                  src={scrapedProduct.imageUrl}
                  alt={scrapedProduct.name}
                  className="w-full max-w-sm mx-auto mb-4 rounded-lg shadow-lg"
                />
              )}
              {scrapedProduct.currentPrice && (
                <p className="text-3xl font-bold text-cyan-400 mb-4">Rs. {scrapedProduct.currentPrice.toLocaleString()}</p>
              )}
              {scrapedProduct.description && (
                <p className="text-slate-300 mb-4">{scrapedProduct.description}</p>
              )}
              {scrapedProduct.category && (
                <p className="text-sm text-slate-400">Category: {scrapedProduct.category}</p>
              )}
              {scrapedProduct.rating && (
                <p className="text-sm text-slate-400">Rating: {scrapedProduct.rating}/5</p>
              )}
              {scrapedProduct.url && (
                <a
                  href={scrapedProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
                >
                  View on Daraz
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to make smart purchasing decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border transition-all duration-500 hover:scale-105 hover:border-cyan-400/30 group"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(34, 211, 238, 0.1)",
                    boxShadow: "0 0 20px rgba(34, 211, 238, 0.2)"
                  }}
                >
                  <feature.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div 
            className="p-12 rounded-2xl border relative overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
            }}
          >
            {/* Background Animation */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: "linear-gradient(45deg, transparent, rgba(34, 211, 238, 0.1), transparent, rgba(34, 197, 94, 0.1), transparent)"
              }}
            />

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Start Saving?
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Sign up to start tracking prices and saving money effortlessly
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={navigateToSearch}
                  size="lg"
                  className="px-12 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
                  }}
                >
                  Get Started Free
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg" 
                  className="px-12 py-4 text-lg font-medium transition-all duration-300"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: "#a855f7"
                  }}
                >
                  View Pricing
                </Button>
              </div>

              <div className="flex justify-center items-center space-x-6 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
