import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Shield, Sparkles, Zap, Eye } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import heroImage from "@/assets/hero.jpeg";

// Configuration for stats with enhanced visual impact
const STATS_CONFIG = [
  { 
    value: "50M+", 
    label: "Products Tracked", 
    color: "text-cyan-400",
    glow: "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]",
    icon: Search
  },
  { 
    value: "$2.5B", 
    label: "Money Saved", 
    color: "text-green-400",
    glow: "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
    icon: TrendingUp
  },
  { 
    value: "1M+", 
    label: "Active Users", 
    color: "text-purple-400",
    glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
    icon: Eye
  },
  { 
    value: "5", 
    label: "Marketplaces", 
    color: "text-cyan-400",
    glow: "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]",
    icon: Zap
  }
];

// Enhanced feature configuration with glassmorphic styling
const FEATURES_CONFIG = [
  {
    icon: Search,
    title: "Smart Search",
    description: "AI-powered search across multiple marketplaces with real-time indexing and instant results",
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-cyan-600/10",
    borderColor: "border-cyan-500/30",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
  },
  {
    icon: TrendingUp,
    title: "Price Trends",
    description: "Advanced analytics with predictive modeling and interactive charts for optimal buying decisions",
    color: "text-green-400",
    gradient: "from-green-500/20 to-green-600/10",
    borderColor: "border-green-500/30",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]"
  },
  {
    icon: Shield,
    title: "Price Alerts",
    description: "Intelligent notifications with customizable thresholds and multi-channel delivery",
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
  }
];

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Enhanced particles with different types and behaviors
  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      color: i % 3 === 0 ? 'bg-cyan-400' : i % 3 === 1 ? 'bg-green-400' : 'bg-purple-400',
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      isFloating: i % 4 === 0,
    })), []
  );

  // Intersection observer for entrance animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Mouse parallax effect
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      aria-label="Hero section showcasing price tracking platform"
      onMouseMove={handleMouseMove}
    >
      {/* Enhanced animated background with parallax */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Modern dashboard interface showing price tracking charts and analytics for multiple e-commerce platforms"
          className="w-full h-full object-cover opacity-15 scale-110 transition-transform duration-1000 ease-out"
          style={{
            transform: `scale(${1.1 + mousePosition.x * 0.02}) translateX(${mousePosition.x * -10}px) translateY(${mousePosition.y * -10}px)`
          }}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/85 to-slate-950/95" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-950" />
      </div>
      
      {/* Enhanced floating particles with multiple animation types */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none" 
        aria-hidden="true"
      >
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`absolute rounded-full ${particle.color} ${
              particle.isFloating ? 'animate-bounce' : 'animate-pulse'
            }`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter: `drop-shadow(0 0 ${particle.size * 2}px currentColor)`,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs for ambient lighting */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className={`max-w-6xl mx-auto space-y-12 transition-all duration-1500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Enhanced main heading with multiple gradients and animations */}
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-cyan-400 mr-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-sm font-medium tracking-widest text-cyan-400/80 uppercase">
                Next-Generation Price Intelligence
              </span>
              <Sparkles className="w-8 h-8 text-purple-400 ml-3 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight">
              <span className="block bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] animate-pulse">
                Track Prices.
              </span>
              <span className="block bg-gradient-to-r from-green-400 via-green-200 to-green-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse" style={{ animationDelay: '0.5s' }}>
                Save Money.
              </span>
              <span className="block bg-gradient-to-r from-purple-400 via-purple-200 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse" style={{ animationDelay: '1s' }}>
                Smarter Shopping
              </span>
            </h1>
          </div>
          
          {/* Enhanced subtitle with glassmorphic background */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-sm rounded-2xl" />
            <p className="relative text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light px-6 py-4">
              Harness the power of <span className="text-cyan-400 font-semibold">AI-driven analytics</span> to monitor prices across 
              <span className="text-green-400 font-semibold"> Amazon, eBay, AliExpress</span>, and more. 
              Get <span className="text-purple-400 font-semibold">intelligent alerts</span> and never overpay again.
            </p>
          </div>

          {/* Enhanced feature highlights with glassmorphic cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 mb-16">
            {FEATURES_CONFIG.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={feature.title} 
                  className={`group relative backdrop-blur-xl bg-gradient-to-br ${feature.gradient} border ${feature.borderColor} rounded-2xl p-8 transition-all duration-500 hover:scale-105 ${feature.hoverGlow} hover:backdrop-blur-2xl cursor-pointer`}
                  style={{ 
                    animationDelay: `${index * 200}ms`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  {/* Card glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="mb-6 relative">
                      <div className={`absolute inset-0 ${feature.color} opacity-20 blur-xl rounded-full`} />
                      <IconComponent 
                        className={`relative h-12 w-12 ${feature.color} mx-auto drop-shadow-[0_0_15px_currentColor] group-hover:scale-110 transition-transform duration-300`}
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="font-bold text-xl mb-4 text-white group-hover:text-opacity-90 transition-colors">
                      {feature.title}
                    </h2>
                    <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced CTA buttons with advanced styling */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              className="group relative min-w-[240px] w-full sm:w-auto h-14 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 text-white font-semibold text-lg transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] border-0 rounded-xl overflow-hidden"
              aria-describedby="cta-description"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Start Tracking Now
              </span>
            </Button>
            
            <Button 
              className="group relative min-w-[240px] w-full sm:w-auto h-14 bg-transparent hover:bg-white/5 text-white font-semibold text-lg transition-all duration-500 hover:scale-105 border-2 border-purple-500/50 hover:border-purple-400 rounded-xl backdrop-blur-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              <span className="relative flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" />
                View Live Demo
              </span>
            </Button>
          </div>
          
          {/* Hidden description for screen readers */}
          <p id="cta-description" className="sr-only">
            Begin tracking product prices across multiple e-commerce platforms with AI-powered analytics
          </p>

          {/* Enhanced stats with icons and improved visual hierarchy */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 mt-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS_CONFIG.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div 
                    key={stat.label} 
                    className="text-center group cursor-pointer transition-transform duration-300 hover:scale-110"
                    style={{ 
                      animationDelay: `${index * 100 + 1000}ms`,
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(15px)'
                    }}
                  >
                    <div className="mb-3">
                      <IconComponent className={`w-8 h-8 ${stat.color} mx-auto mb-2 ${stat.glow} group-hover:scale-125 transition-transform duration-300`} />
                    </div>
                    <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${stat.color} ${stat.glow} mb-2 group-hover:animate-pulse`}>
                      {stat.value}
                    </div>
                    <div className="text-slate-400 text-sm sm:text-base font-medium tracking-wide group-hover:text-slate-300 transition-colors">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-cyan-400/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};