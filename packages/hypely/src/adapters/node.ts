import { BufferFastEntry } from "@/core/types";
import { createServer, IncomingMessage, ServerResponse } from "node:http";

function headersToObject(h: Headers | Record<string, string> | undefined): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return { ...h };
}


export const nodeAdapter = {
  name: "node",

  listen(
    port: number,
    handler: (req: IncomingMessage, res: ServerResponse) => void,
    fastMap?: Map<string, BufferFastEntry | Response>
  ) {
    const server = createServer(async (req, res) => {
      // --- ホットパス ---
      if (fastMap && req.method && req.url) {
        const fast = fastMap.get(req.method + " " + req.url);

        // Buffer直返し
        if (fast && "body" in fast && Buffer.isBuffer(fast.body)) {
          res.writeHead(fast.status, { Connection: "keep-alive", ...headersToObject(fast.headers) });
          res.end(fast.body);
          return;
        }

        // Response unwrap
        if (fast instanceof Response) {
          const headersObj = headersToObject(fast.headers);
          const buf = Buffer.from(await fast.arrayBuffer());
          if (!headersObj["content-length"]) {
            headersObj["Content-Length"] = String(buf.byteLength);
          }
          res.writeHead(fast.status, { Connection: "keep-alive", ...headersObj });
          res.end(buf);
          return;
        }
      }

      // 通常ルート
      handler(req, res);
    });

    server.on("connection", (socket) => {
      socket.setNoDelay(true);
      socket.setKeepAlive(true, 60_000);
    });
    server.keepAliveTimeout = 60_000;
    server.headersTimeout = 65_000;
    server.requestTimeout = 60_000;

    server.listen(port);
  },

  fill(ctx: any, req: IncomingMessage, res?: ServerResponse) {
    ctx.adapter = "node";
    ctx.resNative = res;
    ctx.method = req.method;
    ctx.url = new URL(req.url || "/", "http://localhost"); // 仮のベース
    ctx.params = {};
    // Parse query into string | string[]
    ctx.query = (() => {
      const out: Record<string, string | string[]> = Object.create(null);
      const sp = ctx.url.searchParams;
      // Use for..of over unique keys
      const seen = new Set<string>();
      sp.forEach((_: string, k: string) => seen.add(k));
      for (const k of seen) {
        const all = sp.getAll(k);
        out[k] = all.length <= 1 ? (all[0] ?? "") : all;
      }
      return out;
    })();
    ctx.state = {};
    ctx.get = (k: string) => {
      const key = k.toLowerCase();
      const v = (req.headers as Record<string, string | string[] | undefined>)[key];
      if (Array.isArray(v)) return v.join(", ");
      return v;
    };
    // Cookie helpers (parsed lazily and cached)
    let cookieCache: Record<string, string> | null = null;
    const parseCookies = () => {
      if (cookieCache) return cookieCache;
      const hdr = ctx.get("cookie");
      const out: Record<string, string> = Object.create(null);
      if (hdr) {
        const parts = hdr.split(/;\s*/);
        for (const p of parts) {
          if (!p) continue;
          const eq = p.indexOf("=");
          if (eq === -1) continue;
          const name = p.slice(0, eq).trim();
          const val = p.slice(eq + 1).trim();
          out[name] = decodeURIComponent(val);
        }
      }
      cookieCache = out;
      return out;
    };
    ctx.cookies = () => parseCookies();
    ctx.getCookie = (name: string) => parseCookies()[name];
    // Body helpers with caching
    let bodyPromise: Promise<Buffer> | null = null;
    const readRaw = (): Promise<Buffer> => {
      if (bodyPromise) return bodyPromise;
      bodyPromise = new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
      });
      return bodyPromise;
    };
    ctx.readArrayBuffer = async () => {
      const buf = await readRaw();
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    };
    ctx.readText = async () => {
      const buf = await readRaw();
      return buf.toString("utf8");
    };
    ctx.readJSON = async <T = unknown>() => {
      const txt = await ctx.readText();
      if (!txt) return undefined as unknown as T;
      return JSON.parse(txt) as T;
    };
    ctx.readForm = async () => {
      const ct = ctx.get("content-type") || "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const txt = await ctx.readText();
        const out: Record<string, string | string[]> = Object.create(null);
        const sp = new URLSearchParams(txt);
        const seen = new Set<string>();
        sp.forEach((_, k) => seen.add(k));
        for (const k of seen) {
          const all = sp.getAll(k);
          out[k] = all.length <= 1 ? (all[0] ?? "") : all;
        }
        return out;
      }
      // Multipart parsing is not built-in; return empty for now
      return {} as Record<string, string | string[]>;
    };
    ctx.set = (k: string, v: string) => res?.setHeader(k, v);

    ctx.text = (s: string, status = 200) => {
      const b = Buffer.from(s);
      res?.writeHead(status, {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": String(b.byteLength),
        Connection: "keep-alive",
      });
      res?.end(b);
    };

    ctx.json = (obj: unknown, status = 200) => {
      const s = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
      const b = Buffer.from(s);
      res?.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": String(b.byteLength),
        Connection: "keep-alive",
      });
      res?.end(b);
    };
    // Structured accessors
    ctx.req = {
      url: ctx.url,
      method: ctx.method,
      params: ctx.params,
      query: ctx.query,
      get: ctx.get,
      readText: ctx.readText,
      readJSON: ctx.readJSON,
      readArrayBuffer: ctx.readArrayBuffer,
      readForm: ctx.readForm,
      getCookie: ctx.getCookie,
      cookies: ctx.cookies,
    } as any;
    ctx.res = {
      set: ctx.set,
      text: ctx.text,
      json: ctx.json,
    } as any;
  },

  notFound(res?: ServerResponse) {
    if (!res || res.headersSent) return;
    const b = Buffer.from("Not Found");
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(b.byteLength),
      Connection: "keep-alive",
    });
    res.end(b);
  },

  error(res: ServerResponse, e: unknown) {
    console.error(e);
    if (!res || res.headersSent) return;
    const b = Buffer.from("Internal Server Error");
    res.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(b.byteLength),
      Connection: "keep-alive",
    });
    res.end(b);
  },
};
