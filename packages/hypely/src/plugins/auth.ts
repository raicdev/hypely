// src/plugins/auth.ts
import type { Middleware } from "@/core/types";

export interface BasicAuthOptions {
  // Static users map: username -> password (plaintext for simplicity)
  users?: Record<string, string>;
  // Custom validator to support hashed passwords or DB lookups
  validate?: (username: string, password: string) => boolean | Promise<boolean>;
  // Realm for WWW-Authenticate header
  realm?: string;
  // Header name to read (default: Authorization)
  headerName?: string;
}

function unauthorizedResponse(realm = "Secure Area") {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`,
    },
  });
}

export const basicAuth = (opts: BasicAuthOptions = {}): Middleware => {
  const { users, validate, realm = "Secure Area", headerName = "authorization" } = opts;

  if (!users && !validate) {
    throw new Error("basicAuth requires either 'users' or 'validate' option");
  }

  return async (ctx, next) => {
    const header = ctx.get(headerName);
    if (!header) return unauthorizedResponse(realm);

    const [scheme, value] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "basic" || !value) return unauthorizedResponse(realm);

    let decoded = "";
    try {
      decoded = Buffer.from(value, "base64").toString();
    } catch {
      return unauthorizedResponse(realm);
    }

    const idx = decoded.indexOf(":");
    if (idx < 0) return unauthorizedResponse(realm);
    const username = decoded.slice(0, idx);
    const password = decoded.slice(idx + 1);

    let ok = false;
    if (typeof validate === "function") {
      ok = await validate(username, password);
    } else if (users) {
      ok = users[username] === password;
    }

    if (!ok) return unauthorizedResponse(realm);

    // Attach identity to context state
    (ctx.state as any).user = { username, auth: "basic" };

    return next();
  };
};

export type { BasicAuthOptions as AuthOptions };
