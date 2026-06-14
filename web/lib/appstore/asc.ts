import { SignJWT, importPKCS8 } from "jose";
import { prisma } from "@/prisma/client";
import { decryptSecret } from "@/lib/crypto";
import { logger } from "@/lib/logger";

const log = logger("asc");
const BASE = "https://api.appstoreconnect.apple.com/v1";

/**
 * App Store Connect API client. Builds a short-lived ES256 JWT from the
 * workspace's stored credentials and lists the apps on the account so a
 * developer can import them with their real bundle ids + names.
 */

async function ascToken(args: {
  issuerId: string;
  keyId: string;
  privateKeyPem: string;
}): Promise<string> {
  const key = await importPKCS8(args.privateKeyPem, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: args.keyId, typ: "JWT" })
    .setIssuer(args.issuerId)
    .setIssuedAt()
    .setExpirationTime("18m")
    .setAudience("appstoreconnect-v1")
    .sign(key);
}

export interface AscApp {
  ascAppId: string;
  bundleId: string;
  name: string;
  sku: string | null;
}

interface AscAppsResponse {
  data: Array<{
    id: string;
    attributes: { bundleId: string; name: string; sku?: string };
  }>;
}

/** List apps for a stored credential. Throws on auth/network failure. */
export async function listAscApps(credentialId: string): Promise<AscApp[]> {
  const cred = await prisma.ascCredential.findUnique({
    where: { id: credentialId },
  });
  if (!cred) throw new Error("Credential not found");

  const token = await ascToken({
    issuerId: cred.issuerId,
    keyId: cred.keyId,
    privateKeyPem: decryptSecret(cred.privateKeyEnc),
  });

  const res = await fetch(`${BASE}/apps?limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log.error(`apps list failed: ${res.status} ${body.slice(0, 200)}`);
    throw new Error(`App Store Connect returned ${res.status}`);
  }
  const data = (await res.json()) as AscAppsResponse;
  await prisma.ascCredential.update({
    where: { id: credentialId },
    data: { lastSyncedAt: new Date() },
  });
  return data.data.map((a) => ({
    ascAppId: a.id,
    bundleId: a.attributes.bundleId,
    name: a.attributes.name,
    sku: a.attributes.sku ?? null,
  }));
}

/** Validate a credential by attempting a token + a single API call. */
export async function validateAscCredential(args: {
  issuerId: string;
  keyId: string;
  privateKeyPem: string;
}): Promise<boolean> {
  try {
    const token = await ascToken(args);
    const res = await fetch(`${BASE}/apps?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    log.error("credential validation failed", err);
    return false;
  }
}
