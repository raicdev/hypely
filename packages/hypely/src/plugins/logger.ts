// src/plugins/logger.ts
import type { Middleware } from "@/core/types";

export const color = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
};

export const METHOD_COLORS = {
  GET: color.green,
  POST: color.blue,
  PUT: color.yellow,
  DELETE: color.red,
  PATCH: color.magenta,
  OPTIONS: color.cyan,
};

export const TIME_COLORS = {
  slow: color.red,
  medium: color.yellow,
  fast: color.green,
};

const STATUS_TEXT: Record<number, string> = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  410: "Gone",
  415: "Unsupported Media Type",
  418: "I'm a teapot",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

const statusColor = (status: number) =>
  status >= 500 ? color.red : status >= 400 ? color.red : status >= 300 ? color.cyan : color.green;

/**
 * Middleware that logs HTTP request method, URL path, and response time.
 * 
 * This middleware captures the start time before processing the next middleware
 * or handler. After completion, it calculates the elapsed time and logs the 
 * request method, URL pathname, and response time, using color coding for
 * methods and time categories (fast, medium, slow).
 * 
 * The time thresholds for categorization are:
 * - Fast: less than 700 ms
 * - Medium: between 700 ms and 2000 ms
 * - Slow: greater than 2000 ms
 * 
 * If the result from the next middleware is undefined, it returns a 404 
 * "Not Found" response.
 */

export const logger = (): Middleware => async (ctx, next) => {
  const t = performance.now();
  const result = await next();
  const time = Math.round(performance.now() - t);

  // Resolve final status and text across adapters
  let status = 404;
  let statusText = STATUS_TEXT[status];

  // Prefer the Response returned by downstream
  const resp = (result instanceof Response
    ? result
    : (ctx as any).response instanceof Response
      ? (ctx as any).response
      : undefined) as Response | undefined;

  if (resp) {
    status = resp.status;
    statusText = resp.statusText || STATUS_TEXT[status] || "";
  } else if ((ctx as any).adapter === "node" && (ctx as any).resNative) {
    const resNative = (ctx as any).resNative as { statusCode?: number; statusMessage?: string };
    if (typeof resNative.statusCode === "number") {
      status = resNative.statusCode;
      statusText = resNative.statusMessage || STATUS_TEXT[status] || "";
    }
  }

  const methodColor = METHOD_COLORS[ctx.method as keyof typeof METHOD_COLORS] || color.white;
  const timeFn = TIME_COLORS[time < 700 ? "fast" : time < 2000 ? "medium" : "slow"];
  const sc = statusColor(status);

  // e.g. GET / 200 OK (3ms)
  console.log(
    `${methodColor(ctx.method)} ${ctx.url.pathname} ${sc(`${status} ${statusText || ""}`)} ${timeFn(`(${time}ms)`)}`
  );

  return result ?? new Response("Not Found", { status: 404 });
};
