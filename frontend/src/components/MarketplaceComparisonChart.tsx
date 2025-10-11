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

  // Calculate box plot statistics for each marketplace
  const marketplaceStats = Object.entries(marketplaceData).map(([marketplace, data]) => {
    const { prices } = data;
    const validPrices = prices.filter(price => price > 0).sort((a, b) => a - b);

    if (validPrices.length === 0) {
      return {
        marketplace,
        min: 0,
        q1: 0,
        median: 0,
        q3: 0,
        max: 0,
        outliers: [],
        productCount: 0
      };
    }

    // Calculate quartiles
    const q1Index = Math.floor((validPrices.length - 1) * 0.25);
    const q2Index = Math.floor((validPrices.length - 1) * 0.5);
    const q3Index = Math.floor((validPrices.length - 1) * 0.75);

    const q1 = validPrices[q1Index];
    const median = validPrices[q2Index];
    const q3 = validPrices[q3Index];

    // Calculate IQR and outlier bounds
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Find outliers
    const outliers = validPrices.filter(price => price < lowerBound || price > upperBound);

    return {
      marketplace,
      min: Math.min(...validPrices),
      q1,
      median,
      q3,
      max: Math.max(...validPrices),
      outliers,
      productCount: validPrices.length
    };
  }).filter(stat => stat.productCount > 0);

  // Sort by median price for better visualization
  marketplaceStats.sort((a, b) => a.median - b.median);

  const marketplaceColors: Record<string, string> = {
    daraz: '#22d3ee',
    priceoye: '#ff4081',
    telemart: '#10b981',
    alibaba: '#ff4081',
    amazon: '#ff9900',
    ebay: '#26a69a'
  };

  // Create a clean, simple visualization showing key price metrics
  const data = {
    labels: marketplaceStats.map(stat => stat.marketplace),
    datasets: [
      {
        label: 'Lowest Price',
        data: marketplaceStats.map(stat => stat.min),
        backgroundColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] + '60' || '#64748b60'
        ),
        borderColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
        ),
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 24,
      },
      {
        label: 'Typical Price (Median)',
        data: marketplaceStats.map(stat => stat.median),
        backgroundColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
        ),
        borderColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
        ),
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 24,
      },
      {
        label: 'Highest Price',
        data: marketplaceStats.map(stat => stat.max),
        backgroundColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] + '40' || '#64748b40'
        ),
        borderColor: marketplaceStats.map(stat =>
          marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
        ),
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 24,
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
          font: {
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Price Range Comparison',
        color: '#f1f5f9',
        font: {
          size: 18,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#475569',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
            const label = context.dataset.label || '';
            const value = Math.round(context.parsed.y).toLocaleString();
            return `${label}: Rs. ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
      },
      y: {
        ticks: {
          color: '#cbd5e1',
          font: {
            size: 11,
          },
          callback: (value: string | number) => `Rs. ${Number(value).toLocaleString()}`,
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
      },
    },
    animation: {
      duration: 1000,
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
            Median: Rs. {Math.round(marketplaceStats[0].median).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">Price Difference</p>
          <p className="text-lg font-bold text-cyan-400">
            Rs. {(marketplaceStats[marketplaceStats.length - 1].median - marketplaceStats[0].median).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            Max vs Min Median
          </p>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">Savings Opportunity</p>
          <p className="text-lg font-bold text-yellow-400">
            {marketplaceStats.length > 1 ?
              Math.round(((marketplaceStats[marketplaceStats.length - 1].median - marketplaceStats[0].median) / marketplaceStats[marketplaceStats.length - 1].median) * 100)
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

      {/* Simple Price Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketplaceStats.map((stat) => (
          <div key={stat.marketplace} className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white capitalize">{stat.marketplace}</h4>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: marketplaceColors[stat.marketplace.toLowerCase()] || '#64748b'
                  }}
                />
                <span className="text-xs text-slate-400">{stat.productCount} products</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Typical Price:</span>
                <span className="text-white font-semibold">Rs. {Math.round(stat.median).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Price Range:</span>
                <span className="text-cyan-400 text-xs">
                  Rs. {Math.round(stat.min).toLocaleString()} - Rs. {Math.round(stat.max).toLocaleString()}
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
