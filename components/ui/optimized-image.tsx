// components/ui/optimized-image.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onError?: () => void;
  blurDataUrl?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  className,
  objectFit = 'cover',
  onError,
  blurDataUrl,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src);
  const [isLoading, setIsLoading] = useState(!priority);
  
  // Handle Supabase storage URLs specifically
  useEffect(() => {
    if (src) {
      setImgSrc(src);
    }
  }, [src]);
  
  if (!imgSrc) {
    return null;
  }
  
  // For Supabase storage URLs, we need special handling
  const isSupabaseUrl = imgSrc.includes('storage/v1/object/public');
  
  if (isSupabaseUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100",
            objectFit === 'cover' && 'object-cover w-full h-full',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down',
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            if (onError) onError();
            else setImgSrc('/images/placeholder.jpg'); // Fallback image
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
    );
  }
  
  // For other images, use Next.js Image component for optimization
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && !priority && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width || 800}
        height={height || 600}
        sizes={sizes}
        priority={priority}
        className={cn(
          "transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          objectFit === 'cover' && 'object-cover w-full h-full',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          if (onError) onError();
          else setImgSrc('/images/placeholder.jpg'); // Fallback image
        }}
        placeholder={blurDataUrl ? "blur" : "empty"}
        blurDataURL={blurDataUrl}
      />
    </div>
  );
}