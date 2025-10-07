import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Users,
  Award,
  Globe,
  Zap,
  Heart,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Headphones,
  Search,
  DollarSign,
  Lightbulb
} from "lucide-react";

export const About = () => {
  const navigate = useNavigate();
  const [showStory, setShowStory] = useState(false);

  const navigateToSearch = () => {
    navigate("/#search");
  };

  const toggleStory = () => {
    setShowStory(!showStory);
  };
  const stats = [
    { value: "500K+", label: "Happy Users", icon: Users, color: "#22d3ee" },
    { value: "$50M+", label: "Money Saved", icon: TrendingUp, color: "#22c55e" },
    { value: "50+", label: "Marketplaces", icon: Globe, color: "#a855f7" },
    { value: "99.9%", label: "Uptime", icon: Shield, color: "#22d3ee" }
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Co-Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      bio: "Former Amazon engineer with 10+ years in e-commerce and price optimization."
    },
    {
      name: "Sarah Rodriguez", 
      role: "CTO & Co-Founder",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      bio: "AI/ML expert who led data science teams at Google and developed our core algorithms."
    },
    {
      name: "Marcus Thompson",
      role: "Head of Product",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face", 
      bio: "Product visionary with experience building consumer apps at Spotify and Airbnb."
    },
    {
      name: "Emma Davis",
      role: "Head of Engineering",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      bio: "Full-stack engineer who scaled infrastructure at Netflix and Uber."
    }
  ];

  const values = [
    {
      icon: Target,
      title: "Customer First",
      description: "Every decision we make is focused on delivering maximum value to our users"
    },
    {
      icon: Shield,
      title: "Trust & Transparency", 
      description: "We believe in honest pricing, clear policies, and protecting user privacy"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Continuously pushing boundaries with cutting-edge AI and technology"
    },
    {
      icon: Heart,
      title: "Impact",
      description: "Making smart shopping accessible to everyone, regardless of technical expertise"
    }
  ];

  return (
    <div style={{ background: '#020617' }} className="pt-16">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Empowering Smart
              </span>
              <br />
              <span className="text-white">Shopping Decisions</span>
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
              PriceTracker is a final-year degree project designed to solve complex computing problems for consumers and business vendors.
              Our goal is to simplify price tracking and make it accessible to everyone.
            </p>

            <Button
              onClick={toggleStory}
              size="lg"
              className="px-12 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
              }}
            >
              {showStory ? "Hide Our Story" : "Discover Our Story"}
              {showStory ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Personal Story Section */}
      {showStory && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div
              className="p-8 md:p-12 rounded-2xl border relative overflow-hidden"
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

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6"
                       style={{
                         background: "rgba(34, 211, 238, 0.1)",
                         border: "1px solid rgba(34, 211, 238, 0.3)",
                         color: "#22d3ee"
                       }}>
                    <Headphones className="h-5 w-5" />
                    <span className="font-medium">The Journey That Started It All</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                         style={{
                           background: "rgba(34, 211, 238, 0.1)",
                           boxShadow: "0 0 20px rgba(34, 211, 238, 0.2)"
                         }}>
                      <Search className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">The Search</h3>
                    <p className="text-slate-300">
                      It all began with a simple quest for the perfect pair of wireless earbuds
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                         style={{
                           background: "rgba(34, 197, 94, 0.1)",
                           boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)"
                         }}>
                      <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">The Mistake</h3>
                    <p className="text-slate-300">
                      Bought them at what I thought was a great price, only to find them cheaper elsewhere
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                         style={{
                           background: "rgba(168, 85, 247, 0.1)",
                           boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)"
                         }}>
                      <Lightbulb className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">The Solution</h3>
                    <p className="text-slate-300">
                      Realized there must be a better way to track prices across marketplaces
                    </p>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="p-6 rounded-xl border-l-4"
                       style={{
                         background: "rgba(255, 255, 255, 0.03)",
                         borderLeftColor: "#22d3ee",
                         border: "1px solid rgba(34, 211, 238, 0.1)"
                       }}>
                    <p className="text-lg text-slate-200 leading-relaxed mb-4">
                      <span className="text-cyan-400 font-semibold">That frustrating experience</span> sparked something in me.
                      I remember spending hours jumping between different marketplace websites, comparing prices,
                      and feeling overwhelmed by the constant fear of missing out on a better deal.
                    </p>

                    <p className="text-lg text-slate-200 leading-relaxed mb-4">
                      <span className="text-green-400 font-semibold">The breaking point came</span> when I purchased what I thought
                      were premium earbuds for ₨15,000, only to discover them selling for ₨11,500 on another platform just two days later.
                      That ₨3,500 difference stung, but more importantly, it made me realize how broken the current shopping experience was.
                    </p>

                    <p className="text-lg text-slate-200 leading-relaxed">
                      <span className="text-purple-400 font-semibold">That's when the idea for PriceTracker was born.</span>
                      What if there was a tool that could monitor prices across all major marketplaces automatically?
                      What if you could set price alerts and never miss a good deal again?
                      What if shopping could be smart, efficient, and actually save you money instead of costing you time and regret?
                    </p>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <p className="text-slate-400 italic">
                    "From personal frustration to a mission to help millions of shoppers make smarter decisions."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mission Section */}
      {/* ... your mission section code unchanged ... */}

      {/* Values Section */}
      {/* ... your values section code unchanged ... */}

      {/* Team Section */}
      {/* ... your team section code unchanged ... */}

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div 
            className="p-12 rounded-2xl border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
            }}
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Join Our Mission
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Ready to take control of your shopping and start saving money? 
                  Join hundreds of thousands of smart shoppers today.
                </p>
              </div>

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
                Get Started for Free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
