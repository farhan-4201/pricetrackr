import { motion } from "framer-motion";
import { SearchDashboard } from "../components/SearchDashboard";
import { TrendingUp, Zap, Shield } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen text-white p-4 md:p-6 lg:p-8" style={{
      background: "rgba(15, 23, 42, 0.5)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="container mx-auto px-4" style={{
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        {/* Header */}
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 leading-tight">
            Product Search
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Compare prices across multiple marketplaces instantly
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>Real-time Search</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Best Prices</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>Trusted Sources</span>
          </div>
        </motion.div>

        {/* Search Dashboard Component */}
        <div className="max-w-7xl mx-auto mb-12">
          <SearchDashboard />
        </div>
      </div>
    </div>
  );
}
