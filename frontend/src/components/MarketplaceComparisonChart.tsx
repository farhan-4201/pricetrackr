import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ScrapedProduct } from '@/lib/api';
import { ChartSkeleton } from './ui/skeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MarketplaceComparisonChartProps {
  products: ScrapedProduct[];
  className?: string;
}

export const MarketplaceComparisonChart: React.FC<MarketplaceComparisonChartProps> = ({
  products,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay for chart rendering
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [products]);

  // Show skeleton while loading
  if (isLoading || products.length === 0) {
    return <ChartSkeleton className={className} />;
  }
  // Group products by marketplace and calculate average prices
  const marketplaceData = products.reduce((acc, product) => {
    const marketplace = product.marketplace;
    if (!acc[marketplace]) {
      acc[marketplace] = {
        products: [],
        prices: []
      };
    }
    acc[marketplace].products.push(product);
    if (product.price && product.price > 0) {
      acc[marketplace].prices.push(product.price);
    }
    return acc;
  }, {} as Record<string, { products: ScrapedProduct[]; prices: number[] }>);

  // Calculate statistics for each marketplace
  const marketplaceStats = Object.entries(marketplaceData).map(([marketplace, data]) => {
    const { prices } = data;
    const validPrices = prices.filter(price => price > 0);

    return {
      marketplace,
      minPrice: validPrices.length > 0 ? Math.min(...validPrices) : 0,
      maxPrice: validPrices.length > 0 ? Math.max(...validPrices) : 0,
      avgPrice: validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0,
      productCount: prices.length
    };
  }).filter(stat => stat.productCount > 0);

  // Sort by average price for better visualization
  marketplaceStats.sort((a, b) => a.avgPrice - b.avgPrice);

  const marketplaceColors: Record<string, string> = {
    daraz: '#22d3ee',
    priceoye: '#ff4081',
    telemart: '#10b981',
    alibaba: '#ff4081',
    amazon: '#ff9900',
    ebay: '#26a69a'
  };

  const data = {
    labels: marketplaceStats.map(stat => stat.marketplace),
    datasets: [
      {
        label: 'Average Price (Rs.)',
        data: marketplaceStats.map(stat => Math.round(stat.avgPrice)),
        backgroundColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
        ),
        borderColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
        ),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
        },
      },
      title: {
        display: true,
        text: 'Marketplace Price Comparison',
        color: '#e2e8f0',
      },
    },
  };

  if (marketplaceStats.length === 0) {
    return (
      <div className={`bg-slate-900/50 rounded-lg p-6 border border-slate-700 ${className}`}>
        <p className="text-slate-400 text-center">No price data available for comparison</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg p-6 border border-slate-700 ${className}`}>
      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">Best Deal</p>
          <p className="text-lg font-bold text-green-400">
            {marketplaceStats[0].marketplace}
          </p>
          <p className="text-xs text-slate-500">
            Avg: Rs. {marketplaceStats[0].avgPrice.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">Price Difference</p>
          <p className="text-lg font-bold text-cyan-400">
            Rs. {(marketplaceStats[marketplaceStats.length - 1].avgPrice - marketplaceStats[0].avgPrice).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            Max vs Min Average
          </p>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">Savings Opportunity</p>
          <p className="text-lg font-bold text-yellow-400">
            {marketplaceStats.length > 1 ?
              Math.round(((marketplaceStats[marketplaceStats.length - 1].avgPrice - marketplaceStats[0].avgPrice) / marketplaceStats[marketplaceStats.length - 1].avgPrice) * 100)
              : 0}%
          </p>
          <p className="text-xs text-slate-500">
            Potential Savings
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 md:h-96">
        <Bar data={data} options={options} />
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketplaceStats.map((stat) => (
          <div key={stat.marketplace} className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white capitalize">{stat.marketplace}</h4>
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
                }}
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Products:</span>
                <span className="text-cyan-400">{stat.productCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Price:</span>
                <span className="text-white">Rs. {stat.avgPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Range:</span>
                <span className="text-slate-300">
                  Rs. {stat.minPrice.toLocaleString()} - Rs. {stat.maxPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceComparisonChart;
