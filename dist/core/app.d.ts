import type { Middleware, Context, Handler, Method, Adapter, BufferFastEntry, FastHandler } from "./types";
export declare class App {
    #private;
    getRouter(): import("./router").Node;
    fastRoutes: Map<string, FastHandler>;
    use(mw: Middleware): this;
    on(method: Method, path: string, ...handlers: Handler[]): this;
    /** fast mode 登録 */
    fast(method: Method, path: string, handler: Response | BufferFastEntry | (() => Response | BufferFastEntry)): this;
    buildPipeline(): (ctx: Context, last: () => Promise<Response | void>) => Promise<Response>;
    handler(req: any, adapter: Adapter, res?: any): Promise<Response>;
    listen(adapter: Adapter, port?: number): void;
}
