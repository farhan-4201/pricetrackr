import { useState } from "react";

interface PriceData {
  date: string;
  price: number;
}

interface PriceTrendChartProps {
  historicalData: PriceData[];
  productName: string;
  className?: string;
}

export const PriceTrendChart = ({ historicalData, productName, className }: PriceTrendChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Calculate price range for scaling
  const prices = historicalData.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  if (historicalData.length === 0) {
    return (
      <div className={`bg-slate-900/50 rounded-lg p-6 border border-slate-700 ${className}`}>
        <p className="text-slate-400 text-center">No price history available</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg p-6 border border-slate-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{productName} Price Trend</h3>

      {/* Price Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-slate-400">Current Price</p>
          <p className="text-lg font-bold text-cyan-400">
            ${historicalData[historicalData.length - 1]?.price.toFixed(2) || 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-400">Lowest Price</p>
          <p className="text-lg font-bold text-green-400">${minPrice.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-400">Highest Price</p>
          <p className="text-lg font-bold text-red-400">${maxPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Simple ASCII/SVG Chart */}
      <div className="relative h-48 w-full bg-slate-800/30 rounded-lg overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${historicalData.length} 100`}
          preserveAspectRatio="none"
        >
          {/* Price line */}
          <polyline
            points={historicalData.map((item, index) => {
              const normalizedPrice = priceRange === 0 ? 50 : 20 + (80 * (1 - (item.price - minPrice) / priceRange));
              return `${index} ${normalizedPrice}`;
            }).join(' ')}
            stroke="#22d3ee"
            strokeWidth="2"
            fill="none"
          />

          {/* Data points */}
          {historicalData.map((item, index) => {
            const normalizedPrice = priceRange === 0 ? 50 : 20 + (80 * (1 - (item.price - minPrice) / priceRange));
            return (
              <circle
                key={index}
                cx={index}
                cy={normalizedPrice}
                r="3"
                fill="#22d3ee"
                stroke="#ffffff"
                strokeWidth="1"
                className="cursor-pointer hover:r-4 transition-all"
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseLeave={() => setSelectedIndex(null)}
              />
            );
          })}

          {/* Background fill */}
          <polygon
            points={`0 100 ${historicalData.map((item, index) => {
              const normalizedPrice = priceRange === 0 ? 50 : 20 + (80 * (1 - (item.price - minPrice) / priceRange));
              return `${index} ${normalizedPrice}`;
            }).join(' ')} ${historicalData.length - 1} 100`}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Tooltip */}
        {selectedIndex !== null && (
          <div
            className="absolute bg-black/90 border border-cyan-400 rounded-lg p-2 text-white text-sm pointer-events-none"
            style={{
              left: `${(selectedIndex / historicalData.length) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-semibold">{new Date(historicalData[selectedIndex].date).toLocaleDateString()}</div>
            <div className="text-cyan-400">${historicalData[selectedIndex].price.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Data grid */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {historicalData.slice(-4).map((item, index) => (
          <div key={index} className="bg-slate-800/50 px-3 py-2 rounded">
            <div className="text-slate-400">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div className="text-white font-medium">${item.price.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
