import { Button } from "@/components/ui/button";
import { BarChart, Menu, Bell, User, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("features");

  // Memoized navigation links for performance
  const navLinks = useMemo(() => [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ], []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const handleLinkClick = (href) => {
    setActiveSection(href.replace("#", ""));
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Glassmorphic Navbar */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 md:py-4"
        style={{
          background: "rgba(2, 6, 23, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(34, 211, 238, 0.1)"
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo with Glow Effect */}
          <div className="flex items-center space-x-2 group cursor-pointer">
            <div 
              className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
              style={{
                background: "rgba(34, 211, 238, 0.1)",
                boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)"
              }}
            >
              <BarChart 
                className="h-6 w-6 transition-colors duration-300" 
                style={{ color: "#22d3ee" }}
              />
            </div>
            <span 
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent"
            >
              PriceTracker
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`relative px-4 py-2 rounded-lg transition-all duration-300 group ${
                  activeSection === link.href.replace("#", "")
                    ? "text-cyan-400"
                    : "text-slate-300 hover:text-cyan-400"
                }`}
                style={{
                  background: activeSection === link.href.replace("#", "") 
                    ? "rgba(34, 211, 238, 0.1)" 
                    : "transparent"
                }}
              >
                {link.label}
                
                {/* Animated underline */}
                <div 
                  className={`absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-300 ${
                    activeSection === link.href.replace("#", "") 
                      ? "w-3/4 -translate-x-1/2" 
                      : "w-0 -translate-x-1/2 group-hover:w-3/4"
                  }`}
                  style={{
                    boxShadow: "0 0 10px rgba(34, 211, 238, 0.5)"
                  }}
                />
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Bell */}
            <button 
              className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 transition-all duration-300 hover:scale-110"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
              }}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Profile Button */}
            <button 
              className="p-2 rounded-lg text-slate-300 hover:text-green-400 transition-all duration-300 hover:scale-110"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
              }}
              aria-label="User profile"
            >
              <User className="h-5 w-5" />
            </button>

            {/* Sign In Button */}
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-cyan-400 hover:bg-transparent transition-all duration-300"
            >
              Sign In
            </Button>

            {/* Get Started Button with Glow */}
            <Button 
              className="relative overflow-hidden font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)"
              }}
            >
              <span className="relative z-10">Get Started</span>
              <div 
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #a855f7)"
                }}
              />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-400 transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{
          background: "rgba(2, 6, 23, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        onClick={() => setIsMenuOpen(false)}
        id="mobile-navigation"
      >
        <div 
          className={`pt-20 px-6 transition-all duration-500 ease-out ${
            isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Navigation Links */}
          <div className="space-y-2 mb-8">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`block px-6 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                  activeSection === link.href.replace("#", "")
                    ? "text-cyan-400"
                    : "text-slate-300"
                }`}
                style={{
                  background: activeSection === link.href.replace("#", "") 
                    ? "rgba(34, 211, 238, 0.1)" 
                    : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: "both",
                  animation: isMenuOpen ? "slideInUp 0.6s ease-out" : "none"
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Action Buttons */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full text-slate-300 hover:text-cyan-400 py-3 text-lg"
              onClick={() => setIsMenuOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(34, 211, 238, 0.2)"
              }}
            >
              Sign In
            </Button>
            
            <Button 
              className="w-full py-3 text-lg font-medium relative overflow-hidden"
              onClick={() => setIsMenuOpen(false)}
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                boxShadow: "0 4px 20px rgba(34, 211, 238, 0.4)"
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Glow effects */
        .group:hover [data-glow] {
          filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5));
        }
      `}</style>
    </>
  );
};