import "server-only";
import { isAppError, problemJson, err } from "@/server/kernel/errors";
import { log } from "@/server/kernel/logger";

/** JSON route handler wrapper: problem+json errors (docs/02 §2.5), no internals leaked. */
export async function handleRoute(req: Request, fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (isAppError(e)) return problemJson(e, new URL(req.url).pathname);
    log.error("route failed", { path: new URL(req.url).pathname, error: e instanceof Error ? e.message : "unknown" });
    return problemJson(err.conflict("INTERNAL", "Something went quiet on our side. Please try again."));
  }
}

/** Same-origin check for JSON POSTs (CSRF defence in depth alongside SameSite=Lax cookies). */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) throw err.forbidden("CSRF_ORIGIN", "Cross-site request refused.");
}
