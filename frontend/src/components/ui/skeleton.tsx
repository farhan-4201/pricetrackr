import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 border bg-slate-900/50 backdrop-blur-sm border-slate-700/50 h-full relative overflow-hidden group animate-pulse">
      {/* Animated Background Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.05) 0%, transparent 70%)"
        }}
      />

      {/* Image Skeleton with Glassmorphism */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <Skeleton className="w-full h-48 bg-gradient-to-br from-slate-700/50 to-slate-800/50" />
        {/* Wishlist Button Skeleton */}
        <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-slate-800/60 backdrop-blur-sm border border-slate-600/30" />
        {/* Category Badge Skeleton */}
        <div className="absolute top-2 left-2 w-20 h-6 rounded-full bg-slate-800/60 backdrop-blur-sm border border-slate-600/30" />
        {/* Price Change Indicator Skeleton */}
        <div className="absolute bottom-2 right-2 w-16 h-6 rounded-full bg-slate-800/60 backdrop-blur-sm border border-slate-600/30" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3 flex-grow flex flex-col">
        {/* Title Skeleton with varying lengths */}
        <Skeleton className="h-6 w-full bg-slate-700/60" />
        <Skeleton className="h-6 w-3/4 bg-slate-700/60" />

        {/* Price & Marketplace Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-8 w-28 bg-slate-700/60" />
            <div className="flex items-center space-x-2">
              <Skeleton className="w-3 h-3 rounded-full bg-slate-600/60" />
              <Skeleton className="h-4 w-20 bg-slate-700/60" />
            </div>
          </div>
        </div>

        {/* Rating Stars Skeleton */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="w-4 h-4 bg-slate-700/60" />
          ))}
          <Skeleton className="h-4 w-12 bg-slate-700/60 ml-2" />
        </div>

        {/* Description Lines */}
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-full bg-slate-700/60" />
          <Skeleton className="h-4 w-5/6 bg-slate-700/60" />
          <Skeleton className="h-4 w-4/6 bg-slate-700/60" />
        </div>
      </div>

      {/* Action Buttons with Enhanced Styling */}
      <div className="flex space-x-2 pt-4 mt-auto">
        <Skeleton className="h-10 flex-1 bg-slate-700/60 rounded-lg" />
        <Skeleton className="h-10 w-10 bg-slate-700/60 rounded-lg" />
      </div>
    </div>
  );
}

// Chart Skeleton
function ChartSkeleton({ height = "h-80", className }: { height?: string; className?: string }) {
  return (
    <div className={cn("bg-slate-900/50 rounded-lg p-6 border border-slate-700", className)}>
      {/* Title */}
      <Skeleton className="h-6 w-48 mb-4 bg-slate-700" />

      {/* Chart Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <Skeleton className="h-4 w-16 mx-auto mb-2 bg-slate-700" />
          <Skeleton className="h-6 w-12 mx-auto bg-slate-700" />
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <Skeleton className="h-4 w-20 mx-auto mb-2 bg-slate-700" />
          <Skeleton className="h-6 w-14 mx-auto bg-slate-700" />
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <Skeleton className="h-4 w-18 mx-auto mb-2 bg-slate-700" />
          <Skeleton className="h-6 w-10 mx-auto bg-slate-700" />
        </div>
      </div>

      {/* Chart Area */}
      <div className={cn("relative w-full bg-slate-800/30 rounded-lg overflow-hidden", height)}>
        <div className="flex items-end justify-around h-full px-4 py-6">
          {/* Chart bars */}
          {[80, 65, 90, 45, 70, 85].map((height, index) => (
            <Skeleton
              key={index}
              className={cn("w-8 bg-slate-600 rounded-t", `h-[${height}%]`)}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        {/* Chart labels */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-around">
          {[1,2,3,4,5,6].map((_, index) => (
            <Skeleton key={index} className="h-3 w-12 bg-slate-600" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Table Row Skeleton
function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4 p-4 border-b border-slate-700">
      <Skeleton className="h-4 w-full bg-slate-700" />
      <Skeleton className="h-4 w-full bg-slate-700" />
      <Skeleton className="h-4 w-full bg-slate-700" />
      <Skeleton className="h-4 w-full bg-slate-700" />
      <Skeleton className="h-4 w-full bg-slate-700" />
    </div>
  );
}

// Search Result Skeleton - Multiple Product Cards with Staggered Animation
function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'both'
          }}
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// Progressive Loading Component
function ProgressiveLoader({
  isLoading,
  hasData,
  skeletonCount = 6,
  children
}: {
  isLoading: boolean;
  hasData: boolean;
  skeletonCount?: number;
  children: React.ReactNode;
}) {
  if (isLoading && !hasData) {
    return <ProductGridSkeleton count={skeletonCount} />;
  }

  if (!isLoading && hasData) {
    return <>{children}</>;
  }

  return null;
}

// Search Form Skeleton
function SearchFormSkeleton() {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-8">
      <div className="space-y-6">
        {/* Search Input Skeleton */}
        <div className="relative">
          <Skeleton className="h-14 w-full rounded-xl bg-slate-800/60" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Skeleton className="h-6 w-6 bg-slate-700/60 rounded" />
          </div>
        </div>

        {/* Filter Buttons Skeleton */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg bg-slate-800/60" />
          ))}
        </div>

        {/* Search Button Skeleton */}
        <Skeleton className="h-12 w-32 rounded-lg bg-slate-700/60" />
      </div>
    </div>
  );
}

// Loading Spinner with Glassmorphism
function LoadingSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-400/20 to-purple-400/20 animate-spin",
          sizeClasses[size]
        )}
        style={{
          background: "conic-gradient(from 0deg, transparent, rgba(34, 211, 238, 0.3), transparent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}
      >
        <div className={cn("rounded-full bg-slate-900/80", sizeClasses[size])} />
      </div>
    </div>
  );
}

export {
  Skeleton,
  ProductCardSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  ProductGridSkeleton,
  ProgressiveLoader,
  SearchFormSkeleton,
  LoadingSpinner
}
