import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  BarChart, 
  Shield, 
  Zap, 
  Heart,
  TrendingDown,
  Clock,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export const Features = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  const navigateToSearch = () => {
    navigate("/#search");
  };

  const mainFeatures = [
    {
      icon: Search,
      title: "Product Search",
      description: "Search and discover products on your favorite marketplaces",
      details: [
        "Easy search across multiple marketplaces including Daraz, Amazon, and more",
        "Detailed product information including prices, ratings, and availability",
        "Real-time updates to ensure accurate pricing information"
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified when the prices of your tracked products drop",
      details: [
        "Set custom alerts for price drops on specific products",
        "Notifications via email and in-app alerts",
        "Track multiple products and get alerts when they become affordable"
      ],
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"
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
              <Zap className="h-4 w-4" />
              <span>Powerful Features</span>
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Everything You Need
              </span>
              <br />
              <span className="text-white">To Save Smart</span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive suite of tools empowers you to track, compare, and save on millions of products 
              across the world's largest marketplaces.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Showcase */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Feature Tabs */}
          <div className="flex flex-col lg:flex-row gap-8 mb-16">
            <div className="lg:w-1/3 space-y-4">
              {mainFeatures.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-6 rounded-xl border transition-all duration-300 ${
                    activeFeature === index ? 'border-cyan-400/50 scale-105' : 'hover:border-cyan-400/30'
                  }`}
                  style={{
                    background: activeFeature === index 
                      ? "rgba(34, 211, 238, 0.1)" 
                      : "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: `1px solid ${activeFeature === index ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.1)'}`,
                    boxShadow: activeFeature === index 
                      ? "0 8px 32px rgba(34, 211, 238, 0.2)" 
                      : "0 8px 32px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <div className="flex items-center space-x-4 mb-3">
                    <div 
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        activeFeature === index ? 'scale-110' : ''
                      }`}
                      style={{
                        background: "rgba(34, 211, 238, 0.1)",
                        boxShadow: activeFeature === index ? "0 0 20px rgba(34, 211, 238, 0.3)" : "none"
                      }}
                    >
                      <feature.icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className={`text-xl font-semibold transition-colors ${
                      activeFeature === index ? 'text-cyan-400' : 'text-white'
                    }`}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-slate-400">
                    {feature.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Feature Details */}
            <div className="lg:w-2/3">
              <div 
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
                }}
              >
                <img 
                  src={mainFeatures[activeFeature].image}
                  alt={mainFeatures[activeFeature].title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {mainFeatures[activeFeature].title}
                  </h3>
                  <div className="space-y-3">
                    {mainFeatures[activeFeature].details.map((detail, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


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
                  Start Saving Today
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Sign up to start tracking prices and saving money effortlessly
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
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
