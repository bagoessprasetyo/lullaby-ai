import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://')
    ? process.env.UPSTASH_REDIS_REST_URL
    : `https://${process.env.UPSTASH_REDIS_REST_URL}`,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Add validation before creating Redis client
if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL environment variable is not set');
}

if (!process.env.UPSTASH_REDIS_REST_URL.startsWith('https://')) {
  console.warn('UPSTASH_REDIS_REST_URL should start with https://, automatically prepending it');
}
