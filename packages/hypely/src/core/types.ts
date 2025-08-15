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

export interface CookieOptions {
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  maxAge?: number; // seconds
  expires?: Date;
}

export interface RequestContext {
  url: URL;
  method: Method;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  get(h: string): string | undefined;
  // New, fetch-like body readers on ctx.req
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  arrayBuffer(): Promise<ArrayBuffer>;
  form(): Promise<Record<string, string | string[]>>;
}

export interface ResponseContext {
  set(h: string, v: string): void;
  text(s: string, status?: number): Response;
  json(d: unknown, status?: number): Response;
}
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
  // Best-effort client IP, derived from headers (x-forwarded-for/x-real-ip) or connection info
  ip?: string;
  // All request headers as a plain, lower-cased key map. Values are comma-joined if multiple.
  headers: Record<string, string>;
  // Collected response headers set via ctx.set().
  responseHeaders: Record<string, string>;
  state: Record<string, unknown>;
  // Get a request header (case-insensitive). Returns undefined if missing.
  get(h: string): string | undefined;
  // Cookie helpers consolidated under ctx.cookies
  cookies: {
    get(name: string): string | undefined;
    all(): Record<string, string>;
    set(name: string, value: string, options?: CookieOptions): void;
  };
  set(h: string, v: string): void;
  text(s: string, status?: number): Response;
  json(d: unknown, status?: number): Response;
  stringify?: (d: unknown) => string;
  responded: boolean;
  // Accumulated Set-Cookie values to be applied on response creation
  responseCookies?: string[];
  adapter?: "node" | "bun" | "edge" | "deno";
  resNative?: unknown;
  response?: Response;
  // Structured accessors
  req: RequestContext;
  res: ResponseContext;
}
