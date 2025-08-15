// src/utils/pool.ts
import type { Context } from "@/core/types";

const pool: Context[] = [];
export function acquireCtx(): Context {
  return pool.pop() ?? ({
    state: Object.create(null),
    params: Object.create(null),
    query: Object.create(null),
  headers: Object.create(null),
  responseHeaders: Object.create(null),
  get(){ return undefined; },
  cookies: { get(){ return undefined; }, all(){ return {}; } },
  set(){}, text(){}, json(){},
    responded: false,
  req: {} as any,
  res: {} as any,
  } as unknown as Context);
}
export function releaseCtx(ctx: Context) {
  ctx.state = Object.create(null);
  ctx.params = Object.create(null);
  ctx.query  = Object.create(null);
  ctx.headers = Object.create(null);
  ctx.responseHeaders = Object.create(null);
  ctx.responded = false;
  pool.push(ctx);
}
