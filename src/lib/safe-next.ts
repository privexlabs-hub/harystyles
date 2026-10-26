/** Only same-site relative paths are allowed as post-login destinations (open-redirect guard). */
export function safeNext(v: string | string[] | undefined, fallback = "/tonight"): string {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s || !s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return fallback;
  return s;
}
