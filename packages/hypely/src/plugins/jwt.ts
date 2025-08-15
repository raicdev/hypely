// src/plugins/jwt.ts
import type { Middleware } from "@/core/types";
import crypto from "crypto";

export interface JwtOptions {
  secret: string | Buffer; // HMAC secret
  headerName?: string; // Authorization header
  scheme?: string; // Bearer
  cookieName?: string; // alternatively read from cookie
  algorithms?: Array<"HS256" | "HS384" | "HS512">;
  audience?: string | string[];
  issuer?: string | string[];
  required?: boolean; // if true, reject when missing; otherwise optional
  clockToleranceSec?: number; // leeway for nbf/exp
  setStateKey?: string; // where to place payload in ctx.state
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signHS(algo: "HS256" | "HS384" | "HS512", data: string, secret: string | Buffer) {
  const name = algo.replace("HS", "sha");
  return crypto.createHmac(name, secret).update(data).digest();
}

function parseAuth(header?: string, expectedScheme = "bearer") {
  if (!header) return undefined;
  const i = header.indexOf(" ");
  if (i <= 0) return undefined;
  const scheme = header.slice(0, i).toLowerCase();
  if (scheme !== expectedScheme.toLowerCase()) return undefined;
  const token = header.slice(i + 1).trim();
  return token || undefined;
}

export function verifyJwt(token: string, secret: string | Buffer, opts: Omit<JwtOptions, "secret"> = {}) {
  const algorithms = opts.algorithms ?? ["HS256", "HS384", "HS512"];
  const parts = token.split(".");
  assert(parts.length === 3, "Invalid token");

  const [h, p, s] = parts;
  const header = JSON.parse(Buffer.from(h, "base64url").toString());
  assert(algorithms.includes(header.alg), "Unsupported algorithm");
  const data = `${h}.${p}`;
  const sig = Buffer.from(s, "base64url");
  const expected = signHS(header.alg, data, secret);
  assert(timingSafeEqual(sig, expected), "Invalid signature");

  const payload = JSON.parse(Buffer.from(p, "base64url").toString());
  const now = Math.floor(Date.now() / 1000);
  const tol = opts.clockToleranceSec ?? 0;
  if (payload.nbf && now + tol < payload.nbf) throw new Error("Token not active");
  if (payload.exp && now - tol >= payload.exp) throw new Error("Token expired");

  if (opts.audience) {
    const aud = Array.isArray(opts.audience) ? opts.audience : [opts.audience];
    const pa = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    assert(aud.some((a) => pa.includes(a)), "Invalid audience");
  }
  if (opts.issuer) {
    const iss = Array.isArray(opts.issuer) ? opts.issuer : [opts.issuer];
    assert(iss.includes(payload.iss), "Invalid issuer");
  }

  return { header, payload } as const;
}

export const jwt = (opts: JwtOptions): Middleware => {
  const {
    secret,
    headerName = "authorization",
    scheme = "Bearer",
    cookieName,
    required = true,
    setStateKey = "jwt",
    algorithms,
    audience,
    issuer,
    clockToleranceSec,
  } = opts;
  if (!secret) throw new Error("jwt middleware requires a secret");

  return async (ctx, next) => {
    let token = parseAuth(ctx.get(headerName), scheme) || undefined;
    if (!token && cookieName) token = ctx.cookies.get(cookieName);

    if (!token) {
      if (required) return new Response("Unauthorized", { status: 401 });
      return next();
    }

    try {
      const { payload } = verifyJwt(token, secret, { algorithms, audience, issuer, clockToleranceSec });
      (ctx.state as any)[setStateKey] = payload;
    } catch (e) {
      if (required) return new Response("Unauthorized", { status: 401 });
    }

    return next();
  };
};
