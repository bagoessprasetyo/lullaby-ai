"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if a media query is matched
 * @param query The media query to match (e.g., "(max-width: 768px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false to handle server-side rendering
  // This avoids hydration mismatch errors
  const [matches, setMatches] = useState(false);
  
  // Track if component is mounted to handle SSR
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
    
    // Create media query list only in the browser
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      
      // Set initial state
      setMatches(mediaQuery.matches);
      
      // Create event listener function
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener for changes
      mediaQuery.addEventListener('change', handleChange);
      
      // Clean up listener on unmount
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [query]);
  
  // If we haven't mounted yet, return false to avoid hydration mismatch
  if (!hasMounted) return false;
  
  return matches;
}

// Usage examples:
// const isMobile = useMediaQuery('(max-width: 768px)');
// const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
// const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
// const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');