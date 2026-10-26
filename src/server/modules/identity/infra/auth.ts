import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";
import { getDb, schema } from "@/server/db/client";
import { env, features } from "@/server/kernel/env";
import { uuidv7 } from "@/server/kernel/ids";
import { emailHtml, mailer } from "@/server/kernel/mailer";

/**
 * Authentication (ADR-022): self-hosted Better Auth on the app's Neon database.
 * BR-ID-01 sign-in methods: email magic link, passkey, Google and Apple (when configured).
 * No passwords — the emailAndPassword method is never enabled.
 */
async function build() {
  const db = await getDb();
  const e = env();
  const baseURL = e.BETTER_AUTH_URL;
  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
  if (features.google()) socialProviders.google = { clientId: e.GOOGLE_CLIENT_ID!, clientSecret: e.GOOGLE_CLIENT_SECRET! };
  if (features.apple()) socialProviders.apple = { clientId: e.APPLE_CLIENT_ID!, clientSecret: e.APPLE_CLIENT_SECRET! };

  return betterAuth({
    appName: "harystyles",
    baseURL,
    secret: e.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
        passkeys: schema.passkeys,
      },
    }),
    emailAndPassword: { enabled: false },
    socialProviders,
    account: {
      // BR-ID-02: identities with a matching *verified* email are linked, never duplicated.
      accountLinking: { enabled: true, trustedProviders: ["google", "apple"] },
    },
    user: {
      additionalFields: {
        status: { type: "string", input: false, required: false, defaultValue: "active" },
        ageAttestedAt: { type: "date", input: false, required: false },
        onboardedAt: { type: "date", input: false, required: false },
      },
    },
    session: {
      // docs/06 §6.2: 30-day rolling web session.
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      cookiePrefix: "hs",
      useSecureCookies: baseURL.startsWith("https://"),
      database: { generateId: () => uuidv7() },
    },
    rateLimit: { enabled: true, window: 60, max: 60 },
    databaseHooks: {
      session: {
        create: {
          // Banned or purged accounts can't start sessions.
          before: async (session) => {
            const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, session.userId) });
            if (!user || user.status === "banned" || user.status === "deleted") return false;
            return { data: session };
          },
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: 15 * 60, // docs/06 §6.2: 15 min, single use
        storeToken: "hashed",
        rateLimit: { window: 60, max: e.AUTH_RATE_LIMIT_MAX }, // docs/06 §6.4: auth 5/min (raised only for the local e2e server)
        sendMagicLink: async ({ email, url }) => {
          await mailer().send({
            to: email,
            tag: "magic-link",
            subject: "Your way in to harystyles",
            text: `Open this link to sign in. It works once, for 15 minutes:\n\n${url}\n\nIf you didn't ask for it, you can ignore this email.`,
            html: emailHtml({
              heading: "The lamp is waiting.",
              body: "Open this link to sign in. It works once, for the next 15 minutes. If you didn't ask for it, you can ignore this email.",
              cta: { label: "Sign in to harystyles", href: url },
            }),
          });
        },
      }),
      passkey({ rpID: new URL(baseURL).hostname, rpName: "harystyles", origin: baseURL }),
      nextCookies(),
    ],
  });
}

type Auth = Awaited<ReturnType<typeof build>>;
const g = globalThis as unknown as { __hsAuth?: Promise<Auth> };

export function getAuth(): Promise<Auth> {
  g.__hsAuth ??= build();
  return g.__hsAuth;
}
