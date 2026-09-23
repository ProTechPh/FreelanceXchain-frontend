'use client';

import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/**
 * Optimized Image component with WebP/AVIF support via Next.js Image
 * 
 * Next.js automatically handles:
 * - Format selection (AVIF > WebP > JPEG)
 * - Responsive sizing
 * - Lazy loading
 * - Image optimization at build time
 * 
 * For static images in /public, use standard <Image> with src path.
 * For external images, add domain to next.config.ts remotePatterns.
 * 
 * @example
 * <OptimizedImage
 *   src="/images/logo-wordmark.webp"
 *   alt="FreelanceXchain Logo"
 *   width={400}
 *   height={100}
 *   priority
 * />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  sizes,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}

interface LogoImageProps {
  variant: 'wordmark' | 'full' | 'icon' | 'sparkle';
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Pre-configured logo image component with WebP fallbacks.
 * Automatically serves WebP with JPEG fallback for older browsers.
 * 
 * Note: This component uses the public/images/ directory.
 * Run `npm run optimize-images` to generate WebP versions.
 * 
 * @example
 * <LogoImage variant="wordmark" width={400} height={100} />
 */
export function LogoImage({
  variant,
  width,
  height,
  priority,
  className,
}: LogoImageProps) {
  const webpSrc = `/images/logo-${variant}.webp`;
  
  return (
    <OptimizedImage
      src={webpSrc}
      alt={`FreelanceXchain ${variant}`}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
