import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/adapters/node.ts
import { createServer } from "node:http";
function headersToObject(h) {
  if (!h)
    return {};
  if (h instanceof Headers) {
    const out = {};
    h.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return { ...h };
}
var nodeAdapter = {
  name: "node",
  listen(port, handler, fastMap) {
    const server = createServer(async (req, res) => {
      if (fastMap && req.method && req.url) {
        const fast = fastMap.get(req.method + " " + req.url);
        if (fast && "body" in fast && Buffer.isBuffer(fast.body)) {
          res.writeHead(fast.status, { Connection: "keep-alive", ...headersToObject(fast.headers) });
          res.end(fast.body);
          return;
        }
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
      handler(req, res);
    });
    server.on("connection", (socket) => {
      socket.setNoDelay(true);
      socket.setKeepAlive(true, 60000);
    });
    server.keepAliveTimeout = 60000;
    server.headersTimeout = 65000;
    server.requestTimeout = 60000;
    server.listen(port);
  },
  fill(ctx, req, res) {
    ctx.adapter = "node";
    ctx.resNative = res;
    ctx.method = req.method;
    ctx.url = new URL(req.url || "/", "http://localhost");
    ctx.params = {};
    ctx.query = {};
    ctx.state = {};
    ctx.set = (k, v) => res?.setHeader(k, v);
    ctx.text = (s, status = 200) => {
      const b = Buffer.from(s);
      res?.writeHead(status, {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": String(b.byteLength),
        Connection: "keep-alive"
      });
      res?.end(b);
    };
    ctx.json = (obj, status = 200) => {
      const s = ctx.stringify ? ctx.stringify(obj) : JSON.stringify(obj);
      const b = Buffer.from(s);
      res?.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": String(b.byteLength),
        Connection: "keep-alive"
      });
      res?.end(b);
    };
  },
  notFound(res) {
    if (!res || res.headersSent)
      return;
    const b = Buffer.from("Not Found");
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(b.byteLength),
      Connection: "keep-alive"
    });
    res.end(b);
  },
  error(res, e) {
    console.error(e);
    if (!res || res.headersSent)
      return;
    const b = Buffer.from("Internal Server Error");
    res.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(b.byteLength),
      Connection: "keep-alive"
    });
    res.end(b);
  }
};
export {
  nodeAdapter
};
