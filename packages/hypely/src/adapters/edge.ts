// adapters/edge.ts
import type { BufferFastEntry, Context } from "@/core/types";
import type { App } from "@/core/app";
import chalk from "chalk";
import { color } from "@/plugins";

// Edge runtime adapter (e.g., Vercel Edge, Cloudflare Workers, Deno Deploy)
// Usage: In your platform's fetch handler, call `app.handler(request, edgeAdapter)` and return the Response.
// Note: Edge environments don't listen on a port. The `listen` here will throw to avoid misuse.
export const edgeAdapter = {
    name: "edge",

    // Edge runtimes don't support listening on a TCP port.
    // Integrate by calling `app.handler(req, edgeAdapter)` inside your fetch handler.
    listen(_port: number, _onReq: (req: Request) => Promise<Response>) {
        throw new Error(
            "edgeAdapter.listen is not supported. Use your platform's fetch handler and call app.handler(req, edgeAdapter)."
        );
    },

    fill(ctx: Context, req: Request) {
        ctx.adapter = "edge";
        ctx.method = req.method as any;
        // URL is absolute in edge runtimes
        ctx.url = new URL(req.url);
        ctx.params = {};
    // Best-effort IP from platform-provided headers
    const xf = req.headers.get("x-forwarded-for");
    const xr = req.headers.get("x-real-ip");
    ctx.ip = (xf ? xf.split(",")[0].trim() : (xr ?? undefined)) as any;
        // Snapshot all request headers into a plain object
        ctx.headers = (() => {
            const out: Record<string, string> = Object.create(null);
            req.headers.forEach((v, k) => { out[k] = v; });
            return out;
        })();
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
        ctx.response = undefined as any;

        ctx.get = (k: string) => req.headers.get(k) ?? undefined;
        // Accumulate response headers and cookies and apply when creating Response
        ctx.responseHeaders = ctx.responseHeaders ?? Object.create(null);
        ctx.responseCookies = ctx.responseCookies ?? [];
        ctx.set = (k: string, v: string) => { ctx.responseHeaders[k] = v; };
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
            const payload = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
            const hdrs = new Headers(ctx.responseHeaders);
            if (!hdrs.has("content-type")) hdrs.set("Content-Type", "application/json; charset=utf-8");
            applySetCookie(hdrs);
            ctx.response = new Response(payload, { status, headers: hdrs });
            return ctx.response;
        };
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
        ctx.cookies = {
            get: (name: string) => parseCookies()[name],
            all: () => parseCookies(),
            set: (name: string, value: string, options?: any) => {
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
            },
        };
        // Body readers
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

const listeningLog = (path: string) => console.log(color.green("[edge]"), color.cyan(`listening on ${path}`));

// Create a platform-agnostic Edge fetch handler from an App
export function edgeFetch(app: App) {
    return async (req: Request, _env?: unknown, _ctx?: unknown) => {
        // Fast path like Bun/Node adapters
        const key = req.method + " " + new URL(req.url).pathname;
        const fastHandler = (app as any).fastRoutes?.get?.(key) as
            | (() => Response | BufferFastEntry)
            | undefined;
        if (fastHandler) {
            const resp = fastHandler();
            if (resp && (resp as any).raw) {
                const entry = resp as BufferFastEntry;
                return new Response(entry.body as unknown as BodyInit, { status: entry.status, headers: entry.headers });
            }
            if (resp instanceof Response) return resp;
        }
        return app.handler(req, edgeAdapter);
    };
}

// Return an object suitable for `export default` on platforms that expect `{ fetch }`
export function edgeObject(app: App) {
    listeningLog("edgeObject");
    return { fetch: edgeFetch(app) } as const;
}

// Mutate the app to have a `fetch` method so you can `export default app`
export function enableEdge(app: App) {
    listeningLog("enableEdge");
    (app as any).fetch = edgeFetch(app);
    return app as App & { fetch: (req: Request, env?: unknown, ctx?: unknown) => Promise<Response> };
}

// Namespaced helper: edge.fetch(app), edge.object(app), edge.enable(app), edge.adapter
export const edge = {
    adapter: edgeAdapter,
    fetch: edgeFetch,
    object: edgeObject,
    enable: enableEdge,
} as const;
