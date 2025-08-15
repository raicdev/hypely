import type { Context, Adapter } from "../core/types";
import { App } from "../core/app";

export const vercelAdapter: Adapter = {
  name: "vercel",
  listen: () => {
    throw new Error("Vercel adapter does not support listen(). Use as a handler.");
  },
  fill(ctx: Context, req: Request) {
    ctx.method = req.method as any;
    ctx.url = new URL(req.url, `http://${req.headers.get("host") ?? "localhost"}`);
    ctx.params = {};
  const xf = req.headers.get("x-forwarded-for");
  const xr = req.headers.get("x-real-ip");
  ctx.ip = (xf ? xf.split(",")[0].trim() : (xr ?? undefined)) as any;
    // Snapshot all request headers into a plain object
    ctx.headers = (() => {
      const out: Record<string, string> = Object.create(null);
      req.headers.forEach((v, k) => { out[k] = v; });
      return out;
    })();
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
    ctx.response = undefined as any;

    ctx.get = (k: string) => req.headers.get(k) ?? undefined;
  ctx.responseHeaders = ctx.responseHeaders ?? Object.create(null);
  ctx.responseCookies = ctx.responseCookies ?? [];
  ctx.set = (k: string, v: string) => { ctx.responseHeaders[k] = v; };
    // Cookies (object API)
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
    const setCookie = (name: string, value: string, options?: any) => {
      const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
      if (options) {
        if (options.path) parts.push(`Path=${options.path}`);
        if (options.domain) parts.push(`Domain=${options.domain}`);
        if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
        if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
        if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
        if (options.secure) parts.push(`Secure`);
        if (options.httpOnly) parts.push(`HttpOnly`);
      }
      const cookieStr = parts.join("; ");
      ctx.responseCookies!.push(cookieStr);
    };
    ctx.cookies = {
      get: (name: string) => parseCookies()[name],
      all: () => parseCookies(),
      set: setCookie,
    };
    // Body readers (local)
    let bodyText: Promise<string> | null = null;
    let bodyArray: Promise<ArrayBuffer> | null = null;
    const readText = () => (bodyText ??= req.text());
    const readArrayBuffer = () => (bodyArray ??= req.arrayBuffer());
    const readJSON = async <T = unknown>() => {
      const txt = await readText();
      if (!txt) return undefined as unknown as T;
      return JSON.parse(txt) as T;
    };
    const readForm = async () => {
      const ct = ctx.get("content-type") || "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const txt = await readText();
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
    const applySetCookie = (hdrs: Headers) => {
      for (const c of ctx.responseCookies!) hdrs.append("Set-Cookie", c);
    };
    ctx.text = (s, status = 200) => {
      ctx.responded = true;
      const hdrs = new Headers(ctx.responseHeaders);
      if (!hdrs.has("content-type")) hdrs.set("Content-Type", "text/plain; charset=utf-8");
      applySetCookie(hdrs);
      ctx.response = new Response(s, { status, headers: hdrs });
      return ctx.response;
    };
    ctx.json = (obj, status = 200) => {
      ctx.responded = true;
      const hdrs = new Headers(ctx.responseHeaders);
      if (!hdrs.has("content-type")) hdrs.set("Content-Type", "application/json; charset=utf-8");
      applySetCookie(hdrs);
      const payload = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
      ctx.response = new Response(payload, { status, headers: hdrs });
      return ctx.response;
    };
    ctx.req = {
      url: ctx.url,
      method: ctx.method,
      params: ctx.params,
      query: ctx.query,
      get: ctx.get,
      text: readText,
      json: readJSON,
      arrayBuffer: readArrayBuffer,
      form: readForm,
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

export const vercel = (app: App) => {
  return async (req: Request) => {
    return await app.handler(req, vercelAdapter);
  };
};
