/** Run a background job once: `pnpm job outbox.relay` (see src/server/jobs.ts). */
import "./env";
import { getDb } from "../src/server/db/client";
import { JOBS, runJob, type JobName } from "../src/server/jobs";

const name = process.argv[2] as JobName | undefined;
if (!name || !(name in JOBS)) {
  console.error(`Usage: pnpm job <${Object.keys(JOBS).join("|")}>`);
  process.exit(1);
}
getDb()
  .then((db) => runJob(db, name, new Date()))
  .then((r) => {
    console.log(name, "→", JSON.stringify(r));
    process.exit(0);
  })
  .catch((e: unknown) => {
    console.error(name, "failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
