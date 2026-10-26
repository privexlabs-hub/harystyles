import Link from "next/link";
import type { LetterSummary } from "@/contracts/views";
import { MOOD_META } from "@/contracts/enums";
import { Avatar, Meta, PatronMark } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export const letterHref = (l: Pick<LetterSummary, "slug" | "writer">) => `/${l.writer.slug}/${l.slug}`;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "";

/**
 * ArticleCard (components.jsx) with the brief §14 corrections: no heart counts, no public totals.
 * Whole card is one link; meta is text, not controls.
 */
export function LetterCard({ letter, read = false }: { letter: LetterSummary; read?: boolean }) {
  return (
    <article className={cx("relative flex flex-col gap-3.5 border-t border-line-soft py-6", read && "opacity-60")}>
      <div className="flex items-center gap-2">
        <Avatar name={letter.writer.penName} size={20} hue={letter.writer.avatarHue} />
        <span className="caption text-fg-muted">{letter.writer.penName}</span>
        <Meta className="text-fg-faint">·</Meta>
        <Meta>{fmtDate(letter.publishedAt)}</Meta>
        {letter.visibility === "patron" && <PatronMark className="ml-auto" />}
      </div>
      <div>
        <h3 className="title-md m-0 mb-1.5">
          <Link href={letterHref(letter)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {letter.title}
          </Link>
        </h3>
        {letter.excerpt && <p className="m-0 line-clamp-2 font-serif text-base leading-[1.55] text-fg-muted">{letter.excerpt}</p>}
      </div>
      <div className="flex items-center gap-4">
        {letter.readingMinutes && <Meta>{letter.readingMinutes} min</Meta>}
        {letter.mood && <Meta>{MOOD_META[letter.mood].label}</Meta>}
        {read && (
          <Meta className="ml-auto inline-flex items-center gap-1 text-fg-subtle">
            <Icon.bookmarkFill width={12} height={12} /> read
          </Meta>
        )}
      </div>
    </article>
  );
}

/** Square-thumb row from WebTonight's side stack. */
export function LetterRow({ letter, read = false }: { letter: LetterSummary; read?: boolean }) {
  const h = letter.writer.avatarHue;
  return (
    <article className={cx("relative grid grid-cols-[64px_1fr] gap-4 border-b border-line-soft pb-5 md:grid-cols-[80px_1fr] md:gap-[18px]", read && "opacity-60")}>
      <div
        aria-hidden
        className="relative aspect-square rounded-[10px] border border-line-soft"
        style={{ background: `linear-gradient(135deg, oklch(0.40 0.08 ${h}), oklch(0.20 0.04 ${h}))` }}
      >
        {letter.visibility === "patron" && (
          <span className="absolute right-1.5 top-1.5 text-wine-300">
            <Icon.lock />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="title-sm m-0 mb-2 text-[19px] leading-tight">
          <Link href={letterHref(letter)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {letter.title}
          </Link>
        </h3>
        <div className="mb-2 flex items-center gap-2">
          <Avatar name={letter.writer.penName} size={18} hue={h} />
          <span className="caption text-fg">{letter.writer.penName}</span>
        </div>
        <div className="flex gap-3">
          {letter.readingMinutes && <Meta>{letter.readingMinutes} min</Meta>}
          {letter.mood && <Meta>{MOOD_META[letter.mood].label}</Meta>}
          {read && <Meta className="text-fg-subtle">read</Meta>}
          {letter.visibility === "patron" && <span className="sr-only">For patrons</span>}
        </div>
      </div>
    </article>
  );
}
