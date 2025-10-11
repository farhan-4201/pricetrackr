import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      <p className="text-gray-300">Loading page...</p>
    </div>
  </div>
);

export const SkeletonLoader = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="rounded-xl p-6 border bg-gray-800/50 backdrop-blur-sm animate-pulse">
    <div className="relative mb-4">
      <Skeleton className="w-full h-48 rounded-lg" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  </div>
);
