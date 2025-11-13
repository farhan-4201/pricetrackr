import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Zap, CheckCircle, ArrowRight, BarChart3 } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

export const Features = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: "ease-in-out",
    });
  }, []);

  const navigateToSearch = () => {
    navigate("/#search");
  };

  const mainFeatures = [
    {
      icon: Search,
      title: "Product Search",
      description: "Search and discover products on your favorite marketplaces.",
      details: [
        "Search across multiple marketplaces including Daraz, PriceOye, and Telemart.",
        "Get detailed product information including prices, ratings, and availability.",
        "Enjoy real-time updates to ensure accurate pricing information.",
      ],
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&fit=crop",
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified instantly when prices drop.",
      details: [
        "Set custom alerts for your tracked products.",
        "Receive notifications via email or in-app alerts.",
        "Track multiple items and get alerts the moment they become affordable.",
      ],
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&h=900&fit=crop",
    },
    {
      icon: BarChart3,
      title: "Smart Insights",
      description: "Visualize pricing trends with smart analytics.",
      details: [
        "Understand when products are most likely to drop in price.",
        "View historical data and market trends for better decision making.",
        "Compare deals in an interactive chart view.",
      ],
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1115",
    },
  ];

  return (
    <div className="pt-16 overflow-x-hidden text-foreground">
      {/* HERO SECTION */}
      <section
        data-aos="fade-up"
        className="min-h-screen flex items-center justify-center text-center px-6"
      >
        <div className="max-w-5xl mx-auto space-y-10">
          <Badge className="inline-flex items-center space-x-2 px-5 py-2 text-lg font-medium bg-cyan-200/20 border border-cyan-200/30 text-cyan-400">
            <Zap className="h-5 w-5" />
            <span>Powerful Features</span>
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            <span className="text-foreground">To Save Smart</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Explore intelligent tools that empower you to track, compare, and save
            across the world’s largest marketplaces. Built for shoppers who love data,
            and designed for effortless discovery.
          </p>
        </div>
      </section>

      {/* MAIN FEATURES SECTION */}
      <section className="min-h-screen flex items-center px-6 py-24" data-aos="fade-up">
        <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Feature List */}
          <div className="space-y-6">
            {mainFeatures.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                data-aos="fade-right"
                data-aos-delay={index * 150}
                className={`w-full text-left p-8 rounded-2xl transition-all duration-300 border backdrop-blur-xl ${
                  activeFeature === index
                    ? "border-cyan-400/60 scale-105 bg-cyan-200/10 shadow-[0_8px_32px_rgba(34,211,238,0.3)]"
                    : "border-cyan-400/10 hover:border-cyan-400/30 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                }`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                      activeFeature === index ? "scale-110 shadow-[0_0_20px_rgba(34,211,238,0.4)] bg-cyan-200/15" : "bg-cyan-200/15"
                    }`}
                  >
                    <feature.icon className="h-7 w-7 text-cyan-400" />
                  </div>
                  <h3
                    className={`text-2xl font-semibold ${
                      activeFeature === index ? "text-cyan-400" : "text-white"
                    }`}
                  >
                    {feature.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg">{feature.description}</p>
              </button>
            ))}
          </div>

          {/* Active Feature Details */}
          <div
            data-aos="fade-left"
            className="rounded-2xl overflow-hidden border backdrop-blur-2xl border-cyan-200/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-white/5"
          >
            <img
              src={mainFeatures[activeFeature].image}
              alt={mainFeatures[activeFeature].title}
              className="w-full h-[400px] object-cover"
            />
            <div className="p-10 space-y-5">
              <h3 className="text-3xl font-bold text-white">
                {mainFeatures[activeFeature].title}
              </h3>
              <div className="space-y-4">
                {mainFeatures[activeFeature].details.map((detail, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                    <p className="text-lg text-slate-300">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        className="min-h-screen flex items-center justify-center px-6 py-24"
        data-aos="zoom-in"
      >
        <div className="p-16 rounded-3xl text-center border backdrop-blur-2xl border-cyan-200/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] bg-white/5 max-w-3xl mx-auto space-y-10">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
            Start Saving Today
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Sign up now and track prices smarter — never miss a deal again. Take control
            of your shopping journey with intelligent price tracking.
          </p>
          <Button
            onClick={navigateToSearch}
            size="lg"
            className="px-12 py-5 text-lg font-medium transition-all duration-300 hover:scale-105 bg-gradient-to-br from-cyan-400 to-green-500 border-none shadow-lg shadow-cyan-300/40"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>
    </div>
  );
};
