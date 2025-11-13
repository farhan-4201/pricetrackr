import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import AOS from "aos";
import "aos/dist/aos.css";
import FeatureSlider from "@/components/FeatureSlider";

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

  const navigateToHowItWorks = () => {
    navigate("/how-it-works");
  };

  return (
    <div
      className="w-full text-foreground"
      style={{
        scrollBehavior: "smooth",
      }}
    >
      {/* HERO SECTION - Never Overpay Again */}
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

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Half - Content */}
          <div className="space-y-8 text-left">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
              data-aos="fade-down"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Never Overpay
              </span>
              <br />
              <span className="text-foreground">Again</span>
            </h1>

            <div
              className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-5"
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
                Get instant price alerts when your favorite products drop in price,
                view detailed price history with beautiful charts and graphs, and
                make smarter buying decisions — all from one comprehensive dashboard.
                Our advanced algorithms monitor thousands of products across multiple
                marketplaces to ensure you never miss a deal.
              </p>
              <p>
                Join thousands of smart shoppers who save money every day with
                PriceTracker. Whether you're looking for electronics, fashion,
                home goods, or any other product, our platform helps you find the
                best deals instantly and track price changes over time.
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row gap-6"
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
                onClick={navigateToHowItWorks}
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
                How It Works?
              </Button>
            </div>
          </div>

          {/* Right Half - Animation */}
          <div className="flex justify-center items-center" data-aos="fade-left">
            <DotLottieReact
              src="/Online Shopping.json"
              loop
              autoplay
              className="w-full h-auto max-w-none scale-125"
            />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - Centered Slider */}
      <section 
        className="min-h-screen flex items-center justify-center px-6"
        data-aos="fade-up"
      >
        <div className="w-full max-w-7xl mx-auto">
          <FeatureSlider />
        </div>
      </section>

      {/* CTA SECTION - Ready to Start Saving */}
      <section
        className="min-h-screen flex items-center justify-center px-6"
        data-aos="fade-up"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Side - CTA Content */}
          <div className="space-y-8" data-aos="fade-right">
            <div className="p-12 rounded-3xl border relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/30 shadow-2xl">
              <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-cyan-400/15 via-green-400/15 to-purple-400/15" />

              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Start Saving?
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Sign up today and let PriceTracker do the hard work — discover real deals and shop smarter.
                </p>

                <Button
                  onClick={navigateToDashboard}
                  size="lg"
                  className="px-12 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 8px 30px rgba(34,211,238,0.5)",
                  }}
                >
                  Get Started Free
                </Button>

                <div className="flex flex-col space-y-4 text-lg text-muted-foreground">
                  {["Free to start", "No credit card", "Cancel anytime"].map(
                    (text, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3"
                      >
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Animation */}
          <div className="flex justify-center items-center" data-aos="fade-left">
            <DotLottieReact
              src="/Online Investment.json"
              loop
              autoplay
              className="w-full h-auto max-w-2xl scale-125"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
