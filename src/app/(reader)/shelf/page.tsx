import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { pageDb } from "@/server/http/now";
import { getViewer } from "@/server/modules/identity";
import { followedWriters, keptLinesFor, savedLetterIds } from "@/server/modules/engagement";
import { summariesByIds } from "@/server/modules/content";
import type { Mood } from "@/contracts/enums";
import { LetterCard } from "@/components/reader/letter-card";
import { Avatar, EmptyState, Skeleton } from "@/components/ui/primitives";
import { RemoveKeptButton } from "@/features/shelf/remove-kept-button";

export const metadata: Metadata = { title: "Your shelf", robots: { index: false } };

const TABS = [
  ["kept", "Kept lines"],
  ["saved", "Saved letters"],
  ["following", "Following"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function ShelfPage(props: PageProps<"/shelf">) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10">
      <p className="eyebrow m-0 mb-3">Your shelf · private to you</p>
      <h1 className="title-display m-0 mb-3">
        The lines that <span className="italic-display text-accent">stayed.</span>
      </h1>
      <p className="body-ui m-0 mb-8 max-w-[60ch]">What you keep here is never shown to writers, never used to recommend things, and never shared.</p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Shelf searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Shelf({ searchParams }: { searchParams: PageProps<"/shelf">["searchParams"] }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/shelf");
  const t = (await searchParams).tab;
  const tab: Tab = t === "saved" || t === "following" ? t : "kept";
  const db = await pageDb();
  const [kept, savedIds, following] = await Promise.all([keptLinesFor(db, viewer.id), savedLetterIds(db, viewer.id), followedWriters(db, viewer.id)]);
  const counts: Record<Tab, number> = { kept: kept.length, saved: savedIds.length, following: following.length };
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line-soft">
        <nav aria-label="Shelf sections" className="flex gap-6">
          {TABS.map(([id, label]) => (
            <Link
              key={id}
              href={id === "kept" ? "/shelf" : `/shelf?tab=${id}`}
              aria-current={tab === id ? "page" : undefined}
              className={`-mb-px border-b-2 py-3 text-sm ${tab === id ? "border-accent text-fg" : "border-transparent text-fg-faint hover:text-fg"}`}
            >
              {label} <span className="font-mono text-[10px] text-fg-subtle">{counts[id]}</span>
            </Link>
          ))}
        </nav>
        <a href="/api/v1/me/export" className="caption py-3 underline underline-offset-4" download>
          Export as JSON
        </a>
      </div>

      {tab === "kept" &&
        (kept.length === 0 ? (
          <EmptyState title="Nothing kept yet." body="Select a sentence in any letter and choose “Keep line”. It will wait for you here." />
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
            {kept.map((k) => (
              <li key={k.id} className="flex flex-col gap-4 rounded-[14px] border border-line-soft bg-bg-elevated p-6" style={{ borderLeft: `3px solid var(--mood-${(k.mood as Mood | null) ?? "tender"})` }}>
                <span aria-hidden className="text-accent">
                  ❦
                </span>
                <blockquote className="pullquote m-0 text-[clamp(1.2rem,2vw,1.45rem)] text-fg-strong">{k.text}</blockquote>
                <p className="caption m-0">
                  — {k.penName}, <span className="italic">{k.title}</span>
                </p>
                <div className="mt-auto flex justify-end">
                  <RemoveKeptButton id={k.id} />
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "saved" && <Saved ids={savedIds} />}

      {tab === "following" &&
        (following.length === 0 ? (
          <EmptyState title="You're not following anyone yet." body="Follow a writer and their newest letters can find you on Tonight. Nobody else can see who you follow." />
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {following.map((w) => (
              <li key={w.id}>
                <Link href={`/${w.slug}`} className="flex items-center gap-3 rounded-[14px] border border-line-soft p-4 hover:border-line">
                  <Avatar name={w.penName} size={40} hue={w.avatarHue} />
                  <span className="flex flex-col">
                    <span>{w.penName}</span>
                    {w.bioQuote && <span className="caption italic">{w.bioQuote}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}

async function Saved({ ids }: { ids: string[] }) {
  if (!ids.length) return <EmptyState title="No saved letters." body="Use the bookmark on any letter to keep it to read again." />;
  const summaries = await summariesByIds(await pageDb(), ids);
  const list = ids.map((id) => summaries.get(id)).filter((l) => l !== undefined);
  return (
    <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
      {list.map((l) => (
        <LetterCard key={l.id} letter={l} />
      ))}
    </div>
  );
}
