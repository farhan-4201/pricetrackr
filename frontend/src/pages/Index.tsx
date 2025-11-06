import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  Shield,
  BarChart,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

export const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  const features = [
    {
      icon: Search,
      title: "Product Search",
      description:
        "Quickly find and compare products across multiple marketplaces.",
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description:
        "Get instant alerts when your favorite products drop in price.",
    },
    {
      icon: BarChart,
      title: "Price History",
      description: "Visualize long-term price trends with beautiful charts.",
    },
    {
      icon: Shield,
      title: "Deal Verification",
      description: "Ensure every deal you see is genuine and verified.",
    },
  ];

  return (
    <div
      className="w-full text-white"
      style={{
        backgroundColor: "#020617",
        scrollBehavior: "smooth",
      }}
    >
      {/* HERO SECTION */}
      <section
        className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
        data-aos="fade-up"
      >
        {/* Background Effects */}
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

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-12">
          <h1
            className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight"
            data-aos="fade-down"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Never Overpay
            </span>
            <br />
            <span className="text-white">Again</span>
          </h1>

          <div
            className="text-lg md:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed space-y-5"
            data-aos="fade-up"
          >
            <p>
              Stop manually checking prices every day.{" "}
              <span className="text-cyan-400 font-semibold">PriceTracker</span>{" "}
              automatically tracks and compares prices across{" "}
              <span className="text-green-400 font-semibold">Daraz</span>,{" "}
              <span className="text-green-400 font-semibold">PriceOye</span>, and{" "}
              <span className="text-green-400 font-semibold">Telemart.pk</span>.
            </p>
            <p>
              Get alerts, view detailed history, and make smarter buying
              decisions — all from one dashboard.
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-6 justify-center"
            data-aos="zoom-in"
          >
            <Button
              onClick={navigateToDashboard}
              size="lg"
              className="px-10 py-5 text-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 8px 30px rgba(34,211,238,0.5)",
              }}
            >
              Start Saving Today
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="px-10 py-5 text-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(34,211,238,0.4)",
                color: "#22d3ee",
              }}
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        className="min-h-screen flex flex-col justify-center px-8"
        data-aos="fade-up"
      >
        <div className="text-center mb-20">
          <h2
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent"
            data-aos="zoom-in"
          >
            Powerful Features
          </h2>
          <p
            className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            data-aos="fade-up"
          >
            Everything you need to make smart purchasing decisions and save more.
          </p>
        </div>

        <div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-10 rounded-2xl border transition-all duration-500 hover:scale-105 hover:border-cyan-400/30"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(34,211,238,0.1)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              }}
              data-aos="zoom-in"
              data-aos-delay={index * 100}
            >
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center mb-6"
                style={{
                  background: "rgba(34,211,238,0.15)",
                  boxShadow: "0 0 25px rgba(34,211,238,0.25)",
                }}
              >
                <feature.icon className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        className="min-h-screen flex items-center justify-center px-6"
        data-aos="fade-up"
      >
        <div
          className="max-w-5xl mx-auto p-16 rounded-3xl border relative overflow-hidden text-center"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(34,211,238,0.25)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
          }}
          data-aos="zoom-in"
        >
          <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-cyan-400/15 via-green-400/15 to-purple-400/15" />

          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Ready to Start Saving?
            </h2>
            <p
              className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
            >
              Sign up today and let PriceTracker do the hard work — discover real
              deals and shop smarter.
            </p>

            <Button
              onClick={navigateToDashboard}
              size="lg"
              className="px-16 py-6 text-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                border: "none",
                boxShadow: "0 8px 30px rgba(34,211,238,0.5)",
              }}
              data-aos="zoom-in"
              data-aos-delay="200"
            >
              Get Started Free
            </Button>

            <div
              className="flex justify-center items-center space-x-8 text-lg text-slate-400"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              {["Free to start", "No credit card", "Cancel anytime"].map(
                (text, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>{text}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
