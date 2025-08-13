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

// src/adapters/bun.ts
var bunAdapter = {
  name: "bun",
  listen(port, onReq, fastMap) {
    Bun.serve({
      port,
      fetch(req) {
        if (fastMap && req.method === "GET") {
          const pathStart = req.url.indexOf("/", 8);
          const path = req.url.slice(pathStart);
          const fastResp = fastMap[path];
          if (fastResp)
            return fastResp;
        }
        return onReq(req);
      }
    });
  },
  fill(ctx, req) {
    ctx.method = req.method;
    ctx.url = new URL(req.url, `http://${req.headers.get("host")}`);
    ctx.params = {};
    ctx.state = {};
    ctx.responded = false;
    ctx.response = undefined;
    ctx.set = () => {};
    ctx.text = (s, status = 200) => {
      ctx.responded = true;
      ctx.response = new Response(s, {
        status,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
      return ctx.response;
    };
    ctx.json = (obj, status = 200) => {
      ctx.responded = true;
      ctx.response = new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
      return ctx.response;
    };
  },
  responseFromContext(ctx) {
    return ctx.response ?? new Response(null, { status: 204 });
  },
  notFound() {
    return new Response("Not Found", { status: 404 });
  },
  error(_res, e) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  }
};
export {
  bunAdapter
};
