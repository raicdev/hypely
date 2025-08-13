// src/utils/json.ts
import build from "fast-json-stringify";
export function compileStringify(schema: any) {
  const s = build(schema);
  return (data: unknown) => s(data as any);
}
