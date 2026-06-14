import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Sliding-window rate limiting for the SDK endpoints. Falls back to a small
 * in-memory limiter when Upstash isn't configured (dev / preview).
 */

let limiter: Ratelimit | null | undefined;

function upstashLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const r = redis();
  limiter = r
    ? new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(120, "60 s"),
        prefix: "af:rl",
        analytics: false,
      })
    : null;
  return limiter;
}

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { success: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

export async function rateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const l = upstashLimiter();
  if (l) {
    const res = await l.limit(identifier);
    return { success: res.success, remaining: res.remaining };
  }
  return memoryLimit(identifier, 120, 60_000);
}
