process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.DATABASE_URL ??= "pglite:memory";
(process.env as Record<string, string>).NODE_ENV = "test";
