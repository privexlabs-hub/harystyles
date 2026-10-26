import "server-only";
import { toActionError, type ActionResult } from "@/server/kernel/errors";
import { log } from "@/server/kernel/logger";
import { isAppError } from "@/server/kernel/errors";

/**
 * Wraps a server action body: AppErrors become user-safe results; anything else is logged
 * (redacted) and returned as a generic message. Framework control-flow errors (redirect,
 * notFound) are re-thrown.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string" && /NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test((e as { digest: string }).digest)) throw e;
    if (!isAppError(e)) log.error("action failed", { error: e instanceof Error ? e.message : "unknown" });
    return toActionError(e);
  }
}
