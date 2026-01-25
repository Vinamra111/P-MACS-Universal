/**
 * Simple in-memory rate limiting middleware
 * For production, consider Redis-backed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (entry.resetAt < now) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address or user ID)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || entry.resetAt < now) {
      // First request or window expired - reset
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return false;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > limit) {
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.requests.get(identifier);
    if (!entry) return limit;
    return Math.max(0, limit - entry.count);
  }

  /**
   * Reset rate limit for an identifier (useful for testing)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Admin routes - strict limits
  ADMIN_CREATE_USER: { limit: 10, windowMs: 60 * 1000 }, // 10 users per minute
  ADMIN_UPDATE_USER: { limit: 20, windowMs: 60 * 1000 }, // 20 updates per minute
  ADMIN_DELETE_USER: { limit: 5, windowMs: 60 * 1000 }, // 5 deletions per minute
  ADMIN_ACCESS_LOGS: { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  ADMIN_CHAT: { limit: 30, windowMs: 60 * 1000 }, // 30 chat messages per minute

  // General auth routes
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 login attempts per 15 minutes
} as const;

/**
 * Rate limit check helper
 */
export function checkRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): { limited: boolean; remaining: number } {
  const limited = rateLimiter.isRateLimited(identifier, config.limit, config.windowMs);
  const remaining = rateLimiter.getRemaining(identifier, config.limit);

  return { limited, remaining };
}

/**
 * Get identifier from request (IP or user ID)
 */
export function getRequestIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

export { rateLimiter };
