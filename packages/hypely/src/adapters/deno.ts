// adapters/deno.ts
import type { App } from "@/core/app";
import type { BufferFastEntry, Context } from "@/core/types";
const color = {
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
};

export const denoAdapter = {
    name: "deno",

    // Deno runtime supports serving; use inside Deno only.
    listen(port: number, onReq: (req: Request) => Promise<Response>) {
        const D = (globalThis as any).Deno;
        if (!D || typeof D.serve !== "function") {
            throw new Error("denoAdapter.listen requires Deno.serve to be available (run inside Deno runtime)");
        }
        D.serve({ port }, (req: Request) => onReq(req));
    },

    fill(ctx: Context, req: Request) {
        ctx.adapter = "deno";
        ctx.method = req.method as any;
        ctx.url = new URL(req.url);
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
        ctx.response = undefined as any;

    ctx.get = (k: string) => req.headers.get(k) ?? undefined;
        ctx.set = () => { /* no-op until Response is returned */ };
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
            const payload = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
            ctx.response = new Response(payload, {
                status,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            });
            return ctx.response;
        };
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

export function denoFetch(app: App) {
    return async (req: Request, _info?: unknown) => {
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
        return app.handler(req, denoAdapter);
    };
}

export function deno(app: App, optsOrPort?: number | Record<string, unknown>) {
    const D = (globalThis as any).Deno;
    if (!D || typeof D.serve !== "function") {
        throw new Error("deno.serve requires Deno.serve to be available (run inside Deno runtime)");
    }
    const handler = denoFetch(app);
        const listeningLog = (path: string) => {
            try { console.log(color.green("[deno]"), color.cyan(`listening on ${path}`)); }
            catch { console.log(`[deno] listening on ${path}`); }
        };
    if (typeof optsOrPort === "number") {
        return D.serve({ port: optsOrPort, onListen({ path }: { path: string }) { listeningLog(path); } }, handler);
    }
    return D.serve(optsOrPort ?? { onListen({ path }: { path: string }) { listeningLog(path); } }, handler);
}