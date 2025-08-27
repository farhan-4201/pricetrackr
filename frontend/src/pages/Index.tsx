import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [currentPrice, setCurrentPrice] = useState(1299);
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPrice(prev => prev - Math.floor(Math.random() * 50) + 25);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Search,
      title: "Smart Price Tracking",
      description: "Monitor prices across Amazon, eBay, AliExpress and more with real-time updates"
    },
    {
      icon: Bell,
      title: "Instant Alerts",
      description: "Get notified the moment your tracked items drop in price"
    },
    {
      icon: BarChart,
      title: "Price History",
      description: "View detailed price trends and make informed purchase decisions"
    },
    {
      icon: Shield,
      title: "Deal Verification",
      description: "AI-powered deal verification to ensure authentic savings"
    }
  ];

  const stats = [
    { label: "Products Tracked", value: "2M+", color: "#22d3ee" },
    { label: "Money Saved", value: "$50M+", color: "#22c55e" },
    { label: "Active Users", value: "500K+", color: "#a855f7" },
    { label: "Price Alerts", value: "10M+", color: "#22d3ee" }
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <Badge 
                className="inline-flex items-center space-x-2 px-4 py-2 font-medium"
                style={{
                  background: "rgba(34, 211, 238, 0.1)",
                  border: "1px solid rgba(34, 211, 238, 0.3)",
                  color: "#22d3ee"
                }}
              >
                <Zap className="h-4 w-4" />
                <span>AI-Powered Price Tracking</span>
              </Badge>

              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                    Never Overpay
                  </span>
                  <br />
                  <span className="text-white">Again</span>
                </h1>
                
                <p className="text-xl text-slate-300 max-w-xl leading-relaxed">
                  Track prices across multiple marketplaces, get instant alerts when prices drop, 
                  and save thousands on your purchases with our intelligent price monitoring system.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
                  }}
                >
                  Start Tracking Free
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

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center space-y-2">
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Price Demo */}
            <div className="relative">
              <div 
                className="rounded-2xl p-8 border relative overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
                }}
              >
                {/* Animated Glow */}
                <div 
                  className="absolute inset-0 opacity-50 animate-pulse"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)"
                  }}
                />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">iPhone 15 Pro Max</h3>
                    <Badge style={{ background: "rgba(34, 197, 94, 0.2)", color: "#22c55e" }}>
                      Live Tracking
                    </Badge>
                  </div>

                  {/* Price Display */}
                  <div className="text-center space-y-4">
                    <div 
                      className={`text-4xl font-bold transition-all duration-300 ${
                        isAnimating ? 'scale-110 text-green-400' : 'scale-100'
                      }`}
                      style={{ 
                        color: isAnimating ? "#22c55e" : "#22d3ee",
                        textShadow: "0 0 30px rgba(34, 211, 238, 0.5)"
                      }}
                    >
                      ${currentPrice}
                    </div>
                    <p className="text-slate-400">Best price across all platforms</p>
                  </div>

                  {/* Marketplace Comparison */}
                  <div className="space-y-3">
                    {[
                      { name: "Amazon", price: currentPrice + 50, color: "#fb923c" },
                      { name: "eBay", price: currentPrice + 25, color: "#3b82f6" },
                      { name: "AliExpress", price: currentPrice, color: "#22c55e", best: true }
                    ].map((store, index) => (
                      <div 
                        key={store.name}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: store.best 
                            ? "rgba(34, 197, 94, 0.1)" 
                            : "rgba(255, 255, 255, 0.03)",
                          border: store.best 
                            ? "1px solid rgba(34, 197, 94, 0.3)" 
                            : "1px solid rgba(255, 255, 255, 0.1)"
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ background: store.color }}
                          />
                          <span className="text-slate-300">{store.name}</span>
                          {store.best && (
                            <Badge 
                              className="text-xs"
                              style={{ 
                                background: "rgba(34, 197, 94, 0.2)", 
                                color: "#22c55e" 
                              }}
                            >
                              Best
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium text-white">${store.price}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full py-3 font-medium"
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                      border: "none"
                    }}
                  >
                    Track This Product
                  </Button>
                </div>
              </div>
            </div>
          </div>
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

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              What Our Users Say
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join thousands of smart shoppers saving money every day
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Tech Enthusiast", 
                content: "Saved over $800 on my gaming setup! The price alerts are incredibly accurate.",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
                rating: 5
              },
              {
                name: "Marcus Rodriguez",
                role: "Small Business Owner",
                content: "Essential tool for bulk purchases. The marketplace comparison saves hours of research.",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", 
                rating: 5
              },
              {
                name: "Emma Thompson",
                role: "Bargain Hunter",
                content: "Finally, a tool that actually works! No more missing out on great deals.",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border transition-all duration-500 hover:scale-105"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <div className="flex items-center space-x-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <blockquote className="text-slate-300 mb-6 italic">
                  "{testimonial.content}"
                </blockquote>
                
                <div className="flex items-center space-x-3">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full border border-cyan-400/30"
                  />
                  <div>
                    <div className="font-medium text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
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
                  Join over 500,000 smart shoppers who have saved millions using our platform
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
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