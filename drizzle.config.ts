import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", override: false });

// Migrations need a direct (unpooled) connection on Neon; generation needs no connection at all.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: url.startsWith("postgres") ? { url } : { url: "postgres://unused" },
  strict: true,
  verbose: true,
});
