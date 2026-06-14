import { SignJWT, jwtVerify } from "jose";
import { SDK_DEFAULTS } from "./contract";

/**
 * Impression tokens. Minted when we serve a promo, echoed back on tap/install.
 * Signed so a client can't fabricate attribution; carries everything we need to
 * record the event without a second DB lookup.
 */

export interface PromoTokenClaims {
  /** Publisher app id (where the promo is shown). */
  pub: string;
  /** Promoted app id (what's shown). */
  pro: string;
  /** Source: "P" pairing | "C" campaign. */
  src: "P" | "C";
  /** Campaign id, when src === "C". */
  cmp?: string;
  /** Placement. */
  plc: string;
  /** Random nonce so each served promo has a unique token (dedupe). */
  n: string;
}

function secret(): Uint8Array {
  const raw = process.env.SDK_TOKEN_SECRET;
  if (!raw) throw new Error("SDK_TOKEN_SECRET is required");
  return new TextEncoder().encode(raw);
}

export async function mintPromoToken(
  claims: PromoTokenClaims,
  ttlSeconds: number = SDK_DEFAULTS.tokenTtlSeconds
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret());
}

export async function verifyPromoToken(
  token: string
): Promise<PromoTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as PromoTokenClaims;
  } catch {
    return null;
  }
}
