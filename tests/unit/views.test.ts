import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FORBIDDEN_READER_KEYS, letterSummarySchema, readerLetterViewSchema, writerCardSchema } from "@/contracts/views";

function keysOf(schema: z.ZodType): string[] {
  const out: string[] = [];
  const walk = (s: z.ZodType) => {
    if (s instanceof z.ZodObject) {
      for (const [k, v] of Object.entries(s.shape)) {
        out.push(k);
        walk(v as z.ZodType);
      }
    } else if (s instanceof z.ZodNullable || s instanceof z.ZodOptional) walk(s.unwrap() as z.ZodType);
    else if (s instanceof z.ZodArray) walk(s.element as z.ZodType);
  };
  walk(schema);
  return out;
}

describe("INV-02 reader DTOs carry no counts", () => {
  it.each([
    ["writerCard", writerCardSchema],
    ["letterSummary", letterSummarySchema],
    ["readerLetterView", readerLetterViewSchema],
  ])("%s has no forbidden keys", (_n, schema) => {
    const keys = keysOf(schema).map((k) => k.toLowerCase());
    for (const f of FORBIDDEN_READER_KEYS) expect(keys).not.toContain(f.toLowerCase());
    expect(keys.some((k) => k.endsWith("count"))).toBe(false);
  });

  it("strips undeclared fields such as counts on parse", () => {
    const parsed = writerCardSchema.parse({ id: "1", penName: "Ines", slug: "ines", bioQuote: null, locationPhrase: null, avatarHue: 25, patronCount: 412 });
    expect(parsed).not.toHaveProperty("patronCount");
  });
});
