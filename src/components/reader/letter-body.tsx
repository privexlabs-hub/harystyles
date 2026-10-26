import type { ReactNode } from "react";
import type { Anchor, LetterDoc } from "@/server/modules/content";
import type { Inline } from "@/server/modules/content/domain/document";

/**
 * Renders a letter document as React elements — never as raw HTML, so no markup can be injected.
 * When `anchors` are given (full access only), every sentence is wrapped in a span carrying its
 * anchor id so the reader can react to it (BR-EN-01) and keep lines (BR-EN-03).
 */
type Props = { doc: LetterDoc; anchors?: readonly Anchor[]; reactions?: Record<string, string> };

function marked(text: string, marks: { type: "bold" | "italic" }[] | undefined, key: string): ReactNode {
  let node: ReactNode = text;
  for (const m of marks ?? []) node = m.type === "bold" ? <strong key={`${key}b`}>{node}</strong> : <em key={`${key}i`}>{node}</em>;
  return <span key={key}>{node}</span>;
}

/** Inline content sliced into [start, end) by character offsets, marks preserved. */
function slice(content: readonly Inline[], start: number, end: number, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let pos = 0;
  content.forEach((n, i) => {
    const len = n.type === "text" ? n.text.length : 1;
    const a = Math.max(start, pos);
    const b = Math.min(end, pos + len);
    if (a < b) {
      if (n.type === "hardBreak") out.push(<br key={`${keyBase}-${i}`} />);
      else out.push(marked(n.text.slice(a - pos, b - pos), n.marks, `${keyBase}-${i}`));
    }
    pos += len;
  });
  return out;
}

function renderInline(content: readonly Inline[] | undefined, blockId: string | null | undefined, props: Props): ReactNode {
  if (!content?.length) return null;
  const anchors = blockId && props.anchors ? props.anchors.filter((a) => a.blockId === blockId) : [];
  if (!anchors.length) return slice(content, 0, Number.MAX_SAFE_INTEGER, "t");
  const total = content.reduce((s, n) => s + (n.type === "text" ? n.text.length : 1), 0);
  const parts: ReactNode[] = [];
  let cursor = 0;
  anchors.forEach((a, i) => {
    if (a.start > cursor) parts.push(...slice(content, cursor, a.start, `g${i}`));
    const glyph = props.reactions?.[a.id];
    parts.push(
      <span key={a.id} className="sentence" data-anchor={a.id} data-reacted={glyph ? "" : undefined} data-glyph={glyph}>
        {slice(content, a.start, a.end, a.id)}
      </span>,
    );
    cursor = a.end;
  });
  if (cursor < total) parts.push(...slice(content, cursor, total, "tail"));
  return parts;
}

export function LetterBody(props: Props) {
  return (
    <div className="letter-body">
      {props.doc.content.map((b, i) => {
        const key = ("attrs" in b && b.attrs && "id" in b.attrs && b.attrs.id) || `b${i}`;
        if (b.type === "paragraph") return <p key={key}>{renderInline(b.content, b.attrs?.id, props)}</p>;
        if (b.type === "heading") {
          const H = b.attrs.level === 2 ? "h2" : "h3";
          return <H key={key}>{renderInline(b.content, b.attrs.id, props)}</H>;
        }
        if (b.type === "blockquote")
          return (
            <blockquote key={key}>
              {b.content.map((p, j) => (
                <p key={p.attrs?.id ?? `${key}q${j}`}>{renderInline(p.content, p.attrs?.id, props)}</p>
              ))}
            </blockquote>
          );
        return <hr key={key} />;
      })}
    </div>
  );
}
