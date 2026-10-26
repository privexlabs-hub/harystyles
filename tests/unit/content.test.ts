import { describe, expect, it } from "vitest";
import { bodyText, computeAnchors, countWords, ensureBlockIds, letterDocSchema, readingMinutes, remapAnchors, type LetterDoc } from "@/server/modules/content/domain/document";
import { buildPreview, previewWordLimit } from "@/server/modules/content/domain/preview";
import { canTransition, publishProblems, visibilityChangeBlocked } from "@/server/modules/content/domain/letter-state";

const para = (id: string, text: string) => ({ type: "paragraph" as const, attrs: { id }, content: [{ type: "text" as const, text }] });

describe("BR-LE-04 words and reading time", () => {
  it("counts words and rounds reading time up", () => {
    expect(countWords("It's the only place online I read slowly — anymore.")).toBe(9);
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(231)).toBe(2);
  });
});

describe("BR-LE-05 preview (INV-01)", () => {
  const sentence = "The kettle hums on the stove tonight. ";
  const doc: LetterDoc = { type: "doc", content: Array.from({ length: 20 }, (_, i) => para(`blk${i}aaaa`, sentence.repeat(5).trim())) };
  const total = countWords(bodyText(doc)); // 20 × 35 = 700

  it("limits to percent of words, capped at 400", () => {
    expect(previewWordLimit(700, 30)).toBe(210);
    expect(previewWordLimit(5000, 30)).toBe(400);
    expect(previewWordLimit(700, 0)).toBe(0);
    expect(previewWordLimit(700, 99)).toBe(210);
  });

  it("cuts at a sentence end and never exceeds the limit", () => {
    const p = buildPreview(doc, total, 30);
    const text = bodyText(p.doc);
    expect(countWords(text)).toBeLessThanOrEqual(210);
    expect(text.trim().endsWith(".")).toBe(true);
    expect(p.doc.content.length).toBeLessThan(doc.content.length);
  });

  it("returns nothing at 0%", () => {
    expect(buildPreview(doc, total, 0).doc.content).toHaveLength(0);
  });
});

describe("anchors (docs/03 §3.9a, EX-12)", () => {
  it("are stable ids per sentence and remap after edits", () => {
    const v1: LetterDoc = { type: "doc", content: [para("b1xxxx", "I left the city in March. The trains were late."), para("b2xxxx", "Nobody waved.")] };
    const v2: LetterDoc = { type: "doc", content: [para("b2xxxx", "Nobody waved."), para("b1xxxx", "I left the city in early March. The trains were late.")] };
    const a1 = computeAnchors(v1);
    const a2 = computeAnchors(v2);
    expect(a1).toHaveLength(3);
    const text = (doc: LetterDoc) => (a: { blockId: string; start: number; end: number }) => {
      const b = doc.content.find((x) => x.type === "paragraph" && x.attrs?.id === a.blockId) as ReturnType<typeof para>;
      return b.content[0]!.text.slice(a.start, a.end);
    };
    const map = remapAnchors(a1, text(v1), a2, text(v2));
    for (const [, to] of map) expect(to).not.toBeNull();
    const edited = a1.find((a) => a.blockId === "b1xxxx" && a.start === 0)!;
    expect(map.get(edited.id)).not.toBe(edited.id); // fuzzy remap (Jaccard)
  });

  it("repairs missing and duplicate block ids", () => {
    let n = 0;
    const fixed = ensureBlockIds({ type: "doc", content: [para("dupdup", "a"), para("dupdup", "b"), { type: "paragraph" }] }, () => `gen${++n}xx`);
    const ids = fixed.content.map((b) => (b.type === "paragraph" ? b.attrs?.id : null));
    expect(new Set(ids).size).toBe(3);
  });

  it("rejects unknown node types (no raw HTML in letters)", () => {
    expect(letterDocSchema.safeParse({ type: "doc", content: [{ type: "image", attrs: { src: "x" } }] }).success).toBe(false);
  });
});

describe("BR-LE-01/02/06 letter rules", () => {
  it("allows only documented transitions", () => {
    expect(canTransition("draft", "published", "writer")).toBe(true);
    expect(canTransition("withdrawn", "published", "writer")).toBe(false);
    expect(canTransition("published", "removed", "writer")).toBe(false);
  });
  it("requires title, mood and 150–20,000 words", () => {
    const p = publishProblems({ title: "", subtitle: null, primaryMood: null, visibility: "public", wordCount: 20, deliverToInbox: true });
    expect(Object.keys(p).sort()).toEqual(["body", "deliverToInbox", "primaryMood", "title"]);
  });
  it("blocks public→patron while in an active issue", () => {
    expect(visibilityChangeBlocked("public", "patron", true)).toBe(true);
    expect(visibilityChangeBlocked("patron", "public", true)).toBe(false);
  });
});
