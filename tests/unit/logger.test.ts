import { describe, expect, it } from "vitest";
import { __test } from "@/server/kernel/logger";

describe("INV-17 log redaction", () => {
  it("redacts secrets, tokens, emails, bodies and URLs at any depth", () => {
    const out = __test.redact({
      email: "a@b.c",
      cookie: "hs.session=abc",
      nested: { refreshToken: "t", body: "letter text", url: "https://x/verify?token=1", ok: 1 },
      list: [{ apiSecret: "s", n: 2 }],
    }) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toMatch(/a@b\.c|abc|letter text|token=1|"t"|"s"/);
    expect((out.nested as Record<string, unknown>).ok).toBe(1);
  });
});
