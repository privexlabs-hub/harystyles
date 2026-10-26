import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = {
  "@": path.resolve(__dirname, "src"),
  // `server-only` throws outside React Server Components; tests run server code directly.
  "server-only": path.resolve(__dirname, "tests/support/server-only.ts"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
          env: { TZ: "Pacific/Auckland" }, // domain code must not depend on host TZ
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          testTimeout: 60_000,
          hookTimeout: 120_000,
          pool: "forks",
          setupFiles: ["tests/support/integration-setup.ts"],
        },
      },
    ],
  },
});
