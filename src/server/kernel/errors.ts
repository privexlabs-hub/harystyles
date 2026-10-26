/**
 * Domain/application errors with stable `MODULE_REASON` codes (docs/02 §2.5, docs/04 §4.6).
 * Rendered as RFC 9457 problem+json by route handlers and as form errors by server actions.
 * Messages are user-safe; internal details never leave the server.
 */
export type ErrorKind = "validation" | "unauthenticated" | "forbidden" | "not_found" | "conflict" | "gone" | "rate_limited";

const STATUS: Record<ErrorKind, number> = {
  validation: 422,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  gone: 410,
  rate_limited: 429,
};

export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly kind: ErrorKind,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.status = STATUS[kind];
  }
}

export const err = {
  validation: (code: string, message: string, fields?: Record<string, string>) =>
    new AppError("validation", code, message, fields),
  unauthenticated: () => new AppError("unauthenticated", "AUTH_REQUIRED", "Please sign in to continue."),
  // Object-level denials surface as 404 so existence isn't revealed (docs/06 §6.3).
  notFound: (code = "NOT_FOUND", message = "We couldn't find that.") => new AppError("not_found", code, message),
  forbidden: (code = "FORBIDDEN", message = "You can't do that.") => new AppError("forbidden", code, message),
  conflict: (code: string, message: string) => new AppError("conflict", code, message),
  gone: (code: string, message: string) => new AppError("gone", code, message),
  rateLimited: () => new AppError("rate_limited", "RATE_LIMITED", "That's a lot at once. Try again in a little while."),
};

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

export function problemJson(e: AppError, instance?: string): Response {
  return Response.json(
    { type: `https://harystyles.com/problems/${e.code}`, title: e.message, status: e.status, code: e.code, fields: e.fields, instance },
    { status: e.status, headers: { "content-type": "application/problem+json" } },
  );
}

/** Result shape returned by server actions to forms. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; fields?: Record<string, string> };

export function toActionError(e: unknown): Extract<ActionResult, { ok: false }> {
  if (isAppError(e)) return { ok: false, code: e.code, message: e.message, fields: e.fields };
  return { ok: false, code: "INTERNAL", message: "Something went quiet on our side. Please try again." };
}
