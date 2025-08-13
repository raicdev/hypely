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
    ctx.query = {};
    ctx.state = {};
    ctx.get = (k: string) => {
      const key = k.toLowerCase();
      const v = (req.headers as Record<string, string | string[] | undefined>)[key];
      if (Array.isArray(v)) return v.join(", ");
      return v;
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
