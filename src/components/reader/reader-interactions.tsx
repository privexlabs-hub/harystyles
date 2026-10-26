"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { keepLineAction, reactAction } from "@/features/reader/actions";
import { GLYPHS, GLYPH_CHAR, type Glyph } from "@/contracts/enums";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

/**
 * Selection pill (brief §8.3, screens-mobile.jsx ScreenReader): select or tap a sentence → five
 * glyphs + Keep line. Keyboard path: "React to a sentence" focuses sentences; ↑/↓ move, Enter opens
 * the pill, Esc closes. Reactions are private; no totals are ever shown (BR-EN-02).
 */
const GLYPH_LABEL: Record<Glyph, string> = { kept: "kept", tender: "tender", spark: "spark", staying: "staying", held: "held" };

type Sel = { from: string; to: string; rect: DOMRect };

export function ReaderInteractions({
  letterId,
  initial,
  enabled,
  signInHref,
  children,
}: {
  letterId: string;
  initial: Record<string, Glyph>;
  enabled: boolean;
  signInHref: string | null;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<Sel | null>(null);
  const [mine, setMine] = useState<Record<string, Glyph>>(initial);
  const [kbd, setKbd] = useState(false);
  const toast = useToast();

  const sentences = useCallback(() => Array.from(root.current?.querySelectorAll<HTMLElement>("[data-anchor]") ?? []), []);

  // Mirror private reactions into the DOM (highlight only, no counts).
  useEffect(() => {
    for (const el of sentences()) {
      const g = mine[el.dataset.anchor!];
      if (g) el.setAttribute("data-reacted", "");
      else el.removeAttribute("data-reacted");
      el.toggleAttribute("data-selected", Boolean(sel && el.dataset.anchor === sel.from && sel.from === sel.to));
    }
  }, [mine, sel, sentences]);

  useEffect(() => {
    for (const el of sentences()) el.tabIndex = kbd ? 0 : -1;
  }, [kbd, sentences]);

  const anchorOf = (n: Node | null): HTMLElement | null => {
    const el = n instanceof HTMLElement ? n : n?.parentElement;
    return el?.closest<HTMLElement>("[data-anchor]") ?? null;
  };

  const openFor = (from: HTMLElement, to: HTMLElement) => {
    const rect = (from === to ? from : from).getBoundingClientRect();
    setSel({ from: from.dataset.anchor!, to: to.dataset.anchor!, rect });
  };

  const onPointerUp = () => {
    if (!enabled) return;
    const s = window.getSelection();
    if (s && !s.isCollapsed && s.rangeCount) {
      const r = s.getRangeAt(0);
      const a = anchorOf(r.startContainer);
      const b = anchorOf(r.endContainer);
      if (a && b && root.current?.contains(a)) return openFor(a, b);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    const s = window.getSelection();
    if (s && !s.isCollapsed) return;
    const a = anchorOf(e.target as Node);
    if (!a) return setSel(null);
    if (!enabled) {
      if (signInHref) toast.show("Sign in to keep lines and react — privately.", { href: signInHref, label: "Sign in" });
      return;
    }
    openFor(a, a);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = sentences();
    const i = list.findIndex((el) => el === document.activeElement);
    if (e.key === "Escape") {
      setSel(null);
      return;
    }
    if (i < 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      list[Math.min(list.length - 1, i + 1)]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      list[Math.max(0, i - 1)]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (enabled) openFor(list[i]!, list[i]!);
    }
  };

  const react = async (g: Glyph) => {
    if (!sel) return;
    const id = sel.from;
    const next = mine[id] === g ? null : g;
    setMine((m) => {
      const c = { ...m };
      if (next) c[id] = next;
      else delete c[id];
      return c;
    });
    setSel(null);
    const r = await reactAction(letterId, id, next);
    if (!r.ok) {
      toast.show(r.message);
      setMine(initial);
    }
  };

  const keep = async () => {
    if (!sel) return;
    const { from, to } = sel;
    setSel(null);
    window.getSelection()?.removeAllRanges();
    const r = await keepLineAction(letterId, from, to);
    toast.show(r.ok ? "Kept. The line is on your shelf." : r.message, r.ok ? { href: "/shelf", label: "Open shelf" } : undefined);
  };

  const top = sel ? Math.max(8, sel.rect.top - 56) : 0;
  const left = sel ? Math.min(Math.max(8, sel.rect.left + sel.rect.width / 2 - 150), (typeof window !== "undefined" ? window.innerWidth : 400) - 308) : 0;

  return (
    <div className="relative">
      {enabled && (
        <button type="button" onClick={() => { setKbd(true); setTimeout(() => sentences()[0]?.focus(), 0); }} className="sr-only focus:not-sr-only focus:mb-4 focus:inline-flex focus:rounded-full focus:border focus:border-line focus:px-4 focus:py-2 focus:text-sm">
          React to a sentence (keyboard)
        </button>
      )}
      <div ref={root} onPointerUp={onPointerUp} onClick={onClick} onKeyDown={onKeyDown}>
        {children}
      </div>
      {sel && (
        <div
          role="toolbar"
          aria-label="React to this sentence"
          className="fixed z-[40] flex items-center gap-1 rounded-full border border-line bg-bg-elevated p-1.5 shadow-[var(--shadow-md)]"
          style={{ top, left }}
          onKeyDown={(e) => e.key === "Escape" && setSel(null)}
        >
          {GLYPHS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={sel.from === sel.to && mine[sel.from] === g}
              aria-label={`${GLYPH_LABEL[g]}${sel.from === sel.to && mine[sel.from] === g ? " (remove)" : ""}`}
              title={GLYPH_LABEL[g]}
              disabled={sel.from !== sel.to}
              onClick={() => react(g)}
              className="grid size-10 place-items-center rounded-full font-serif text-lg text-fg transition-colors hover:bg-bg-raised aria-pressed:bg-accent-soft aria-pressed:text-accent disabled:opacity-30"
            >
              {GLYPH_CHAR[g]}
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-line" aria-hidden />
          <button type="button" onClick={keep} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-fg hover:bg-bg-raised">
            <Icon.highlight /> Keep line
          </button>
        </div>
      )}
    </div>
  );
}
