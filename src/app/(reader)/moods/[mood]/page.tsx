import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { pageDb } from "@/server/http/now";
import { moodLetterIds } from "@/server/modules/curation";
import { summariesByIds } from "@/server/modules/content";
import { MOODS, MOOD_META, type Mood } from "@/contracts/enums";
import { LetterCard } from "@/components/reader/letter-card";
import { EmptyState, MoodDot, Skeleton } from "@/components/ui/primitives";

export function generateStaticParams() {
  return MOODS.map((mood) => ({ mood }));
}

export async function generateMetadata(props: PageProps<"/moods/[mood]">): Promise<Metadata> {
  const { mood } = await props.params;
  return MOODS.includes(mood as Mood) ? { title: MOOD_META[mood as Mood].label } : { title: "Mood" };
}

export default function MoodPage(props: PageProps<"/moods/[mood]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-12 h-96 max-w-3xl" />}>
      <Mood params={props.params} />
    </Suspense>
  );
}

/** Curator-confirmed letters for one mood, newest first — no popularity ordering (BR-RA-11). */
async function Mood({ params }: { params: PageProps<"/moods/[mood]">["params"] }) {
  const { mood } = await params;
  if (!MOODS.includes(mood as Mood)) notFound();
  const m = mood as Mood;
  const db = await pageDb();
  const ids = await moodLetterIds(db, m, 30);
  const summaries = await summariesByIds(db, ids);
  const list = ids.map((id) => summaries.get(id)).filter((l) => l !== undefined);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-10">
      <p className="mono m-0 mb-3 flex items-center gap-2">
        <MoodDot mood={m} glow /> {MOOD_META[m].caption}
      </p>
      <h1 className="title-display m-0 mb-8">{MOOD_META[m].label}</h1>
      {list.length ? list.map((l) => <LetterCard key={l.id} letter={l} />) : <EmptyState title="No letters in this mood yet." />}
    </div>
  );
}
