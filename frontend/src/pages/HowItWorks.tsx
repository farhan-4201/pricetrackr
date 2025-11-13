import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Zap,
  Bell,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  Database,
  TrendingDown,
  Shield,
  Globe
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const HowItWorks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: "ease-in-out",
    });
  }, []);

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  const steps = [
    {
      step: 1,
      icon: Search,
      title: "Search Products",
      description: "Enter any product you're interested in buying",
      details: [
        "Search across multiple Pakistani marketplaces simultaneously",
        "Get instant results from Daraz, PriceOye, and Telemart.pk",
        "Advanced filtering and sorting options"
      ],
      color: "cyan"
    },
    {
      step: 2,
      icon: Database,
      title: "Real-time Scraping",
      description: "Our intelligent scrapers fetch live pricing data",
      details: [
        "Automated API-based scraping technology",
        "Handles rate limiting and anti-bot measures",
        "Updates product information in real-time"
      ],
      color: "green"
    },
    {
      step: 3,
      icon: BarChart3,
      title: "Price Comparison",
      description: "Compare prices across all marketplaces instantly",
      details: [
        "Side-by-side price comparison with visual charts",
        "Historical price tracking and trend analysis",
        "Find the best deals at a glance"
      ],
      color: "purple"
    },
    {
      step: 4,
      icon: Bell,
      title: "Set Price Alerts",
      description: "Never miss a price drop again",
      details: [
        "Create custom price alerts for any product",
        "Get notified via email when prices drop",
        "Track unlimited items in your watchlist"
      ],
      color: "orange"
    },
    {
      step: 5,
      icon: TrendingDown,
      title: "Automated Monitoring",
      description: "Continuous price monitoring runs 24/7",
      details: [
        "Background cron jobs check prices regularly",
        "Intelligent algorithms detect significant changes",
        "Real-time notifications via WebSocket"
      ],
      color: "blue"
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description: "Our servers continuously monitor prices around the clock, ensuring you never miss a deal."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your search history and personal data are encrypted and never shared with third parties."
    },
    {
      icon: Globe,
      title: "Multi-Marketplace",
      description: "Search across Pakistan's largest online marketplaces from a single, unified interface."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized scraping technology and caching system."
    }
  ];

  return (
    <div className="w-full min-h-screen scroll-smooth text-gray-900 dark:text-white">
      {/* HERO SECTION */}
      <section
        data-aos="fade-up"
        className="min-h-screen flex items-center justify-center text-center px-6"
      >
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
          <Badge
            className="inline-flex items-center space-x-2 px-5 py-2 text-lg font-medium"
            style={{
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              color: "#22d3ee",
            }}
          >
            <Zap className="h-5 w-5" />
            <span>How It Works</span>
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Smart Price Tracking
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">Made Simple</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Discover how PriceTracker revolutionizes your shopping experience with intelligent automation, real-time monitoring, and seamless price comparison across Pakistan's top online marketplaces.
          </p>
        </div>
      </section>

      {/* STEPS SECTION */}
      <section className="min-h-screen flex flex-col px-6 py-24" data-aos="fade-up">
        <div className="container mx-auto max-w-7xl space-y-12">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                The Process
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-slate-300 max-w-2xl mx-auto">
              From search to savings — here's how PriceTracker works behind the scenes
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 150}
                className={`flex flex-col lg:flex-row items-center gap-12 p-8 rounded-2xl border ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              >
                {/* Step Number & Icon */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"
                    style={{
                      background: `linear-gradient(135deg, ${
                        step.color === "cyan"
                          ? "#22d3ee"
                          : step.color === "green"
                          ? "#22c55e"
                          : step.color === "purple"
                          ? "#a855f7"
                          : step.color === "orange"
                          ? "#f97316"
                          : "#3b82f6"
                      }, rgba(34,211,238,0.3))`,
                      boxShadow: `0 0 30px rgba(${
                        step.color === "cyan"
                          ? "34,211,238"
                          : step.color === "green"
                          ? "34,197,94"
                          : step.color === "purple"
                          ? "168,85,247"
                          : step.color === "orange"
                          ? "249,115,22"
                          : "59,130,246"
                      },0.4)`,
                    }}
                  >
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-5xl md:text-6xl font-bold text-slate-600">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                    {step.title}
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 dark:text-slate-300 mb-4 md:mb-6">
                    {step.description}
                  </p>
                  <div className="space-y-2 md:space-y-3">
                    {step.details.map((detail, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center lg:justify-start space-x-2 md:space-x-3"
                      >
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm md:text-lg text-gray-700 dark:text-slate-300">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="min-h-screen flex items-center px-6 py-24" data-aos="fade-up">
        <div className="container mx-auto max-w-7xl space-y-12">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Why Choose PriceTracker?
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-slate-300 max-w-2xl mx-auto">
              Built with cutting-edge technology for the modern shopper
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
                className="p-6 md:p-8 rounded-2xl border"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 15px 45px rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(34,211,238,0.15)",
                      boxShadow: "0 0 20px rgba(34,211,238,0.3)",
                    }}
                  >
                    <feature.icon className="h-5 md:h-7 w-5 md:w-7 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-lg text-gray-700 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="min-h-screen flex items-center justify-center px-6 py-24" data-aos="zoom-in">
        <div
          className="p-12 md:p-16 rounded-3xl text-center border max-w-4xl mx-auto space-y-8 md:space-y-10"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(34,211,238,0.2)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
            Ready to Start Saving?
          </h2>
          <p className="text-base md:text-xl text-gray-900 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of smart shoppers who are already saving money with PriceTracker's intelligent price monitoring system. Start tracking prices today and never overpay again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Button
              onClick={navigateToDashboard}
              size="lg"
              className="px-8 md:px-12 py-4 md:py-5 text-lg font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)",
              }}
            >
              Start Tracking Now
              <ArrowRight className="ml-2 h-5 md:h-6 w-5 md:w-6" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="px-8 md:px-12 py-4 md:py-5 text-lg font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(34,211,238,0.4)",
                color: "#22d3ee",
              }}
            >
              Learn More
            </Button>
          </div>

          <div className="flex flex-col space-y-2 md:space-y-4 text-sm md:text-lg text-gray-900 dark:text-slate-400">
            {["Free to start", "No credit card required", "Cancel anytime"].map(
              (text, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center space-x-2 md:space-x-3"
                >
                  <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-green-400 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
