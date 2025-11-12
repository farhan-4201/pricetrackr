import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Bell, BarChart3 } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FeatureSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: "ease-in-out",
    });
  }, []);

  const features: FeatureCard[] = [
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get instant alerts when your favorite products drop in price."
    },
    {
      icon: BarChart3,
      title: "Price History",
      description: "Visualize long-term price trends with beautiful charts."
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Find the best deals with our powerful search filters."
    },{
      icon: ChevronRight,
      title: "User-Friendly Interface",
      description: "Navigate and find deals easily with our intuitive design."
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div
      className="relative w-full py-16 px-4 overflow-hidden"
      style={{
        backgroundColor: '#020617',
        minHeight: '600px'
      }}
    >
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        data-aos="fade-right"
        data-aos-delay="600"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-8 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        data-aos="fade-left"
        data-aos-delay="600"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>

      {/* Slider Container */}
      <div className="max-w-6xl mx-auto relative" data-aos="fade-up" data-aos-delay="800">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 px-4"
              data-aos="zoom-in"
              data-aos-delay={900 + index * 200}
            >
              <div className="max-w-2xl mx-auto">
                <div
                  className="rounded-3xl p-16 text-center shadow-lg hover:scale-105 transition-all duration-500"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    boxShadow: "0 15px 50px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Icon */}
                  <div className="mb-10">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-md transition-all duration-500"
                      style={{
                        background: "rgba(34,211,238,0.2)",
                        boxShadow: "0 0 30px rgba(34,211,238,0.3)",
                      }}
                    >
                      <feature.icon className="w-12 h-12 text-cyan-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-4xl font-bold mb-8 text-white">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xl text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center space-x-3 mt-8" data-aos="fade-up" data-aos-delay="1400">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'border-2 border-white bg-transparent hover:bg-white hover:bg-opacity-50'
            }`}
            data-aos="zoom-in"
            data-aos-delay={1500 + index * 100}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureSlider;
