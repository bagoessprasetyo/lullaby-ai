// lib/format-duration.ts

/**
 * Formats a duration in seconds to a human-readable string.
 * This implementation is safe for both server and client rendering.
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "5 min", "1 hr 20 min")
 */
export function formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return "--";
  
  // Use Math.floor for consistent behavior server and client side
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes} min`;
  } else {
    return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} min` : ''}`;
  }
}

// Move the client component to its own file
// components/formatted-duration.tsx