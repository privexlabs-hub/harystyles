import "./env";
import { runMigrations } from "../src/server/db/migrate";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. See .env.example.");
  process.exit(1);
}
runMigrations(url)
  .then(() => console.log("migrations applied"))
  .catch((e: unknown) => {
    console.error("migration failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
