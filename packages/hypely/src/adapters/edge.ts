// adapters/edge.ts
import type { BufferFastEntry, Context } from "@/core/types";
import type { App } from "@/core/app";
import chalk from "chalk";

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
        ctx.query = {} as any;
        ctx.state = {};
        ctx.responded = false;
        ctx.response = undefined as any;

    ctx.get = (k: string) => req.headers.get(k) ?? undefined;
        ctx.set = () => { /* no-op on edge Response until returned */ };
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

const listeningLog = (path: string) => console.log(chalk.green("[edge]"), chalk.cyan(`listening on ${path}`));

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
