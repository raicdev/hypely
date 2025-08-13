// src/core/app.ts
import type { Context, Handler, Method, Adapter } from "./types";
import { createRouter } from "./router";
import { acquireCtx, releaseCtx } from "../utils/pool";
import { createServer } from "node:http";

function headersToObject(h: Headers | Record<string, string> | undefined): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return { ...h };
}

export class App {
  #router = createRouter();

  /**
   * Get the root node of the router.
   * @returns The root node of the router.
   */
  getRouter() {
    return this.#router.root;
  }

  /**
   * Add a route to the router.
   * @param method The HTTP method to match.
   * @param path The path to match.
   * @param handlers The handlers to call when the route is matched.
   * @returns The current App instance.
   */
  on(method: Method, path: string, ...handlers: Handler[]) {
    this.#router.add(method, path, handlers);
    return this;
  }

  /**
   * The request handler that is called by the adapter.
   * This function sets up the Context object and runs the router dispatch.
   * @param req The request object.
   * @param adapter The adapter object.
   * @param res The response object, if any.
   * @returns A Promise that resolves to a Response object.
   */
  async handler(req: any, adapter: Adapter, res?: any): Promise<Response> {
    const ctx = acquireCtx() as Context;

    if (adapter.fill.length === 3 && res !== undefined) {
      adapter.fill(ctx, req, res);
    } else {
      adapter.fill(ctx, req);
    }

    try {
      const dispatchResult = await this.#router.dispatch(ctx, async () => { });
      if (dispatchResult && dispatchResult instanceof Response) {
        return dispatchResult;
      }
      const notFoundResp = adapter.notFound();
      return notFoundResp instanceof Response ? notFoundResp : new Response(null, { status: 404 });
    } catch (e) {
      adapter.error(res ?? null, e);
      return new Response("Internal Server Error", { status: 500 });
    } finally {
      releaseCtx(ctx);
    }
  }

  /**
   * Listens on the specified port and adapter.
   * @param adapter The adapter instance to use.
   * @param port The port number to listen on. Defaults to 3000.
   */
  listen(port = 3000) {
    // Node.js adapter implementation (no fast mode)
    const server = createServer(async (req: any, res: any) => {
      try {
        const result = await this.handler(req, {
          name: "node",
          listen() { /* not used here */ },
          fill(ctx: any, req: any, res?: any) {
            ctx.adapter = "node";
            ctx.resNative = res;
            ctx.method = req.method;
            ctx.url = new URL(req.url || "/", "http://localhost");
            ctx.params = {};
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
            ctx.get = (k: string) => {
              const key = k.toLowerCase();
              const v = (req.headers as Record<string, string | string[] | undefined>)[key];
              if (Array.isArray(v)) return v.join(", ");
              return v;
            };
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
            let bodyPromise: Promise<Buffer> | null = null;
            const readRaw = (): Promise<Buffer> => {
              if (bodyPromise) return bodyPromise;
              bodyPromise = new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                req.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
                req.on("end", () => resolve(Buffer.concat(chunks)));
                req.on("error", reject);
              });
              return bodyPromise;
            };
            ctx.readArrayBuffer = async () => {
              const buf = await readRaw();
              return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
            };
            ctx.readText = async () => {
              const buf = await readRaw();
              return buf.toString("utf8");
            };
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
                sp.forEach((_, k) => seen.add(k));
                for (const k of seen) {
                  const all = sp.getAll(k);
                  out[k] = all.length <= 1 ? (all[0] ?? "") : all;
                }
                return out;
              }
              return {} as Record<string, string | string[]>;
            };
            ctx.set = (k: string, v: string) => res?.setHeader(k, v);
            ctx.text = (s: string, status = 200) => {
              const b = Buffer.from(s);
              res?.writeHead(status, {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Length": String(b.byteLength),
                Connection: "keep-alive",
              });
              res?.end(b);
            };
            ctx.json = (obj: unknown, status = 200) => {
              const s = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
              const b = Buffer.from(s);
              res?.writeHead(status, {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Length": String(b.byteLength),
                Connection: "keep-alive",
              });
              res?.end(b);
            }
          },
          notFound(res?: any) {
            if (!res || res.headersSent) return;
            const b = Buffer.from("Not Found");
            res.writeHead(404, {
              "Content-Type": "text/plain; charset=utf-8",
              "Content-Length": String(b.byteLength),
              Connection: "keep-alive",
            });
            res.end(b);
          },
          error(res: any, e: unknown) {
            console.error(e);
            if (!res || res.headersSent) return;
            const b = Buffer.from("Internal Server Error");
            res.writeHead(500, {
              "Content-Type": "text/plain; charset=utf-8",
              "Content-Length": String(b.byteLength),
              Connection: "keep-alive",
            });
            res.end(b);
          },
        }, res);
        if (result instanceof Response && !res.headersSent) {
          const headersObj = headersToObject(result.headers);
          const buf = Buffer.from(await result.arrayBuffer());
          if (!headersObj["content-length"]) {
            headersObj["Content-Length"] = String(buf.byteLength);
          }
          res.writeHead(result.status, { Connection: "keep-alive", ...headersObj });
          res.end(buf);
        }
      } catch (e) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    });
    server.on("connection", (socket: any) => {
      socket.setNoDelay(true);
      socket.setKeepAlive(true, 60_000);
    });
    server.keepAliveTimeout = 60_000;
    server.headersTimeout = 65_000;
    server.requestTimeout = 60_000;
    server.listen(port);
    console.log(`[node] listening on ${port}`);
  }
}
