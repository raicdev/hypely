// adapters/bun.ts
import type { Context, Method } from "../core/types";

export const bunAdapter = {
  name: "bun",
  // adapters/bun.ts
  listen(port: number, onReq: (req: Request) => Promise<Response>, fastMap?: Record<string, Response>) {
    Bun.serve({
      port,
      fetch(req: Request) {
        if (fastMap && req.method === "GET") {
          const pathStart = req.url.indexOf("/", 8); // skip "http://x"
          const path = req.url.slice(pathStart);
          const fastResp = fastMap[path];
          if (fastResp) return fastResp; // Responseをそのまま返す
        }
        return onReq(req);
      }
    });
  },
  fill(ctx: Context, req: Request) {
    ctx.method = req.method as any;
    ctx.url = new URL(req.url, `http://${req.headers.get("host")}`);
    ctx.params = {};
    // Query parse
    ctx.query = (() => {
      const out: Record<string, string | string[]> = Object.create(null);
      const sp = ctx.url.searchParams;
      const seen = new Set<string>();
      sp.forEach((_: string, k: string) => seen.add(k));
      for (const k of seen) {
        const all = sp.getAll(k);
        out[k] = all.length <= 1 ? (all[0] ?? "") : all;
      }
      return out;
    })();
    ctx.state = {};
    ctx.responded = false;
    ctx.response = undefined as any; // ← 追加

  ctx.get = (k: string) => req.headers.get(k) ?? undefined;
    // Cookies
    let cookieCache: Record<string, string> | null = null;
    const parseCookies = () => {
      if (cookieCache) return cookieCache;
      const hdr = ctx.get("cookie");
      const out: Record<string, string> = Object.create(null);
      if (hdr) {
        const parts = hdr.split(/;\s*/);
        for (const p of parts) {
          if (!p) continue;
          const eq = p.indexOf("=");
          if (eq === -1) continue;
          const name = p.slice(0, eq).trim();
          const val = p.slice(eq + 1).trim();
          out[name] = decodeURIComponent(val);
        }
      }
      cookieCache = out;
      return out;
    };
    ctx.cookies = () => parseCookies();
    ctx.getCookie = (name: string) => parseCookies()[name];
    // Body readers
    let bodyText: Promise<string> | null = null;
    let bodyArray: Promise<ArrayBuffer> | null = null;
    ctx.readText = () => (bodyText ??= req.text());
    ctx.readArrayBuffer = () => (bodyArray ??= req.arrayBuffer());
    ctx.readJSON = async <T = unknown>() => {
      const txt = await ctx.readText();
      if (!txt) return undefined as unknown as T;
      return JSON.parse(txt) as T;
    };
    ctx.readForm = async () => {
      const ct = ctx.get("content-type") || "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const txt = await ctx.readText();
        const out: Record<string, string | string[]> = Object.create(null);
        const sp = new URLSearchParams(txt);
        const seen = new Set<string>();
        sp.forEach((_: string, k: string) => seen.add(k));
        for (const k of seen) {
          const all = sp.getAll(k);
          out[k] = all.length <= 1 ? (all[0] ?? "") : all;
        }
        return out;
      }
      if (ct.includes("multipart/form-data")) {
        const form = await req.formData();
        const out: Record<string, string | string[]> = Object.create(null);
        for (const key of form.keys()) {
          const all = form.getAll(key);
          const texts = all.map(v => (typeof v === "string" ? v : (v as File).name));
          out[key] = texts.length <= 1 ? (texts[0] ?? "") : texts;
        }
        return out;
      }
      return {} as Record<string, string | string[]>;
    };
    ctx.set = () => { };
    ctx.text = (s, status = 200) => {
      ctx.responded = true;
      ctx.response = new Response(s, {
        status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
      return ctx.response;
    };
    ctx.json = (obj, status = 200) => {
      ctx.responded = true;
      ctx.response = new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
      return ctx.response;
    };
    // Structured accessors
    ctx.req = {
      url: ctx.url,
      method: ctx.method,
      params: ctx.params,
      query: ctx.query,
      get: ctx.get,
      readText: ctx.readText,
      readJSON: ctx.readJSON,
      readArrayBuffer: ctx.readArrayBuffer,
      readForm: ctx.readForm,
      getCookie: ctx.getCookie,
      cookies: ctx.cookies,
    } as any;
    ctx.res = {
      set: ctx.set,
      text: ctx.text,
      json: ctx.json,
    } as any;
  },
  responseFromContext(ctx: Context) {
    return ctx.response ?? new Response(null, { status: 204 });
  },
  notFound() {
    return new Response("Not Found", { status: 404 });
  },
  error(_res: any, e: unknown) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  },
};
