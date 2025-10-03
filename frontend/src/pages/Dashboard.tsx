import { motion } from "framer-motion";
import { SearchDashboard } from "../components/SearchDashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 lg:p-8">
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 leading-tight">
            Welcome to Your Dashboard
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Discover the best deals across marketplaces and track price changes with intelligent monitoring.
          </p>
        </motion.div>

        {/* Search Dashboard Component */}
        <div className="max-w-7xl mx-auto mb-12">
          <SearchDashboard />
        </div>
      </div>
    </div>
  );
}
