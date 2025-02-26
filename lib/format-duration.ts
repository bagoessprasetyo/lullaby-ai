/**
 * Formats seconds into a readable duration string (e.g. "5m 30s")
 */
export function formatDuration(seconds: number): string {
    if (!seconds) return "0s";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  }