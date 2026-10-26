/** Local-only reset: deletes the embedded PGlite database directory, then re-migrates and re-seeds. */
import "./env";
import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("pglite:")) {
  console.error("db:reset only resets a local PGlite database. For Neon, reset a dev branch: `neon branches reset <branch> --parent`.");
  process.exit(1);
}
const dir = url.slice("pglite:".length);
rmSync(dir, { recursive: true, force: true });
execSync("pnpm db:migrate && pnpm db:seed", { stdio: "inherit" });
