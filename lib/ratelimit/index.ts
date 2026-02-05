/**
 * Rate Limiting with Upstash Redis
 * Used for download throttling and API protection
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client - will use these env vars:
// UPSTASH_REDIS_REST_URL
// UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate limiter for downloads: 5 downloads per hour per event
 */
export const downloadRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "@guestcap/download",
});

/**
 * Rate limiter for API calls: 100 requests per minute
 */
export const apiRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "@guestcap/api",
});

/**
 * Rate limiter for uploads: 300 files per hour per guest
 */
export const uploadRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "1 h"),
    analytics: true,
    prefix: "@guestcap/upload",
});

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
    limiter: Ratelimit,
    identifier: string
): Promise<{
    success: boolean;
    remaining: number;
    reset: number;
}> {
    try {
        const { success, remaining, reset } = await limiter.limit(identifier);
        return { success, remaining, reset };
    } catch (error) {
        console.error("Rate limit check failed:", error);
        // Fail open - allow the request if Redis is down
        return { success: true, remaining: 0, reset: 0 };
    }
}

/**
 * Helper to create rate limit exceeded response
 */
export function rateLimitExceededResponse(reset: number) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return new Response(
        JSON.stringify({
            error: "Rate limit exceeded",
            retryAfter: retryAfter,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": retryAfter.toString(),
            },
        }
    );
}
