import { motion } from "framer-motion";
import { SearchDashboard } from "../components/SearchDashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      {/* Header */}
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Dashboard
      </motion.h1>

      {/* Search Dashboard Component */}
      <div className="max-w-4xl mx-auto">
        <SearchDashboard />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {["Users", "Sales", "Performance"].map((title, index) => (
          <motion.div
            key={title}
            className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-cyan-400/30 transition-shadow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
          >
            <h2 className="text-xl font-semibold mb-2 text-cyan-300">{title}</h2>
            <p className="text-gray-300 text-sm">Some futuristic stats and metrics go here.</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
