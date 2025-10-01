import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="rounded-xl p-6 border bg-slate-800/50 backdrop-blur-sm border-slate-700 h-full">
      {/* Image Skeleton */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <Skeleton className="w-full h-48 bg-slate-700" />
        {/* Category Badge Skeleton */}
        <div className="absolute top-2 left-2 w-16 h-6 rounded-sm bg-slate-600" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 bg-slate-700" />
        <Skeleton className="h-4 w-1/2 bg-slate-700" />

        {/* Price Section */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24 bg-slate-700" />
          <div className="flex items-center space-x-2">
            <Skeleton className="w-3 h-3 rounded-full bg-slate-600" />
            <Skeleton className="h-4 w-16 bg-slate-700" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-slate-700" />
          <Skeleton className="h-4 w-2/3 bg-slate-700" />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <Skeleton className="h-10 flex-1 bg-slate-700 rounded" />
          <Skeleton className="h-10 flex-1 bg-slate-700 rounded" />
        </div>
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

// Search Result Skeleton - Multiple Product Cards
function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, ChartSkeleton, TableRowSkeleton, ProductGridSkeleton }
