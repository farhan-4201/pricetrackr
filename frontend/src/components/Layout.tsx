import { BarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "./Navbar";

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
              {["/features", "/pricing", "/about"].map((to) => (
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
