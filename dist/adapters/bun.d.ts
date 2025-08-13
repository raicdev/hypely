import type { Context } from "../core/types";
export declare const bunAdapter: {
    name: string;
    listen(port: number, onReq: (req: Request) => Promise<Response>, fastMap?: Record<string, Response>): void;
    fill(ctx: Context, req: Request): void;
    responseFromContext(ctx: Context): Response;
    notFound(): Response;
    error(_res: any, e: unknown): Response;
};
