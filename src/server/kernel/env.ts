import "server-only";
import { z } from "zod";

/**
 * Server environment, validated once on first use (docs/09 §9.1: config validated with Zod at boot).
 * Optional integrations (OAuth, Postmark, object storage) may be absent; features that need them
 * report themselves as unavailable instead of failing the whole app.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // postgres://… (Neon pooled URL) or pglite:<dir> for the embedded local database.
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => /^(postgres(ql)?:\/\/|pglite:)/.test(v), "must be a postgres:// or pglite: URL"),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  MAIL_TRANSPORT: z.enum(["console", "postmark"]).default("console"),
  MAIL_FROM: z.string().default("harystyles <lamp@localhost>"),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  JOBS_SECRET: z.string().min(24).optional(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(5),
  HASH_SALT: z.string().min(16).default("dev-only-hash-salt-change-me"),
  // Neon Object Storage (S3-compatible); injected by `neon deploy`.
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_REGION: z.string().optional(),
  MEDIA_BUCKET_PRIVATE: z.string().default("media-private"),
  MEDIA_BUCKET_PUBLIC: z.string().default("media-public"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Report variable names and problems only — never values (INV-17).
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${problems}\nSee .env.example.`);
  }
  if (parsed.data.MAIL_TRANSPORT === "postmark" && !parsed.data.POSTMARK_SERVER_TOKEN) {
    throw new Error("Invalid server environment:\n  - POSTMARK_SERVER_TOKEN: required when MAIL_TRANSPORT=postmark");
  }
  cached = parsed.data;
  return cached;
}

export const features = {
  google: () => Boolean(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET),
  apple: () => Boolean(env().APPLE_CLIENT_ID && env().APPLE_CLIENT_SECRET),
  storage: () => Boolean(env().AWS_ACCESS_KEY_ID && env().AWS_ENDPOINT_URL_S3),
  jobs: () => Boolean(env().JOBS_SECRET),
};
