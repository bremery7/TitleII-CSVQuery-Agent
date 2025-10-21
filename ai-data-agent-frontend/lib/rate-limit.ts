import { RateLimiter } from 'limiter';

// Store rate limiters per IP address
const limiters = new Map<string, RateLimiter>();

// Configuration
const MAX_REQUESTS = 5; // Maximum login attempts
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

export function getRateLimiter(identifier: string): RateLimiter {
  if (!limiters.has(identifier)) {
    // Create a new rate limiter: 5 requests per 15 minutes
    const limiter = new RateLimiter({
      tokensPerInterval: MAX_REQUESTS,
      interval: TIME_WINDOW,
    });
    limiters.set(identifier, limiter);
  }
  return limiters.get(identifier)!;
}

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const limiter = getRateLimiter(identifier);
  const remainingRequests = await limiter.removeTokens(1);
  return remainingRequests >= 0;
}

export function getRemainingAttempts(identifier: string): number {
  const limiter = limiters.get(identifier);
  if (!limiter) return MAX_REQUESTS;
  return Math.floor(limiter.getTokensRemaining());
}

// Clean up old limiters periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, limiter] of limiters.entries()) {
    // If limiter has full tokens, it hasn't been used recently
    if (limiter.getTokensRemaining() === MAX_REQUESTS) {
      limiters.delete(key);
    }
  }
}, 60 * 60 * 1000);
