import { Button } from "@/components/ui/button";
import { BarChart, Menu, Bell, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Glassmorphic Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 md:py-4"
        style={{
          background: "rgba(2, 6, 23, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(34, 211, 238, 0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group cursor-pointer">
            <div
              className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
              style={{
                background: "rgba(34, 211, 238, 0.1)",
                boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)",
              }}
            >
              <BarChart
                className="h-6 w-6 transition-colors duration-300"
                style={{ color: "#22d3ee" }}
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              PriceTracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-lg transition-all duration-300 group ${
                    isActive
                      ? "text-cyan-400 bg-[rgba(34,211,238,0.1)]"
                      : "text-slate-300 hover:text-cyan-400"
                  }`
                }
              >
                {link.label}
                <div
                  className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-300 w-0 -translate-x-1/2 group-hover:w-3/4"
                />
              </NavLink>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 transition-all duration-300 hover:scale-110"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              className="p-2 rounded-lg text-slate-300 hover:text-green-400 transition-all duration-300 hover:scale-110"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              <User className="h-5 w-5" />
            </button>
            <Link to="/signin">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-cyan-400 hover:bg-transparent transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                className="relative overflow-hidden font-medium transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <span className="relative z-10">Get Started</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-400 transition-all duration-300"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-[rgba(2,6,23,0.95)] backdrop-blur-xl"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="pt-20 px-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-6 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-cyan-400 bg-[rgba(34,211,238,0.1)]"
                      : "text-slate-300 bg-[rgba(255,255,255,0.05)]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <Link to="/signin" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="ghost"
                className="w-full text-slate-300 hover:text-cyan-400 py-3 text-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                }}
              >
                Sign In
              </Button>
            </Link>

            <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
              <Button
                className="w-full py-3 text-lg font-medium"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                  boxShadow: "0 4px 20px rgba(34, 211, 238, 0.4)",
                }}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
