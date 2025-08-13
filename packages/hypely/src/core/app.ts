// src/core/app.ts
import type { Middleware, Context, Handler, Method, Adapter, BufferFastEntry, FastHandler } from "./types";
import { createRouter } from "./router";
import { acquireCtx, releaseCtx } from "../utils/pool";
import chalk from "chalk";

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
  #middlewares: Middleware[] = [];
  #router = createRouter();

  /**
   * Get the root node of the router.
   * @returns The root node of the router.
   */
  getRouter() {
    return this.#router.root;
  }

  fastRoutes = new Map<string, FastHandler>();

  /**
   * Use a middleware function to handle the request.
   * @param mw A middleware function.
   * @returns The current App instance.
   */
  use(mw: Middleware) {
    this.#middlewares.push(mw);
    return this;
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
   * Add a fast route to the router.
   * A fast route is a route that directly calls the handler function
   * without going through the middleware stack.
   * @param method The HTTP method to match.
   * @param path The path to match.
   * @param handler The handler function to call when the route is matched.
   * @returns The current App instance.
   */
  fast(
    method: Method,
    path: string,
    handler: Response | BufferFastEntry | (() => Response | BufferFastEntry)
  ) {
    const key = method.toUpperCase() + " " + path;
    if (typeof handler === "function") {
      this.fastRoutes.set(key, handler as () => Response | BufferFastEntry);
    } else {
      this.fastRoutes.set(key, () => handler);
    }
    return this;
  }



  /**
   * Builds the middleware pipeline.
   * @returns A function that takes a Context and a final handler function,
   * and returns a Promise that resolves to a Response.
   */
  buildPipeline() {
    const chain = this.#middlewares;
    return async (ctx: Context, last: () => Promise<Response | void>): Promise<Response> => {
      let idx = -1;
      const dispatch = async (i: number): Promise<Response | void> => {
        if (i <= idx) throw new Error("next() called multiple times");
        idx = i;
        const fn = i < chain.length ? chain[i] : null;
        if (!fn) return last();
        const out = await fn(ctx, () => dispatch(i + 1));
        if (out && typeof out === "object" && "status" in out) return out;
        return last();
      };
      const result = await dispatch(0);
      if (result && typeof result === "object" && "status" in result) return result;
      return new Response(null, { status: 204 });
    };
  }

  #pipeline = this.buildPipeline();

  /**
   * The request handler that is called by the adapter.
   * This function sets up the Context object and runs the middleware pipeline.
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
      const result = await this.#pipeline(ctx, async () => {
        const dispatchResult = await this.#router.dispatch(ctx, async () => { });
        if (dispatchResult && dispatchResult instanceof Response) {
          return dispatchResult;
        }
        return adapter.notFound();
      });
      return result;
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
  listen(adapter: Adapter, port = 3000) {
    console.log(chalk.green(`[${adapter.name}]`), chalk.cyan(`listening on ${port}`));

    const fastMap = this.fastRoutes;

    if (adapter.name === "bun") {
      adapter.listen(port, async (req: Request) => {
        const key = req.method + " " + new URL(req.url).pathname;
        if (fastMap.has(key)) {
          const fastHandler = fastMap.get(key)!;

          // Call the fast handler if it's a function, otherwise return it as is
          const resp = typeof fastHandler === "function" ? fastHandler() : fastHandler;

          // Handle BufferFastEntry
          if (resp && (resp as any).raw) {
            return new Response((resp as any).body, {
              status: (resp as any).status,
              headers: (resp as any).headers
            });
          }

          // Response ならそのまま返す
          return resp as Response;
        }

        return await this.handler(req, adapter);
      });
    }

    else {
      // Node: transform to async and ensure it returns Promise<Response>
      adapter.listen(port, async (req: Request, res: import("http").ServerResponse) => {
        const key = req.method + " " + req.url;

        const fastHandler = fastMap.get(key);
        if (fastHandler) {
          const resp = fastHandler();

          // Handle BufferFastEntry
          if (resp && "body" in (resp as BufferFastEntry) && Buffer.isBuffer((resp as BufferFastEntry).body)) {
            const entry = resp as BufferFastEntry;
            res.writeHead(entry.status, headersToObject(entry.headers));
            res.end(entry.body);
            return new Response(null, { status: entry.status, headers: entry.headers });
          }

          // Response
          if (resp instanceof Response) {
            res.writeHead(resp.status, headersToObject(resp.headers));
            const buf = await resp.arrayBuffer();
            res.end(Buffer.from(buf));
            return resp;
          }

          // Unexpected
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
          return new Response("Internal Server Error", { status: 500 });
        }

        return await this.handler(req, adapter, res);
      });
    }
  }
}
