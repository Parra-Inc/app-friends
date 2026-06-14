import { randomBytes } from "node:crypto";
import { sha256 } from "@/lib/crypto";
import type { ApiKeyScope } from "@prisma/client";

/**
 * API keys are shown to the user exactly once. We store only the sha-256 hash.
 *
 *   afp_…  publishable — safe to embed in a client SDK
 *   afs_…  secret      — server-to-server only
 */

export function keyPrefixFor(scope: ApiKeyScope): "afp_" | "afs_" {
  return scope === "SECRET" ? "afs_" : "afp_";
}

export function generateApiKey(scope: ApiKeyScope): {
  raw: string;
  hash: string;
  /** Short, non-secret label shown in the dashboard, e.g. "afp_a1b2". */
  prefix: string;
} {
  const body = randomBytes(24).toString("base64url");
  const raw = keyPrefixFor(scope) + body;
  return {
    raw,
    hash: sha256(raw),
    prefix: raw.slice(0, 8),
  };
}

export function hashApiKey(raw: string): string {
  return sha256(raw.trim());
}

export function isPublishable(raw: string): boolean {
  return raw.startsWith("afp_");
}

export function isSecret(raw: string): boolean {
  return raw.startsWith("afs_");
}
