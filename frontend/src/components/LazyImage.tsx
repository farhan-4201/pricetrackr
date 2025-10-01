import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, Image as ImageIcon } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackText?: string;
  showRetry?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYzNGM2IiBvcGFjaXR5PSIwLjA1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy...</text>",
  onLoad,
  onError,
  fallbackText = "Image not available",
  showRetry = true
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Set up Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only load once
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const loadImage = useCallback(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    setIsLoading(true);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };
  }, [src, onLoad, onError]);

  // Load image when it comes into view
  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      loadImage();
    }
  }, [isInView, isLoaded, hasError, retryCount, loadImage]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(prev => prev + 1);
  };

  // Show image with transition
  if (!hasError && !isLoading) {
    return (
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          "transition-all duration-300",
          isLoaded ? "opacity-100" : "opacity-70",
          className
        )}
        loading="lazy"
      />
    );
  }

  // Show error state with retry option
  if (hasError && showRetry) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "flex flex-col items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg relative overflow-hidden",
          className
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900/20">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(34,211,238,0.1) 1px, transparent 0)",
            backgroundSize: "20px 20px"
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-slate-400 mb-3">{fallbackText}</p>
          {retryCount < 2 && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors duration-200 border border-slate-600"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-center",
          className
        )}
      >
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Fallback for any other state
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg p-4",
        className
      )}
    >
      <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
      <p className="text-sm text-slate-400">{fallbackText}</p>
    </div>
  );
};
