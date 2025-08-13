// src/core/router.ts
import type { Context, Handler, Method } from "./types";

export type Node = {
    prefix: string;
    children: Node[];
    paramChild?: Node;      // :id
    wildcardChild?: Node;   // *
    handlers?: Partial<Record<Method, Handler[]>>;
    paramName?: string;
};



/**
 * Creates a router object that allows adding new routes and dispatching
 * requests to the appropriate handlers.
 *
 * The router supports static, dynamic, and wildcard routes. It allows
 * registering handlers for different HTTP methods on specified paths.
 * Dynamic segments in paths are marked with a colon (e.g., "/:id") and
 * wildcard segments with an asterisk (e.g., "/*").
 *
 * @returns An object containing the following methods:
 * - `add`: Adds a new route with a method, path, and handler(s).
 * - `dispatch`: Dispatches the request to the appropriate handler based on the context.
 * - `root`: The root node of the routing tree.
 */

export function createRouter() {
    const root: Node = { prefix: "", children: [] };

    function add(method: Method, path: string, handlers: Handler[]) {
        // Normalize path
        if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
        insert(root, path, method, handlers);
    }

    function insert(node: Node, path: string, method: Method, handlers: Handler[]) {
        // Parameter or wildcard branches
        if (path === "") {
            const map = (node.handlers ??= {} as Partial<Record<Method, Handler[]>>);
            map[method.toUpperCase() as Method] = handlers;
            return;
        }
        // If the segment is /:param
        if ((path[0] === "/" && path[1] === ":") || path[0] === ":") {
            // Ignore the leading slash and extract the param name
            const start = path[0] === ":" ? 0 : 1;
            const nextSlash = path.indexOf("/", start);
            const seg = nextSlash === -1 ? path.slice(start) : path.slice(start, nextSlash);
            const paramName = seg.startsWith(":") ? seg.slice(1) : seg;
            node.paramChild ??= { prefix: "", children: [], paramName };
            const rest = nextSlash === -1 ? "" : path.slice(nextSlash);
            insert(node.paramChild, rest, method, handlers);
            return;
        }
        if (path[0] === "*") {
            node.wildcardChild ??= { prefix: "", children: [] };
            const map = (node.wildcardChild.handlers ??= {} as Partial<Record<Method, Handler[]>>);
            map[method] = handlers;
            return;
        }
        // Static routes
        let child = node.children.find(c => path.startsWith(c.prefix));
        if (!child) {
            // New node (combine up to the next slash into the prefix)
            const nextSlash = path.indexOf("/", 1);
            const pref = nextSlash === -1 ? path : path.slice(0, nextSlash);
            child = { prefix: pref, children: [] };
            node.children.push(child);
        }
        const rest = path.slice(child.prefix.length);
        insert(child, rest, method, handlers);
    }

    async function dispatch(ctx: Context, next: () => Promise<void>) {
        const pathname = ctx.url.pathname;
        let params = ctx.params;
        let node = root;
        let i = 0;

        while (i < pathname.length) {
            // Static segments
            const child = node.children.find(c => pathname.startsWith(c.prefix, i));
            if (child) { i += child.prefix.length; node = child; continue; }
            // Dynamic :param
            if (node.paramChild) {
                const slash = pathname.indexOf("/", i + 1);
                const end = slash === -1 ? pathname.length : slash;
                params[node.paramChild.paramName!] = decodeURIComponent(pathname.slice(i + 1, end));
                i = end;
                node = node.paramChild;
                continue;
            }
            break;
        }

        // Check if the entire path has been consumed
        const done = i === pathname.length;
        const handlers =
            (done ? (node.handlers && node.handlers[ctx.method]) : undefined) ||
            (node.wildcardChild?.handlers && node.wildcardChild.handlers[ctx.method]);

        if (handlers) {
            // Middleware chain
            let idx = -1;
            const run = async (): Promise<Response> => {
                idx++;
                if (idx < handlers.length) {
                    const result = await handlers[idx](ctx, run);
                    if (result) return result;
                    // If the result is undefined, continue to the next handler
                    return new Response(null, { status: 204 });
                }
                const nextResult = await next();
                if (typeof nextResult === 'object' && nextResult !== null && 'status' in nextResult) return nextResult;
                return new Response(null, { status: 204 });
            };
            return await run();
        }
        return await next();
    }

    return { add, dispatch, root };
}
