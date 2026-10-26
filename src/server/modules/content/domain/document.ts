import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * Letter document model (docs/03 §3.9a). The body is a ProseMirror/TipTap JSON document with a
 * deliberately small schema. Every block carries a stable `id` (10-char nanoid, assigned by the
 * editor and repaired by the server). Pure functions only — no I/O, no clock.
 */
export const EDITOR_SCHEMA_VERSION = 1;

const markSchema = z.object({ type: z.enum(["bold", "italic"]) }).strict();
const textSchema = z
  .object({ type: z.literal("text"), text: z.string().min(1).max(20000), marks: z.array(markSchema).max(2).optional() })
  .strict();
const hardBreak = z.object({ type: z.literal("hardBreak") }).strict();
const inline = z.union([textSchema, hardBreak]);
const blockId = z.string().regex(/^[A-Za-z0-9_-]{6,24}$/);

const paragraph = z
  .object({
    type: z.literal("paragraph"),
    attrs: z.object({ id: blockId.nullable().optional() }).strict().optional(),
    content: z.array(inline).max(2000).optional(),
  })
  .strict();
const heading = z
  .object({
    type: z.literal("heading"),
    attrs: z.object({ id: blockId.nullable().optional(), level: z.union([z.literal(2), z.literal(3)]) }).strict(),
    content: z.array(inline).max(500).optional(),
  })
  .strict();
const blockquote = z
  .object({
    type: z.literal("blockquote"),
    attrs: z.object({ id: blockId.nullable().optional() }).strict().optional(),
    content: z.array(paragraph).min(1).max(50),
  })
  .strict();
const rule = z
  .object({ type: z.literal("horizontalRule"), attrs: z.object({ id: blockId.nullable().optional() }).strict().optional() })
  .strict();

export const letterDocSchema = z
  .object({ type: z.literal("doc"), content: z.array(z.union([paragraph, heading, blockquote, rule])).max(5000) })
  .strict();

export type LetterDoc = z.infer<typeof letterDocSchema>;
export type Block = LetterDoc["content"][number];
export type Inline = z.infer<typeof inline>;
export type Paragraph = z.infer<typeof paragraph>;

export type Anchor = { id: string; blockId: string; start: number; end: number; h8: string };

export const emptyDoc = (): LetterDoc => ({ type: "doc", content: [{ type: "paragraph" }] });

/** Plain text of inline content (hard breaks become newlines). */
export function inlineText(content: readonly Inline[] | undefined): string {
  if (!content) return "";
  return content.map((n) => (n.type === "text" ? n.text : "\n")).join("");
}

/** Text-bearing blocks in reading order. Blockquote paragraphs are their own anchor blocks. */
export type TextBlock = { id: string; kind: "paragraph" | "heading" | "quote"; text: string };

export function textBlocks(doc: LetterDoc): TextBlock[] {
  const out: TextBlock[] = [];
  doc.content.forEach((b, i) => {
    if (b.type === "paragraph") out.push({ id: b.attrs?.id ?? `b${i}`, kind: "paragraph", text: inlineText(b.content) });
    else if (b.type === "heading") out.push({ id: b.attrs?.id ?? `b${i}`, kind: "heading", text: inlineText(b.content) });
    else if (b.type === "blockquote")
      b.content.forEach((p, j) => out.push({ id: p.attrs?.id ?? `${b.attrs?.id ?? `b${i}`}q${j}`, kind: "quote", text: inlineText(p.content) }));
  });
  return out;
}

/** Ensures every block (and quoted paragraph) has a unique id, using `makeId` for missing/duplicate ones. */
export function ensureBlockIds(doc: LetterDoc, makeId: () => string): LetterDoc {
  const seen = new Set<string>();
  const fix = (id: string | null | undefined) => {
    let v = id ?? null;
    if (!v || seen.has(v)) v = makeId();
    seen.add(v);
    return v;
  };
  return {
    type: "doc",
    content: doc.content.map((b) => {
      if (b.type === "heading") return { ...b, attrs: { ...b.attrs, id: fix(b.attrs.id) } };
      if (b.type === "blockquote")
        return { ...b, attrs: { id: fix(b.attrs?.id) }, content: b.content.map((p) => ({ ...p, attrs: { id: fix(p.attrs?.id) } })) };
      return { ...b, attrs: { ...(b.attrs ?? {}), id: fix(b.attrs?.id) } } as Block;
    }),
  };
}

