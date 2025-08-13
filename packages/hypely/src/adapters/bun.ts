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
    ctx.state = {};
    ctx.responded = false;
    ctx.response = undefined as any; // ← 追加

  ctx.get = (k: string) => req.headers.get(k) ?? undefined;
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
