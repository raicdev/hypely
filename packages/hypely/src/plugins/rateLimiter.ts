// src/plugins/rateLimiter.ts
import type { Middleware } from "@/core/types";

export interface RateLimitOptions {
  windowMs?: number; // time window in ms
  max?: number; // max requests per window per key
  keyGenerator?: (ctx: any) => string; // derive key (default: ip)
  skip?: (ctx: any) => boolean; // skip certain requests
  headers?: boolean; // send rate limit headers
}

// in-memory store (per-process)
class MemoryStore {
  private map = new Map<string, { count: number; reset: number }>();
  constructor(private windowMs: number) {}

  hit(key: string) {
    const now = Date.now();
    const entry = this.map.get(key);
    if (!entry || entry.reset <= now) {
      const reset = now + this.windowMs;
      this.map.set(key, { count: 1, reset });
      return { count: 1, reset };
    }
    entry.count += 1;
    return entry;
  }

  get(key: string) {
    return this.map.get(key);
  }
}

export const rateLimiter = (opts: RateLimitOptions = {}): Middleware => {
  const {
    windowMs = 60_000,
    max = 60,
    keyGenerator,
    skip,
    headers = true,
  } = opts;

  const store = new MemoryStore(windowMs);

  return async (ctx, next) => {
    if (skip && skip(ctx)) return next();

    const key = (keyGenerator?.(ctx)) || ctx.get("x-forwarded-for") || (ctx as any).ip || "global";
    const { count, reset } = store.hit(key);

    if (headers) {
      ctx.set("X-RateLimit-Limit", String(max));
      ctx.set("X-RateLimit-Remaining", String(Math.max(0, max - count)));
      ctx.set("X-RateLimit-Reset", String(Math.floor(reset / 1000)));
    }

    if (count > max) {
      const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
      if (headers) ctx.set("Retry-After", String(retryAfter));
      return ctx.text("Too Many Requests", 429);
    }

    return next();
  };
};
