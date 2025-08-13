// adapters/deno.ts
import type { App } from "@/core/app";
import type { BufferFastEntry, Context } from "@/core/types";
import chalk from "chalk";

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
        ctx.query = {} as any;
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
    const listeningLog = (path: string) => console.log(chalk.green("[deno]"), chalk.cyan(`listening on ${path}`));
    if (typeof optsOrPort === "number") {
        return D.serve({ port: optsOrPort, onListen({ path }: { path: string }) { listeningLog(path); } }, handler);
    }
    return D.serve(optsOrPort ?? { onListen({ path }: { path: string }) { listeningLog(path); } }, handler);
}