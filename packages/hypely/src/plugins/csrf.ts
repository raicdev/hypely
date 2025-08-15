// src/plugins/csrf.ts
import type { Middleware, CookieOptions } from "@/core/types";
import crypto from "crypto";

export interface CsrfOptions {
  tokenHeader?: string;
  cookieName?: string;
  methods?: string[];
  secret: string; // Server's secret key (required)
  ttl?: number;   // Token expiration time (seconds)
}

// Token generation (UUID-based)
export function generateCsrfToken(secret: string, ttl = 3600): string {
  const nonce = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + ttl; // Expiration time
  const payload = `${nonce}:${exp}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

// Token verification
export function verifyCsrfToken(secret: string, token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [nonce, expStr, signature] = decoded.split(":");
    const exp = parseInt(expStr, 10);

    // Expiration time check
    if (Date.now() / 1000 > exp) {
      return false;
    }

    // Signature verification
    const payload = `${nonce}:${exp}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return signature === expected;
  } catch {
    return false;
  }
}

// Validation middleware
export const csrfValidate = (opts: CsrfOptions): Middleware => async (ctx, next) => {
  const {
    tokenHeader = "x-csrf-token",
    cookieName = "csrf_token",
    methods = ["POST", "PUT", "DELETE", "PATCH"],
    secret,
    ttl = 3600,
  } = opts;

  if (!secret) {
    throw new Error("CSRF middleware requires a secret");
  }

  if (methods.includes(ctx.method)) {
    const tokenFromHeader = ctx.get(tokenHeader);
    const tokenFromCookie = ctx.cookies.get(cookieName);

    if (!tokenFromHeader || !tokenFromCookie) {
      return new Response("Missing CSRF token", { status: 403 });
    }

    // Token verification & Cookie and Header match check
    if (
      !verifyCsrfToken(secret, tokenFromHeader) ||
      tokenFromHeader !== tokenFromCookie
    ) {
      return new Response("Invalid CSRF token", { status: 403 });
    }
  }

  return await next();
};

// Mint token on safe requests (Double Submit Cookie pattern)
export const csrfSeed = (
  opts: Pick<CsrfOptions, "secret" | "cookieName" | "ttl"> & {
    cookieOptions?: CookieOptions;
  }
): Middleware => async (ctx, next) => {
  const {
    secret,
    cookieName = "csrf_token",
    ttl = 3600,
    cookieOptions,
  } = opts;

  if (!secret) {
    throw new Error("CSRF seed middleware requires a secret");
  }

  // Only seed on safe methods
  if (ctx.method === "GET" || ctx.method === "OPTIONS") {
    const existing = ctx.cookies.get(cookieName);
    if (!existing || !verifyCsrfToken(secret, existing)) {
      const token = generateCsrfToken(secret, ttl);
      // For double submit cookie, the cookie must be readable by client JS (no httpOnly)
      // Secure defaults; allow overrides via cookieOptions
      const isHttps = ctx.url.protocol === "https:";
      const defaultOpts: CookieOptions = {
        path: "/",
        sameSite: "Strict",
        secure: isHttps,
        httpOnly: false,
        maxAge: ttl,
      };
      ctx.cookies.set(cookieName, token, { ...defaultOpts, ...(cookieOptions ?? {}) });
    }
  }

  return next();
};

// Unified API: callable and with methods
type CsrfAPI = ((opts: CsrfOptions) => Middleware) & {
  seed: typeof csrfSeed;
  validate: typeof csrfValidate;
};

export const csrf: CsrfAPI = Object.assign(
  (opts: CsrfOptions) => csrfValidate(opts),
  {
    seed: csrfSeed,
    validate: csrfValidate,
  }
);
