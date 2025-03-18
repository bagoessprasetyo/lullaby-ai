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
