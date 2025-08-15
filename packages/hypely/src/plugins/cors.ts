// src/plugins/cors.ts
import type { Middleware } from "@/core/types";

/**
 * CORS middleware to set appropriate headers for cross-origin requests.
 * 
 * Options:
 * - origin: Allowed origin(s), string or array of strings. Default: "*"
 * - methods: Allowed HTTP methods. Default: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
 * - headers: Allowed request headers. Default: ["Content-Type", "Authorization"]
 * - credentials: Allow credentials. Default: false
 * - maxAge: Max age for preflight cache. Default: 600
 */
export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const cors = (opts: CorsOptions = {}): Middleware => async (ctx, next) => {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    headers = ["Content-Type", "Authorization"],
    credentials = false,
    maxAge = 600,
  } = opts;

  // Resolve allowed origin
  let allowedOrigin = origin;
  if (Array.isArray(origin)) {
    const reqOrigin = ctx.get("origin");
    if (reqOrigin) {
      allowedOrigin = origin.includes(reqOrigin) ? reqOrigin : origin[0] ?? "*";
    }
  }

  // Set CORS headers
  ctx.set("Access-Control-Allow-Origin", Array.isArray(allowedOrigin) ? allowedOrigin.join(", ") : allowedOrigin || "*");
  ctx.set("Access-Control-Allow-Methods", methods.join(", "));
  ctx.set("Access-Control-Allow-Headers", headers.join(", "));
  ctx.set("Access-Control-Allow-Credentials", credentials ? "true" : "false");
  ctx.set("Access-Control-Max-Age", String(maxAge));

  // Handle preflight OPTIONS request
  if (ctx.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: ctx.responseHeaders });
  }

  const result = await next();

  // Attach headers to Response if possible
  if (result instanceof Response) {
    for (const [k, v] of Object.entries(ctx.responseHeaders)) {
      result.headers.set(k, v);
    }
    return result;
  }

  return result;
};
