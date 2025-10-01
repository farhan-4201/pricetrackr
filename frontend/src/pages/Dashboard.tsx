import { motion } from "framer-motion";
import { SearchDashboard } from "../components/SearchDashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ background: '#020617' }}>
      {/* Header */}
      <motion.div
        className="text-center mb-8 md:mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 leading-tight">
          Welcome to Your Dashboard
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Discover the best deals across marketplaces and track price changes with intelligent monitoring
        </p>
      </motion.div>

      {/* Search Dashboard Component */}
      <div className="max-w-7xl mx-auto mb-12">
        <SearchDashboard />
      </div>
    </div>
  );
}
