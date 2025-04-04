// lib/image-utils.ts

/**
 * Get optimized image dimensions based on original and target constraints
 * This ensures we're loading appropriately sized images for different viewports
 */
export function getOptimizedDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth = 1200,
    maxHeight = 800
  ): { width: number, height: number } {
    // If we don't have original dimensions, use the maximums
    if (!originalWidth || !originalHeight) {
      return { width: maxWidth, height: maxHeight };
    }
    
    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    
    // Calculate new dimensions while maintaining aspect ratio
    let width = originalWidth;
    let height = originalHeight;
    
    // Constrain by width
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    // Then constrain by height if necessary
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }
  
  /**
   * Convert a Supabase storage URL to a public URL with resizing parameters
   * Note: This assumes Supabase storage is configured with image resizing capabilities
   * You may need to adjust based on your actual setup
   */
  export function getOptimizedStorageUrl(
    storagePath: string,
    width?: number,
    height?: number,
    format: 'webp' | 'jpeg' | 'auto' = 'webp'
  ): string {
    // Early return if path is missing
    if (!storagePath) return '';
    
    // Check if it's already a full URL
    if (storagePath.startsWith('http')) {
      return storagePath;
    }
    
    // Base URL for storage
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
    
    // If no sizing required, return the direct URL
    if (!width && !height) {
      return `${baseUrl}${storagePath}`;
    }
    
    // Construct URL with resize parameters
    // Note: The actual query parameters depend on your image processing setup
    let url = `${baseUrl}${storagePath}`;
    
    // Add resize parameters if your Supabase is configured for image resizing
    // This is an example - adjust based on your actual implementation
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (format !== 'auto') params.append('format', format);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return url;
  }
  
  /**
   * Generate image sizes attribute for responsive images
   */
  export function getResponsiveSizes(
    defaultSize: string = '100vw'
  ): string {
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${defaultSize}`;
  }
  
  /**
   * Determine if the browser supports a specific image format
   */
  export function isFormatSupported(format: 'webp' | 'avif'): boolean {
    if (typeof window === 'undefined') return false; // Not in browser
    
    if (format === 'webp') {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
    }
    
    if (format === 'avif') {
      // Testing AVIF support is more complex, this is a simplified approach
      return 'HTMLImageElement' in window && 'decode' in HTMLImageElement.prototype;
    }
    
    return false;
  }
  
  /**
   * Process a story image path to get a standardized URL
   * Handles both Cloudinary and Supabase storage paths
   */
  export function getStoryImageUrl(imagePath: string | null | undefined, theme: string = 'adventure'): string {
    // Return default image if no path provided
    if (!imagePath) {
      console.log(`No image path provided, using default theme: ${theme}`);
      return `/images/theme-${theme}.jpg`;
    }
    
    console.log(`Processing image path: ${imagePath}`);
    
    // Already a Cloudinary URL - return as is
    if (imagePath.includes('cloudinary.com')) {
      console.log(`Using existing Cloudinary URL: ${imagePath}`);
      return imagePath;
    }
    
    // Any other complete URL - return as is
    if (imagePath.startsWith('http')) {
      console.log(`Using existing URL: ${imagePath}`);
      return imagePath;
    }
    
    // Supabase storage URL - return as is
    if (imagePath.includes('/storage/v1/object/public/')) {
      console.log(`Using Supabase storage URL: ${imagePath}`);
      return imagePath;
    }
    
    // Extract filename for Cloudinary URL construction
    const filename = imagePath.split('/').pop();
    if (filename) {
      const cloudinaryUrl = `https://res.cloudinary.com/dcx38wpwa/image/upload/v1741976467/story-app-stories/${filename}`;
      console.log(`Constructed Cloudinary URL from filename: ${cloudinaryUrl}`);
      return cloudinaryUrl;
    }
    
    // If we can't extract filename, use the path directly
    const fallbackUrl = `https://res.cloudinary.com/dcx38wpwa/image/upload/v1741976467/story-app-stories/${imagePath}`;
    console.log(`Using fallback Cloudinary URL: ${fallbackUrl}`);
    return fallbackUrl;
  }