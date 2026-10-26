import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pageDb } from "@/server/http/now";
import { moodLetterCounts, moodLetterIds } from "@/server/modules/curation";
import { summariesByIds } from "@/server/modules/content";
import { MOODS, MOOD_META, type Mood } from "@/contracts/enums";
import { LetterCard } from "@/components/reader/letter-card";
import { MoodDot, Skeleton } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Moods", description: "Read by feeling, not by topic." };

export default function MoodsPage() {
  return (
    <>
      <section className="mx-auto max-w-[1280px] px-4 pb-8 pt-10 md:px-10 md:pt-14">
        <p className="eyebrow m-0 mb-3">Read by feeling — not by topic</p>
        <h1 className="m-0 font-serif text-[clamp(2.5rem,6vw,4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-fg-strong">
          What did you bring <span className="italic-display text-accent">home tonight?</span>
        </h1>
      </section>
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-[1280px]" />}>
        <MoodGrid />
      </Suspense>
    </>
  );
}

async function MoodGrid() {
  const db = await pageDb();
  const counts = await moodLetterCounts(db);
  const featured: Mood = "tender";
  const ids = await moodLetterIds(db, featured, 4);
  const summaries = await summariesByIds(db, ids);
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-20 md:px-10">
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {MOODS.map((m) => (
          <li key={m}>
            <Link
              href={`/moods/${m}`}
              className="flex aspect-[5/3] flex-col justify-between rounded-2xl border p-6 transition-colors"
              style={{ background: `color-mix(in oklch, var(--mood-${m}) 14%, var(--bg-card))`, borderColor: `color-mix(in oklch, var(--mood-${m}) 40%, transparent)` }}
            >
              <MoodDot mood={m} size={14} glow />
              <span>
                <span className="block font-serif text-4xl text-fg-strong">{MOOD_META[m].label}</span>
                <span className="caption">{MOOD_META[m].caption}</span>
                <span className="mono mt-2 block">{counts[m]} letters</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-16" aria-labelledby="editorial">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono m-0 mb-2 flex items-center gap-2" style={{ color: `var(--mood-${featured})` }}>
              ● {MOOD_META[featured].label} · {counts[featured]} letters
            </p>
            <h2 id="editorial" className="title-lg m-0">
              For the kind of evening that <span className="italic-display text-accent">asks for quiet.</span>
            </h2>
          </div>
          <ButtonLink href={`/moods/${featured}`} variant="ghost">
            See all {MOOD_META[featured].label.toLowerCase()}
          </ButtonLink>
        </div>
        <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-4">
          {ids.map((id) => summaries.get(id)).filter((l) => l !== undefined).map((l) => <LetterCard key={l.id} letter={l} />)}
        </div>
      </section>
    </div>
  );
}
