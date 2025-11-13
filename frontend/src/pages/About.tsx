import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Target,
  Users,
  Shield,
  Zap,
  Heart,
  TrendingUp,
  Globe,
  ChevronDown,
  ChevronUp,
  Headphones,
  Search,
  DollarSign,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

export const About = () => {
  const navigate = useNavigate();
  const [showStory, setShowStory] = useState(false);

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

  const toggleStory = () => {
    setShowStory(!showStory);
  };

  const stats = [
    { value: "500K+", label: "Happy Users", icon: Users, color: "#22d3ee" },
    { value: "$50M+", label: "Money Saved", icon: TrendingUp, color: "#22c55e" },
    { value: "50+", label: "Marketplaces", icon: Globe, color: "#a855f7" },
    { value: "99.9%", label: "Uptime", icon: Shield, color: "#22d3ee" },
  ];

  const values = [
    {
      icon: Target,
      title: "Customer First",
      description:
        "Every decision we make is focused on delivering maximum value to our users.",
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description:
        "We believe in honest pricing, clear policies, and protecting user privacy.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description:
        "Continuously pushing boundaries with cutting-edge AI and technology.",
    },
    {
      icon: Heart,
      title: "Impact",
      description:
        "Making smart shopping accessible to everyone, regardless of technical expertise.",
    },
  ];

  return (
    <div
      className="w-full min-h-screen text-white"
      style={{
        scrollBehavior: "smooth",
      }}
    >
      {/* HERO SECTION */}
      <section
        data-aos="fade-up"
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto z-10 space-y-12">
          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Empowering Smart
            </span>
            <br />
            <span className="text-white">Shopping Decisions</span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            PriceTracker is a final-year project designed to simplify price
            tracking and empower smarter buying decisions for every shopper and
            business vendor.
          </p>

          <Button
            onClick={toggleStory}
            size="lg"
            className="px-10 py-5 text-xl font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #22d3ee, #22c55e)",
              border: "none",
              boxShadow: "0 8px 30px rgba(34,211,238,0.5)",
            }}
          >
            {showStory ? "Hide Our Story" : "Discover Our Story"}
            {showStory ? (
              <ChevronUp className="ml-3 h-6 w-6" />
            ) : (
              <ChevronDown className="ml-3 h-6 w-6" />
            )}
          </Button>
        </div>
      </section>

      {/* STORY SECTION */}
      {showStory && (
        <section
          data-aos="fade-up"
          className="min-h-screen flex flex-col justify-center px-8 relative"
        >
          <div className="max-w-6xl mx-auto text-center space-y-12">
            <div
              className="p-12 rounded-3xl border relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(34,211,238,0.15)",
                boxShadow: "0 15px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    "linear-gradient(45deg, transparent, rgba(34,211,238,0.1), transparent, rgba(34,197,94,0.1), transparent)",
                }}
              />
              <div className="relative z-10 space-y-12">
                <div
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full"
                  style={{
                    background: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.3)",
                    color: "#22d3ee",
                  }}
                >
                  <Headphones className="h-6 w-6" />
                  <span className="font-medium text-lg">
                    The Journey That Started It All
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                  {[
                    {
                      icon: Search,
                      title: "The Search",
                      color: "cyan",
                      text: "It all began with a quest for the perfect earbuds.",
                    },
                    {
                      icon: DollarSign,
                      title: "The Mistake",
                      color: "green",
                      text: "Bought them at a great price... or so I thought.",
                    },
                    {
                      icon: Lightbulb,
                      title: "The Solution",
                      color: "purple",
                      text: "There had to be a smarter way to track prices.",
                    },
                  ].map(({ icon: Icon, title, color, text }, i) => (
                    <div
                      key={i}
                      data-aos="zoom-in-up"
                      data-aos-delay={i * 200}
                      className="space-y-4"
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                        style={{
                          background: `rgba(var(--${color}-rgb,34,211,238),0.1)`,
                        }}
                      >
                        <Icon className={`h-10 w-10 text-${color}-400`} />
                      </div>
                      <h3 className="text-2xl font-semibold text-white">
                        {title}
                      </h3>
                      <p className="text-lg text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed">
                  That frustrating experience sparked something bigger. What if
                  we could automate price tracking, compare marketplaces in real
                  time, and ensure no shopper ever overpays again?
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VALUES SECTION */}
      <section
        data-aos="fade-up"
        className="min-h-screen flex flex-col justify-center px-8"
      >
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
            Our Core Values
          </h2>
          <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
            These principles guide how we build, innovate, and serve our
            community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
          {values.map((value, index) => (
            <div
              key={index}
              data-aos="zoom-in-up"
              data-aos-delay={index * 150}
              className="p-10 rounded-2xl border transition-all duration-500 hover:scale-105 hover:border-cyan-400/30"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(34,211,238,0.1)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center mb-6"
                style={{
                  background: "rgba(34,211,238,0.15)",
                  boxShadow: "0 0 25px rgba(34,211,238,0.25)",
                }}
              >
                <value.icon className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">
                {value.title}
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        data-aos="zoom-in"
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div
          className="max-w-5xl mx-auto p-16 rounded-3xl border relative overflow-hidden text-center"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(34,211,238,0.25)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
          }}
        >
          <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-cyan-400/15 via-green-400/15 to-purple-400/15" />

          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Join Our Mission
            </h2>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Ready to take control of your shopping and start saving money? Join
              hundreds of thousands of smart shoppers today.
            </p>

            <Button
              onClick={navigateToSearch}
              size="lg"
              className="px-16 py-6 text-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 8px 30px rgba(34,211,238,0.5)",
              }}
            >
              Get Started for Free
            </Button>

            <div className="flex justify-center items-center space-x-8 text-lg text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
