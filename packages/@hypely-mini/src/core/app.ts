// src/core/app.ts
import type { Context, Handler, Method, Adapter } from "./types";
import { createRouter } from "./router";
import { acquireCtx, releaseCtx } from "../utils/pool";

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
  listen(adapter: Adapter, port = 3000) {
    // Minimal log without external deps
    console.log(`[${adapter.name}] listening on ${port}`);

    if (adapter.name === "bun") {
      adapter.listen(port, async (req: Request) => {
        return await this.handler(req, adapter);
      });
    }

    else {
      // Node: transform to async and ensure it returns Promise<Response>
      adapter.listen(port, async (req: Request, res: import("http").ServerResponse) => {
        return await this.handler(req, adapter, res);
      });
    }
  }
}
