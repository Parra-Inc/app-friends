import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** Returns a Redis client, or null when Upstash isn't configured (dev). */
export function redis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
