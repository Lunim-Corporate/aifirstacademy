import crypto from "crypto";

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function getSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">, ttlSec = DEFAULT_TTL_SEC) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSec;
  const body: JWTPayload = { ...payload, iat, exp } as JWTPayload;
  const header = { alg: "HS256", typ: "JWT" };
  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const data = `${encode(header)}.${encode(body)}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf-8")) as JWTPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
