import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import AOS from "aos";
import "aos/dist/aos.css";
import FeatureSlider from "@/components/FeatureSlider";

export const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1200, // smoother, slightly longer animations
      easing: "ease-in-out-sine", // soft easing
      once: true, // animate once
      mirror: false,
    });
  }, []);

  const navigateToDashboard = () => navigate("/dashboard");
  const navigateToHowItWorks = () => navigate("/how-it-works");

  return (
    <div className="w-full min-h-screen scroll-smooth text-gray-900 dark:text-slate-100 bg-white/10 dark:bg-gray-900/20 backdrop-blur-xl transition-colors duration-300">
      {/* HERO SECTION */}
      <section
        className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden will-change-transform will-change-opacity"
        data-aos="fade-up"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl bg-hero-cyan" />
          <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl bg-hero-green" />
        </div>

        {/* HERO CONTENT */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-left">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
              data-aos="fade-down"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Never Overpay
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">Again</span>
            </h1>

            <div
              className="text-lg md:text-xl leading-relaxed space-y-5 text-gray-800 dark:text-slate-200"
              data-aos="fade-up"
            >
              <p>
                Stop manually checking prices every day.{" "}
                <span className="text-cyan-500 dark:text-cyan-400 font-semibold">
                  PriceTracker
                </span>{" "}
                automatically tracks and compares prices across{" "}
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  Daraz
                </span>
                ,{" "}
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  PriceOye
                </span>
                , and{" "}
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  Telemart.pk
                </span>
                .
              </p>
              <p>
                Get instant price alerts when your favorite products drop in price,
                view detailed price history with beautiful charts and graphs, and
                make smarter buying decisions — all from one comprehensive dashboard.
              </p>
              <p>
                Join thousands of smart shoppers who save money every day with
                PriceTracker. Whether you're looking for electronics, fashion,
                home goods, or any other product, our platform helps you find the
                best deals instantly and track price changes over time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6" data-aos="zoom-in">
              <Button
                onClick={navigateToDashboard}
                size="lg"
                className="px-10 py-5 text-xl font-semibold transition-transform duration-500 ease-in-out hover:scale-105 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 shadow-btn-glow text-white"
              >
                Start Saving Today
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>

              <Button
                onClick={navigateToHowItWorks}
                variant="outline"
                size="lg"
                className="px-10 py-5 text-xl font-semibold transition-transform duration-500 ease-in-out hover:scale-105 border border-cyan-400 text-cyan-500 dark:text-cyan-400 bg-white/20 dark:bg-white/5 backdrop-blur-xs"
              >
                How It Works?
              </Button>
            </div>
          </div>

          {/* Right Animation */}
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

      {/* FEATURES SECTION */}
      <section
        className="min-h-screen flex items-center justify-center px-6 transition-colors duration-300 will-change-transform will-change-opacity"
        data-aos="fade-up"
      >
        <div className="w-full max-w-7xl mx-auto">
          <FeatureSlider />
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        className="min-h-screen flex items-center justify-center px-6 transition-colors duration-300 will-change-transform will-change-opacity"
        data-aos="fade-up"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* CTA CONTENT */}
          <div className="space-y-8" data-aos="fade-right">
            <div className="p-12 rounded-3xl border relative overflow-hidden bg-white/70 dark:bg-card/70 backdrop-blur-xl border-border shadow-2xl">
              <div className="absolute inset-0 opacity-25 bg-cta-gradient" />

              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Start Saving?
                </h2>
                <p className="text-xl text-gray-900 dark:text-slate-200 leading-relaxed">
                  Sign up today and let PriceTracker do the hard work — discover real
                  deals and shop smarter.
                </p>

                <Button
                  onClick={navigateToDashboard}
                  size="lg"
                  className="px-12 py-4 text-lg font-semibold transition-transform duration-500 ease-in-out hover:scale-105 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 shadow-btn-glow text-white"
                >
                  Get Started Free
                </Button>

                <div className="flex flex-col space-y-4 text-lg text-gray-900 dark:text-slate-200">
                  {["Free to start", "No credit card", "Cancel anytime"].map(
                    (text, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Animation */}
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
