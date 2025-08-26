import { useState } from "react";

const mockPriceData = [
  { date: '2024-01', amazon: 1299, ebay: 1249, aliexpress: 1199 },
  { date: '2024-02', amazon: 1279, ebay: 1229, aliexpress: 1189 },
  { date: '2024-03', amazon: 1259, ebay: 1209, aliexpress: 1179 },
  { date: '2024-04', amazon: 1239, ebay: 1189, aliexpress: 1159 },
  { date: '2024-05', amazon: 1219, ebay: 1169, aliexpress: 1139 },
  { date: '2024-06', amazon: 1199, ebay: 1149, aliexpress: 1089 },
];

export const PriceTrendChart = () => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);

  return (
    <section className="py-20 px-4" style={{ background: '#020617' }}>
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
            Live Price Trends
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Track price movements across marketplaces with interactive charts and real-time updates
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Price Visualization */}
          <div 
            className="rounded-xl p-6 border transition-all duration-300 hover:border-cyan-400/30"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-white">iPhone 15 Pro Max - Price History</h3>
              <p className="text-slate-400">6-month price tracking across platforms</p>
            </div>
            
            {/* Enhanced Chart Visualization */}
            <div 
              className="h-80 rounded-lg p-4 flex items-end space-x-3 relative overflow-hidden"
              style={{
                background: "rgba(2, 6, 23, 0.6)",
                border: "1px solid rgba(34, 211, 238, 0.1)"
              }}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-cyan-400/20"
                    style={{ top: `${20 + i * 15}%` }}
                  />
                ))}
              </div>

              {mockPriceData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2 relative">
                  <div className="flex flex-col space-y-1 w-full items-end">
                    {/* Amazon bar */}
                    <div 
                      className="bg-gradient-to-t from-orange-600 to-orange-400 rounded-sm w-full transition-all duration-500 hover:shadow-lg cursor-pointer relative group"
                      style={{ 
                        height: `${((data.amazon - 1000) / 300) * 200}px`,
                        boxShadow: selectedMarketplace === 'amazon' || hoveredBar === `${index}-amazon` ? '0 0 20px rgba(251, 146, 60, 0.5)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredBar(`${index}-amazon`)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={() => setSelectedMarketplace(selectedMarketplace === 'amazon' ? null : 'amazon')}
                    >
                      {hoveredBar === `${index}-amazon` && (
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10"
                          style={{
                            background: "rgba(0, 0, 0, 0.8)",
                            color: "#fb923c"
                          }}
                        >
                          Amazon: ${data.amazon}
                        </div>
                      )}
                    </div>
                    
                    {/* eBay bar */}
                    <div 
                      className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm w-full transition-all duration-500 hover:shadow-lg cursor-pointer relative group"
                      style={{ 
                        height: `${((data.ebay - 1000) / 300) * 200}px`,
                        boxShadow: selectedMarketplace === 'ebay' || hoveredBar === `${index}-ebay` ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredBar(`${index}-ebay`)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={() => setSelectedMarketplace(selectedMarketplace === 'ebay' ? null : 'ebay')}
                    >
                      {hoveredBar === `${index}-ebay` && (
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10"
                          style={{
                            background: "rgba(0, 0, 0, 0.8)",
                            color: "#3b82f6"
                          }}
                        >
                          eBay: ${data.ebay}
                        </div>
                      )}
                    </div>
                    
                    {/* AliExpress bar */}
                    <div 
                      className="bg-gradient-to-t from-green-600 to-green-400 rounded-sm w-full transition-all duration-500 hover:shadow-lg cursor-pointer relative group"
                      style={{ 
                        height: `${((data.aliexpress - 1000) / 300) * 200}px`,
                        color: "#22c55e",
                        boxShadow: selectedMarketplace === 'aliexpress' || hoveredBar === `${index}-aliexpress` ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredBar(`${index}-aliexpress`)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={() => setSelectedMarketplace(selectedMarketplace === 'aliexpress' ? null : 'aliexpress')}
                    >
                      {hoveredBar === `${index}-aliexpress` && (
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10"
                          style={{
                            background: "rgba(0, 0, 0, 0.8)",
                            color: "#22c55e"
                          }}
                        >
                          AliExpress: ${data.aliexpress}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 rotate-45 whitespace-nowrap mt-2">
                    {data.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Enhanced Legend */}
            <div className="flex justify-center space-x-6 mt-6">
              {[
                { name: 'Amazon', color: 'bg-orange-500', key: 'amazon' },
                { name: 'eBay', color: 'bg-blue-500', key: 'ebay' },
                { name: 'AliExpress', color: 'bg-green-500', key: 'aliexpress' }
              ].map((item) => (
                <button
                  key={item.key}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    selectedMarketplace === item.key ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedMarketplace(selectedMarketplace === item.key ? null : item.key)}
                >
                  <div className={`w-3 h-3 rounded-full ${item.color} ${
                    selectedMarketplace === item.key ? 'shadow-lg' : ''
                  }`} />
                  <span className={`text-sm ${
                    selectedMarketplace === item.key ? 'text-white font-medium' : 'text-slate-400'
                  }`}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Savings Overview */}
          <div className="space-y-6">
            {/* Savings Stats */}
            <div 
              className="rounded-xl p-6 border"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(34, 211, 238, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
              }}
            >
              <h3 className="text-xl font-semibold mb-6 text-white">Your Savings This Month</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
                  <span className="text-slate-300">Total Saved</span>
                  <span className="text-2xl font-bold text-green-400">$2,847</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: "rgba(34, 211, 238, 0.1)" }}>
                  <span className="text-slate-300">Products Tracked</span>
                  <span className="text-lg font-semibold text-cyan-400">23</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                  <span className="text-slate-300">Price Alerts</span>
                  <span className="text-lg font-semibold text-purple-400">47</span>
                </div>
              </div>
            </div>

            {/* Top Deals */}
            <div 
              className="rounded-xl p-6 border"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(34, 211, 238, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
              }}
            >
              <h3 className="text-xl font-semibold mb-4 text-white">Top Price Drops Today</h3>
              <div className="space-y-3">
                {[
                  { name: "Gaming Laptop RTX 4070", discount: 23, price: 1299 },
                  { name: "Wireless Earbuds Pro", discount: 18, price: 199 },
                  { name: "Smart Watch Series 9", discount: 15, price: 329 }
                ].map((deal, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(34, 211, 238, 0.1)"
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {deal.name}
                      </p>
                      <p className="text-xs text-slate-400">${deal.price}</p>
                    </div>
                    <div className="text-right">
                      <div 
                        className="font-bold px-3 py-1 rounded-full text-sm"
                        style={{
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          color: "white",
                          boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)"
                        }}
                      >
                        {deal.discount}% OFF
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};