import { BufferFastEntry } from "@/core/types";
import { IncomingMessage, ServerResponse } from "node:http";
export declare const nodeAdapter: {
    name: string;
    listen(port: number, handler: (req: IncomingMessage, res: ServerResponse) => void, fastMap?: Map<string, BufferFastEntry | Response>): void;
    fill(ctx: any, req: IncomingMessage, res?: ServerResponse): void;
    notFound(res?: ServerResponse): void;
    error(res: ServerResponse, e: unknown): void;
};
