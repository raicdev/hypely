// src/core/types.ts
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export type Next = () => Promise<Response | void>;
export type Handler = (ctx: Context, next: Next) => Promise<Response | void> | Response | void;

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
  // Get a request header (case-insensitive). Returns undefined if missing.
  get(h: string): string | undefined;
  // Request body helpers
  readText(): Promise<string>;
  readJSON<T = unknown>(): Promise<T>;
  readArrayBuffer(): Promise<ArrayBuffer>;
  readForm(): Promise<Record<string, string | string[]>>;
  // Cookie helpers
  getCookie(name: string): string | undefined;
  cookies(): Record<string, string>;
  set(h: string, v: string): void;
  text(s: string, status?: number): Response;
  json(d: unknown, status?: number): Response;
  stringify?: (d: unknown) => string;
  responded: boolean;
  adapter?: "node" | "bun" | "edge" | "deno";
  resNative?: unknown;
  response?: Response;
}
