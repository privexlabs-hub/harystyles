import { getDb } from "@/server/db/client";
import { handleRoute } from "@/server/http/route";
import { err } from "@/server/kernel/errors";
import { getViewer } from "@/server/modules/identity";
import { exportShelf } from "@/server/modules/engagement";

/** GET /api/v1/me/export — the reader's own shelf as JSON (BR-PR-06, JSON part). */
export async function GET(req: Request) {
  return handleRoute(req, async () => {
    const viewer = await getViewer();
    if (!viewer) throw err.unauthenticated();
    const data = await exportShelf(await getDb(), viewer.id);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="harystyles-shelf.json"',
        "cache-control": "private, no-store",
      },
    });
  });
}
