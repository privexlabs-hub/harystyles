import type { PgDatabase, PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Database access (ADR-023). Runtime uses node-postgres `Pool` against Neon's *pooled* URL: the
 * domain needs interactive transactions (`FOR UPDATE`, `ON CONFLICT … RETURNING`), which the
 * one-shot HTTP driver can't provide. `pglite:<dir>` selects an embedded Postgres for local
 * development and tests when no Neon branch is available.
 */
export type Schema = typeof schema;
export type Db = PgDatabase<PgQueryResultHKT, Schema>;
export type Tx = PgTransaction<PgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;
/** Either the root handle or an open transaction — repositories accept both. */
export type DbOrTx = Db | Tx;

type Holder = { db?: Db; close?: () => Promise<void>; url?: string };
const g = globalThis as unknown as { __hsDb?: Holder };
const holder: Holder = (g.__hsDb ??= {});

export async function createDb(url: string): Promise<{ db: Db; close: () => Promise<void> }> {
  if (url.startsWith("pglite:")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { citext } = await import("@electric-sql/pglite/contrib/citext");
    const { pg_trgm } = await import("@electric-sql/pglite/contrib/pg_trgm");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = url.slice("pglite:".length);
    if (dir !== "memory") (await import("node:fs")).mkdirSync(dir, { recursive: true });
    // "memory://" (not undefined) is required for extensions to load in PGlite 0.5.
    const client = new PGlite(dir === "memory" ? "memory://" : dir, { extensions: { citext, pg_trgm } });
    const db = drizzle({ client, schema, casing: undefined }) as unknown as Db;
    return { db, close: () => client.close() };
  }
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  // docs/06 §6.5: verify-full TLS. Neon URLs say `sslmode=require`, which pg already treats as
  // verify-full; stating it explicitly keeps that guarantee when pg adopts libpq semantics.
  const connectionString = url.replace(/sslmode=(require|prefer|verify-ca)\b/, "sslmode=verify-full");
  // Neon's pooler (PgBouncer) rejects startup `options`; statement/lock timeouts are set per
  // connection only on direct URLs. For pooled runtime connections they belong on the database
  // role (`ALTER ROLE … SET statement_timeout`), see docs/SECURITY.md.
  const pooled = /-pooler\./.test(url);
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    ...(pooled ? {} : { options: "-c statement_timeout=5000 -c lock_timeout=3000" }), // docs/06 §6.4
  });
  const db = drizzle({ client: pool, schema }) as unknown as Db;
  return { db, close: () => pool.end() };
}

let pending: Promise<Db> | undefined;

/** Process-wide database handle (singleton across hot reloads). */
export function getDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  if (holder.db && holder.url === url) return Promise.resolve(holder.db);
  pending ??= createDb(url).then(({ db, close }) => {
    holder.db = db;
    holder.close = close;
    holder.url = url;
    return db;
  });
  return pending;
}

/** Test hook: route getDb() to a specific instance. */
export function __setDb(db: Db | undefined): void {
  holder.db = db;
  holder.url = db ? process.env.DATABASE_URL : undefined;
  pending = db ? Promise.resolve(db) : undefined;
}

export { schema };

/** Rows from `db.execute(sql…)` — node-postgres and PGlite both return `{ rows }`. */
export function rowsOf<T>(result: unknown): T[] {
  const r = result as { rows?: T[] } | T[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}
