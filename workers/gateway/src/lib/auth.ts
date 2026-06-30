import type { Env } from "../types";

/**
 * Verify a Firebase ID token (RS256) against Google's public JWKs using WebCrypto.
 * In dev, ALLOW_ANON="true" bypasses verification and returns a stable anon uid so the
 * shell is usable before Firebase is wired up. See PRD §10.5 / §13.
 */

interface JwkKey {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg: string;
  use: string;
}

const JWK_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let cachedKeys: { keys: JwkKey[]; expiresAt: number } | null = null;

async function getKeys(): Promise<JwkKey[]> {
  const now = Date.now();
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys;
  const res = await fetch(JWK_URL);
  const cacheControl = res.headers.get("cache-control") ?? "";
  const maxAge = Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? "3600");
  const data = (await res.json()) as { keys: JwkKey[] };
  cachedKeys = { keys: data.keys, expiresAt: now + maxAge * 1000 };
  return data.keys;
}

function b64urlToUint8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(b64url.length / 4) * 4,
    "=",
  );
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson(b64url: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToUint8(b64url)));
}

export interface VerifiedUser {
  uid: string;
  claims: Record<string, unknown>;
  anonymous: boolean;
}

export async function verifyUser(req: Request, env: Env): Promise<VerifiedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    if (env.ALLOW_ANON === "true") return { uid: "anon", claims: {}, anonymous: true };
    return null;
  }

  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) throw new Error("malformed token");
    const headerObj = decodeJson(h) as { kid?: string; alg?: string };
    const payload = decodeJson(p) as Record<string, unknown>;

    const projectId = env.FIREBASE_PROJECT_ID;
    if (projectId) {
      if (payload.aud !== projectId) throw new Error("bad aud");
      if (payload.iss !== `https://securetoken.google.com/${projectId}`)
        throw new Error("bad iss");
    }
    const exp = Number(payload.exp ?? 0);
    if (exp * 1000 < Date.now()) throw new Error("expired");

    const keys = await getKeys();
    const jwk = keys.find((k) => k.kid === headerObj.kid);
    if (!jwk) throw new Error("unknown kid");

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToUint8(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!ok) throw new Error("bad signature");

    return { uid: String(payload.sub ?? payload.user_id ?? "unknown"), claims: payload, anonymous: false };
  } catch {
    if (env.ALLOW_ANON === "true") return { uid: "anon", claims: {}, anonymous: true };
    return null;
  }
}
