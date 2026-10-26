import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireCurator } from "@/server/http/console";
import { evergreenList } from "@/server/modules/curation";
import { EvergreenToggle } from "@/features/console/components";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { MOODS, MOOD_META, type Mood } from "@/contracts/enums";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Evergreen", robots: { index: false } };

export default function EvergreenPage(props: PageProps<"/console/evergreen">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Evergreen searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Evergreen({ searchParams }: { searchParams: PageProps<"/console/evergreen">["searchParams"] }) {
  const { db } = await requireCurator();
  const m = (await searchParams).mood;
  const mood: Mood = MOODS.includes(m as Mood) ? (m as Mood) : "tender";
  const list = await evergreenList(db, mood);
  return (
    <>
      <h1 className="title-display m-0 mb-2">Evergreen pool</h1>
      <p className="body-ui mb-6 mt-0">Public letters used to fill gaps when an evening has no curated issue (BR-CU-05). Add letters from the mood queue.</p>
      <nav aria-label="Mood" className="mb-8 flex flex-wrap gap-2">
        {MOODS.map((x) => (
          <Link key={x} href={`/console/evergreen?mood=${x}`} aria-current={x === mood ? "page" : undefined} className={cx("rounded-full border px-4 py-1.5 text-sm", x === mood ? "border-accent text-fg" : "border-line text-fg-muted")}>
            {MOOD_META[x].label}
          </Link>
        ))}
      </nav>
      {list.length === 0 && <EmptyState title="Nothing in this pool yet." />}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {list.map((l) => (
          <li key={l.id} className={cx("flex items-center gap-4 rounded-[12px] border border-line-soft p-4", !l.active && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm">{l.title}</p>
              <p className="caption m-0">{l.penName}</p>
            </div>
            <EvergreenToggle letterId={l.id} active={l.active} />
          </li>
        ))}
      </ul>
    </>
  );
}
