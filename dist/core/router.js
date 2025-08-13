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

// src/core/router.ts
function createRouter() {
  const root = { prefix: "", children: [] };
  function add(method, path, handlers) {
    if (path !== "/" && path.endsWith("/"))
      path = path.slice(0, -1);
    insert(root, path, method, handlers);
  }
  function insert(node, path, method, handlers) {
    if (path === "") {
      const map = node.handlers ??= {};
      map[method.toUpperCase()] = handlers;
      return;
    }
    if (path[0] === "/" && path[1] === ":" || path[0] === ":") {
      const start = path[0] === ":" ? 0 : 1;
      const nextSlash = path.indexOf("/", start);
      const seg = nextSlash === -1 ? path.slice(start) : path.slice(start, nextSlash);
      const paramName = seg.startsWith(":") ? seg.slice(1) : seg;
      node.paramChild ??= { prefix: "", children: [], paramName };
      const rest2 = nextSlash === -1 ? "" : path.slice(nextSlash);
      insert(node.paramChild, rest2, method, handlers);
      return;
    }
    if (path[0] === "*") {
      node.wildcardChild ??= { prefix: "", children: [] };
      const map = node.wildcardChild.handlers ??= {};
      map[method] = handlers;
      return;
    }
    let child = node.children.find((c) => path.startsWith(c.prefix));
    if (!child) {
      const nextSlash = path.indexOf("/", 1);
      const pref = nextSlash === -1 ? path : path.slice(0, nextSlash);
      child = { prefix: pref, children: [] };
      node.children.push(child);
    }
    const rest = path.slice(child.prefix.length);
    insert(child, rest, method, handlers);
  }
  async function dispatch(ctx, next) {
    const pathname = ctx.url.pathname;
    let params = ctx.params;
    let node = root;
    let i = 0;
    while (i < pathname.length) {
      const child = node.children.find((c) => pathname.startsWith(c.prefix, i));
      if (child) {
        i += child.prefix.length;
        node = child;
        continue;
      }
      if (node.paramChild) {
        const slash = pathname.indexOf("/", i + 1);
        const end = slash === -1 ? pathname.length : slash;
        params[node.paramChild.paramName] = decodeURIComponent(pathname.slice(i + 1, end));
        i = end;
        node = node.paramChild;
        continue;
      }
      break;
    }
    const done = i === pathname.length;
    const handlers = (done ? node.handlers && node.handlers[ctx.method] : undefined) || node.wildcardChild?.handlers && node.wildcardChild.handlers[ctx.method];
    if (handlers) {
      let idx = -1;
      const run = async () => {
        idx++;
        if (idx < handlers.length) {
          const result = await handlers[idx](ctx, run);
          if (result)
            return result;
          return new Response(null, { status: 204 });
        }
        const nextResult = await next();
        if (typeof nextResult === "object" && nextResult !== null && "status" in nextResult)
          return nextResult;
        return new Response(null, { status: 204 });
      };
      return await run();
    }
    return await next();
  }
  return { add, dispatch, root };
}
export {
  createRouter
};
