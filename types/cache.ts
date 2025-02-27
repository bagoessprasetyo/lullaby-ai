export interface CacheConfig {
  ttl: number;
  maxSize: number;
  namespace: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleanup: string;
}