export function bodyText(doc: LetterDoc): string {
  return textBlocks(doc)
    .map((b) => b.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

const WORD_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
export function countWords(text: string): number {
  return text.match(WORD_RE)?.length ?? 0;
}

/** BR-LE-04: ⌈words ÷ 230⌉, minimum 1. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 230));
}

export type Sentence = { start: number; end: number; text: string };

const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
export function sentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  for (const s of segmenter.segment(text)) {
    const trimmed = s.segment.replace(/\s+$/u, "");
    if (!trimmed.trim()) continue;
    const lead = trimmed.length - trimmed.trimStart().length;
    out.push({ start: s.index + lead, end: s.index + trimmed.length, text: trimmed.trimStart() });
  }
  return out;
}

export function normalizeSentence(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ").trim();
}

export function h8(s: string): string {
  return createHash("sha256").update(normalizeSentence(s)).digest("hex").slice(0, 8);
}

/** Anchors for every sentence: id = blockId + ":" + h8 (docs/03 §3.9a). Duplicates in a block get a suffix. */
export function computeAnchors(doc: LetterDoc): Anchor[] {
  const out: Anchor[] = [];
  for (const block of textBlocks(doc)) {
    const used = new Map<string, number>();
    for (const s of sentences(block.text)) {
      const hash = h8(s.text);
      const n = used.get(hash) ?? 0;
      used.set(hash, n + 1);
      out.push({ id: `${block.id}:${hash}${n ? `~${n}` : ""}`, blockId: block.id, start: s.start, end: s.end, h8: hash });
    }
  }
  return out;
}

function trigrams(s: string): Set<string> {
  const t = `  ${normalizeSentence(s)} `;
  const out = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}
export function trigramJaccard(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 1 : inter / union;
}

/**
 * Re-anchoring on republish (EX-12). Returns old anchor id → new anchor id, or null when orphaned.
 * 1) same block + same h8 → exact; 2) same block, best Jaccard ≥ 0.6; 3) any block, same h8; 4) orphan.
 */
export function remapAnchors(
  oldAnchors: readonly Anchor[],
  oldTextFor: (a: Anchor) => string,
  newAnchors: readonly Anchor[],
  newTextFor: (a: Anchor) => string,
): Map<string, string | null> {
  const result = new Map<string, string | null>();
  const byBlock = new Map<string, Anchor[]>();
  const byHash = new Map<string, Anchor>();
  for (const a of newAnchors) {
    byBlock.set(a.blockId, [...(byBlock.get(a.blockId) ?? []), a]);
    if (!byHash.has(a.h8)) byHash.set(a.h8, a);
  }
  for (const old of oldAnchors) {
    const sameBlock = byBlock.get(old.blockId) ?? [];
    const exact = sameBlock.find((a) => a.h8 === old.h8);
    if (exact) {
      result.set(old.id, exact.id);
      continue;
    }
    let best: Anchor | null = null;
    let bestScore = 0.6;
    const oldText = oldTextFor(old);
    for (const cand of sameBlock) {
      const score = trigramJaccard(oldText, newTextFor(cand));
      if (score >= bestScore) {
        best = cand;
        bestScore = score;
      }
    }
    if (best) {
      result.set(old.id, best.id);
      continue;
    }
    result.set(old.id, byHash.get(old.h8)?.id ?? null);
  }
  return result;
}

/** Slice inline content to the first `end` characters, keeping marks. */
export function sliceInline(content: readonly Inline[] | undefined, end: number): Inline[] {
  const out: Inline[] = [];
  let pos = 0;
  for (const n of content ?? []) {
    if (pos >= end) break;
    if (n.type === "hardBreak") {
      out.push(n);
      pos += 1;
      continue;
    }
    const take = Math.min(n.text.length, end - pos);
    if (take > 0) out.push({ ...n, text: n.text.slice(0, take) });
    pos += n.text.length;
  }
  return out;
}
