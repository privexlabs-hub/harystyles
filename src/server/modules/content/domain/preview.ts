import { countWords, inlineText, sentences, sliceInline, type Block, type LetterDoc } from "./document";

/**
 * BR-LE-05 — the only home of preview truncation. The preview is the first `previewPercent` of the
 * words (0–30), capped at 400 words, cut at the end of a sentence. Always computed on the server.
 */
export const PREVIEW_WORD_CAP = 400;

export function previewWordLimit(totalWords: number, previewPercent: number): number {
  const pct = Math.min(30, Math.max(0, Math.floor(previewPercent)));
  return Math.min(PREVIEW_WORD_CAP, Math.floor((totalWords * pct) / 100));
}

/**
 * Returns a document containing whole sentences only, whose total word count is ≤ the limit.
 * Blocks after the cut are dropped entirely — nothing beyond the preview reaches the caller.
 */
export function truncateDoc(doc: LetterDoc, wordLimit: number): { doc: LetterDoc; words: number; truncated: boolean } {
  const out: Block[] = [];
  let used = 0;
  let stopped = false;

  const takeInline = (content: Parameters<typeof inlineText>[0]): { content: ReturnType<typeof sliceInline>; complete: boolean } | null => {
    const text = inlineText(content);
    let cut = 0;
    let complete = true;
    for (const s of sentences(text)) {
      const w = countWords(s.text);
      if (used + w > wordLimit) {
        complete = false;
        break;
      }
      used += w;
      cut = s.end;
    }
    if (cut === 0) return null;
    return { content: sliceInline(content, cut), complete };
  };

  for (const b of doc.content) {
    if (stopped) break;
    if (b.type === "horizontalRule") {
      out.push(b);
      continue;
    }
    if (b.type === "blockquote") {
      const paras = [];
      for (const p of b.content) {
        const r = takeInline(p.content);
        if (!r) {
          stopped = true;
          break;
        }
        paras.push({ ...p, content: r.content });
        if (!r.complete) {
          stopped = true;
          break;
        }
      }
      if (paras.length) out.push({ ...b, content: paras });
      continue;
    }
    const r = takeInline(b.content);
    if (!r) {
      if (inlineText(b.content).trim()) stopped = true;
      continue;
    }
    out.push({ ...b, content: r.content } as Block);
    if (!r.complete) stopped = true;
  }
  while (out.length && out[out.length - 1]!.type === "horizontalRule") out.pop();
  return { doc: { type: "doc", content: out }, words: used, truncated: true };
}

export function buildPreview(doc: LetterDoc, totalWords: number, previewPercent: number) {
  return truncateDoc(doc, previewWordLimit(totalWords, previewPercent));
}
