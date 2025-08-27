import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BarChart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, signout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
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
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 rounded-lg transition-all duration-300 group ${
                location.pathname === link.to
                  ? "text-cyan-400"
                  : "text-slate-300 hover:text-cyan-400"
              }`}
            >
              {link.label}
              <div
                className={`absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-300 ${
                  location.pathname === link.to
                    ? "w-3/4 -translate-x-1/2"
                    : "w-0 -translate-x-1/2 group-hover:w-3/4"
                }`}
              />
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-cyan-400/30"
                />
              )}
              <span className="text-slate-300">{user.name}</span>
              <button
                onClick={signout}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/signin"
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer
      className="py-16 px-4 border-t"
      style={{
        background: "rgba(2, 6, 23, 0.9)",
        borderTop: "1px solid rgba(34, 211, 238, 0.1)",
      }}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart className="h-6 w-6 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                PriceTracker
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Track prices across multiple marketplaces and never overpay again.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Quick Links</h4>
            <div className="space-y-2">
              {["/features", "/pricing", "/about", "/contact"].map((to) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-slate-400 hover:text-cyan-400 transition-colors text-sm"
                >
                  {to.replace("/", "").charAt(0).toUpperCase() +
                    to.slice(2)}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Support</h4>
            <div className="space-y-2">
              {["Help Center", "Documentation", "API", "Status"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-slate-400 hover:text-cyan-400 transition-colors text-sm"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <div className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-slate-400 hover:text-cyan-400 transition-colors text-sm"
                  >
                    {link}
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-400/10 mt-12 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} PriceTracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020617" }}>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
};
