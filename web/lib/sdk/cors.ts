/**
 * Permissive CORS for the public SDK endpoints. Native apps don't need it, but
 * the React Native SDK on web and browser demos do. Publishable keys are
 * designed to be public, so `*` origin is acceptable here.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-AppFriends-Key",
  "Access-Control-Max-Age": "86400",
};

export function corsHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  for (const [k, v] of Object.entries(CORS_HEADERS)) h.set(k, v);
  return h;
}

export function corsJson(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, { ...init, headers: corsHeaders(init?.headers) });
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
