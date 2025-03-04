import { rateLimiter } from '@/lib/rate-limiter';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Rate limit to 5 requests per minute
  try {
    await rateLimiter.limit(session.user.id);
  } catch (error) {
    return new Response('Too Many Requests', { status: 429 });
  }

  // Existing processing logic...
}