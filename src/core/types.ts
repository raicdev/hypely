// src/core/types.ts
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export type Next = () => Promise<Response | void>;
export type Handler = (ctx: Context, next: Next) => Promise<Response | void> | Response | void;
export type FastHandler = () => Response | BufferFastEntry;
export type BufferFastEntry = {
  raw: true;
  body: Uint8Array;
  headers: Record<string, string>;
  status: number;
};

export type Middleware = Handler;
export type Adapter = {
  name: string;
  fill: (ctx: Context, req: Request | any, res?: any) => void;
  notFound: (...args: any[]) => void | Response | Promise<Response>;
  error: (res: any, e: unknown) => void;
  listen: (port: number, handler: (req: any, res?: any) => Promise<Response>) => void;
  responseFromContext?: (ctx: Context) => Response;
};

export interface Context {
  url: URL;
  method: Method;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  state: Record<string, unknown>;
  set(h: string, v: string): void;
  text(s: string, status?: number): Response;
  json(d: unknown, status?: number): Response;
  stringify?: (d: unknown) => string;
  responded: boolean;
  adapter?: "node" | "bun";
  resNative?: unknown;
  response?: Response;
}
