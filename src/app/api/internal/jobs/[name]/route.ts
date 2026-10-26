import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/server/db/client";
import { env } from "@/server/kernel/env";
import { err, problemJson } from "@/server/kernel/errors";
import { handleRoute } from "@/server/http/route";
import { JOBS, runJob, type JobName } from "@/server/jobs";

/**
 * POST /api/internal/jobs/:name — runs one idempotent job (ADR-025). Called by a Neon schedule
 * trigger or the host's cron with `Authorization: Bearer $JOBS_SECRET`. Disabled when no secret is
 * configured. Never reachable without the secret; job names are an allow-list.
 */
function authorized(req: Request): boolean {
  const secret = env().JOBS_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: Request, ctx: RouteContext<"/api/internal/jobs/[name]">) {
  if (!authorized(req)) return problemJson(err.notFound());
  return handleRoute(req, async () => {
    const { name } = await ctx.params;
    if (!(name in JOBS)) throw err.notFound();
    const result = await runJob(await getDb(), name as JobName, new Date());
    return Response.json({ job: name, result }, { headers: { "cache-control": "no-store" } });
  });
}
