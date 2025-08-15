// src/plugins/ipFilter.ts
import type { Middleware } from "@/core/types";

export interface IpFilterOptions {
  allow?: string[]; // whitelist CIDR or exact IPs
  deny?: string[]; // blacklist CIDR or exact IPs
  headers?: string[]; // headers to trust for client ip
  trustProxy?: boolean; // if true, prefer x-forwarded-for chain
}

function ipFromCtx(ctx: any, headers?: string[], trustProxy?: boolean): string | undefined {
  const hlist = headers && headers.length ? headers : ["x-forwarded-for", "x-real-ip"];
  if (trustProxy) {
    const xf = ctx.get(hlist[0]);
    if (xf) {
      // first in list is original client ip
      return xf.split(",")[0].trim();
    }
  }
  for (const h of hlist) {
    const v = ctx.get(h);
    if (v) return v.split(",")[0].trim();
  }
  // Fall back to adapter-provided ip if any
  return (ctx as any).ip || undefined;
}

function matchIp(ip: string, patterns: string[]): boolean {
  for (const p of patterns) {
    if (p.includes("/")) {
      // naive CIDR match v4 only
      const [base, bitsStr] = p.split("/");
      const bits = Number(bitsStr);
      const ipNum = ipv4ToNum(ip);
      const baseNum = ipv4ToNum(base);
      if (ipNum != null && baseNum != null) {
        const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
        if ((ipNum & mask) === (baseNum & mask)) return true;
      }
    } else if (p === ip) return true;
  }
  return false;
}

function ipv4ToNum(ip: string): number | null {
  const parts = ip.split(".").map((x) => Number(x));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export const ipFilter = (opts: IpFilterOptions): Middleware => {
  const { allow, deny, headers, trustProxy } = opts;

  if (!allow && !deny) throw new Error("ipFilter requires allow and/or deny list");

  return async (ctx, next) => {
    const ip = ipFromCtx(ctx, headers, trustProxy);
    if (!ip) return new Response("Forbidden", { status: 403 });

    if (deny && matchIp(ip, deny)) return new Response("Forbidden", { status: 403 });
    if (allow && !matchIp(ip, allow)) return new Response("Forbidden", { status: 403 });

    return next();
  };
};
