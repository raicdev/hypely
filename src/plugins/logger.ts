// src/plugins/logger.ts
import type { Middleware } from "@/core/types";
import chalk from "chalk";

export const METHOD_COLORS = {
  GET: chalk.green,
  POST: chalk.blue,
  PUT: chalk.yellow,
  DELETE: chalk.red,
  PATCH: chalk.magenta,
  OPTIONS: chalk.cyan,
};

export const TIME_COLORS = {
  slow: chalk.red,
  medium: chalk.yellow,
  fast: chalk.green,
};

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

  const colorFn = METHOD_COLORS[ctx.method as keyof typeof METHOD_COLORS] || chalk.white;
  const timeFn = TIME_COLORS[time < 700 ? "fast" : time < 2000 ? "medium" : "slow"];
  console.log(`${colorFn(ctx.method)} ${ctx.url.pathname} ${timeFn(time + "ms")}`);
  return result ?? new Response("Not Found", { status: 404 });
};
