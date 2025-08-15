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
  // Best-effort IP: trust headers first if behind proxy, then socket
  const xf = (req.headers["x-forwarded-for"] as string | string[] | undefined);
  const xr = (req.headers["x-real-ip"] as string | string[] | undefined);
  const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  ctx.ip = (pick(xf)?.split(",")[0].trim() || pick(xr) || (req.socket && (req.socket as any).remoteAddress)) as any;
    // Snapshot headers: Node provides lower-cased keys; join array values with ", "
    ctx.headers = (() => {
      const out: Record<string, string> = Object.create(null);
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) out[k] = v.join(", ");
        else if (v !== undefined) out[k] = String(v);
      }
      return out;
    })();
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
    // Cookies object API
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
    ctx.cookies = {
      get: (name: string) => parseCookies()[name],
      all: () => parseCookies(),
    };
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
    const readArrayBuffer = async () => {
      const buf = await readRaw();
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    };
    const readText = async () => {
      const buf = await readRaw();
      return buf.toString("utf8");
    };
    const readJSON = async <T = unknown>() => {
      const txt = await readText();
      if (!txt) return undefined as unknown as T;
      return JSON.parse(txt) as T;
    };
    const readForm = async () => {
      const ct = ctx.get("content-type") || "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const txt = await readText();
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
  // Accumulate headers and cookies for response
  ctx.responseHeaders = ctx.responseHeaders ?? Object.create(null);
  ctx.responseCookies = ctx.responseCookies ?? [];
    ctx.set = (k: string, v: string) => {
      ctx.responseHeaders[k] = v;
      res?.setHeader(k, v);
    };

    const setCookie = (name: string, value: string, options?: any) => {
      const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
      if (options) {
        if (options.path) parts.push(`Path=${options.path}`);
        if (options.domain) parts.push(`Domain=${options.domain}`);
        if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
        if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
        if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
        if (options.secure) parts.push(`Secure`);
        if (options.httpOnly) parts.push(`HttpOnly`);
      }
      const cookieStr = parts.join("; ");
      ctx.responseCookies!.push(cookieStr);
      const existing = res?.getHeader("Set-Cookie");
      if (res) {
        if (!existing) res.setHeader("Set-Cookie", cookieStr);
        else if (Array.isArray(existing)) res.setHeader("Set-Cookie", [...existing, cookieStr]);
        else res.setHeader("Set-Cookie", [String(existing), cookieStr]);
      }
    };
    ctx.cookies.set = setCookie;

    ctx.text = (s: string, status = 200) => {
      const b = Buffer.from(s);
      const hdrs: Record<string, string> = {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": String(b.byteLength),
        Connection: "keep-alive",
        ...ctx.responseHeaders,
      };
      // Set-Cookie already applied via res.setHeader in setCookie
      res?.writeHead(status, hdrs);
      res?.end(b);
    };

    ctx.json = (obj: unknown, status = 200) => {
      const s = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
      const b = Buffer.from(s);
      const hdrs: Record<string, string> = {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": String(b.byteLength),
        Connection: "keep-alive",
        ...ctx.responseHeaders,
      };
      // Set-Cookie already applied via res.setHeader in setCookie
      res?.writeHead(status, hdrs);
      res?.end(b);
    };
    // Structured accessors
    ctx.req = {
      url: ctx.url,
      method: ctx.method,
      params: ctx.params,
      query: ctx.query,
      get: ctx.get,
      text: readText,
      json: readJSON,
      arrayBuffer: readArrayBuffer,
      form: readForm,
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
