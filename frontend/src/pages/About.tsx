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
  TrendingUp
} from "lucide-react";

export const About = () => {
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
            <Badge
              className="inline-flex items-center space-x-2 px-4 py-2 mb-6 font-medium"
              style={{
                background: "rgba(34, 211, 238, 0.1)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
                color: "#22d3ee"
              }}
            >
              <Heart className="h-4 w-4" />
              <span>Our Story</span>
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Empowering Smart
              </span>
              <br />
              <span className="text-white">Shopping Decisions</span>
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Founded in 2020, PriceTracker was born from a simple frustration: why is it so hard 
              to know if you're getting a good deal? We set out to democratize smart shopping with 
              AI-powered price intelligence.
            </p>

            <Button 
              size="lg"
              className="px-12 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
              }}
            >
              Start Saving Today
            </Button>

            <p className="text-sm text-slate-400 mt-4">
              Free to start • No credit card required • Join 500K+ users
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center p-8 rounded-xl border transition-all duration-500 hover:scale-105"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <div 
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: `${stat.color}20`,
                    boxShadow: `0 0 30px ${stat.color}30`
                  }}
                >
                  <stat.icon className="h-8 w-8" style={{ color: stat.color }} />
                </div>
                <div 
                  className="text-4xl font-bold mb-2"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-slate-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
