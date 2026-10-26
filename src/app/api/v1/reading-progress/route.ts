import { z } from "zod";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, handleRoute } from "@/server/http/route";
import { rateLimit } from "@/server/kernel/rate-limit";
import { err } from "@/server/kernel/errors";
import { getViewer } from "@/server/modules/identity";
import { recordHeartbeat } from "@/server/modules/ration";

const body = z.object({ letterId: z.uuid(), progress: z.number().min(0).max(1), activeSeconds: z.number().min(0).max(600) }).strict();

/** POST /api/v1/reading-progress — read heartbeats (docs/03 §3.9e, BR-RA-08). */
export async function POST(req: Request) {
  return handleRoute(req, async () => {
    assertSameOrigin(req);
    const viewer = await getViewer();
    if (!viewer) throw err.unauthenticated();
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw err.validation("READING_INVALID", "Invalid heartbeat.");
    const db = await getDb();
    await rateLimit(db, "heartbeat", viewer.id);
    const res = await recordHeartbeat(db, viewer.id, parsed.data, new Date());
    return Response.json(res, { headers: { "cache-control": "private, no-store" } });
  });
}
