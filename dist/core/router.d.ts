import type { Context, Handler, Method } from "./types";
export type Node = {
    prefix: string;
    children: Node[];
    paramChild?: Node;
    wildcardChild?: Node;
    handlers?: Partial<Record<Method, Handler[]>>;
    paramName?: string;
};
export declare function createRouter(): {
    add: (method: Method, path: string, handlers: Handler[]) => void;
    dispatch: (ctx: Context, next: () => Promise<void>) => Promise<void | Response>;
    root: Node;
};
