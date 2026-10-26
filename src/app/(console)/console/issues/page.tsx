import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireCurator } from "@/server/http/console";
import { requestNow } from "@/server/http/now";
import { eligibleLetters, getIssue } from "@/server/modules/curation";
import { summariesByIds } from "@/server/modules/content";
import { isLocked } from "@/server/modules/curation/domain/issue-policy";
import { addDays } from "@/server/modules/ration/domain/time";
import { IssueBuilder } from "@/features/console/components";
import { Skeleton } from "@/components/ui/primitives";
import { MOODS, MOOD_META, type Mood } from "@/contracts/enums";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Issues", robots: { index: false } };

export default function IssuesPage(props: PageProps<"/console/issues">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Issues searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Issues({ searchParams }: { searchParams: PageProps<"/console/issues">["searchParams"] }) {
  const { viewer, db } = await requireCurator();
  const sp = await searchParams;
  const now = await requestNow();
  const today = now.toISOString().slice(0, 10);
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : addDays(today, 1);
  const mood: Mood = MOODS.includes(sp.mood as Mood) ? (sp.mood as Mood) : "tender";
  const [found, eligible] = await Promise.all([getIssue(db, date, mood), eligibleLetters(db, mood, viewer.id)]);
  const slotIds = found?.slots.map((s) => s.letterId) ?? [];
  const summaries = await summariesByIds(db, slotIds);
  const initial = (found?.slots ?? []).map((s) => {
    const l = summaries.get(s.letterId);
    return { id: s.letterId, title: l?.title ?? "(unavailable)", penName: l?.writer.penName ?? "", writerId: s.writerId };
  });
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end gap-6">
        <div>
          <p className="eyebrow m-0 mb-2">Issue</p>
          <h1 className="title-display m-0">
            {MOOD_META[mood].label}, <span className="italic-display text-accent">{date}</span>
          </h1>
          <p className="caption m-0 mt-2">Locks at 08:00 UTC the day before (BR-CU-04). Plan up to 14 days ahead.</p>
        </div>
        <form className="ml-auto flex flex-wrap items-end gap-3" action="/console/issues">
          <label className="flex flex-col gap-1 text-xs text-fg-subtle">
            Evening
            <input type="date" name="date" defaultValue={date} min={today} max={addDays(today, 14)} className="rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm text-fg" />
          </label>
          <input type="hidden" name="mood" value={mood} />
          <button className="h-10 rounded-full border border-line px-4 text-sm">Go</button>
        </form>
      </div>
      <nav aria-label="Mood" className="mb-8 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <Link key={m} href={`/console/issues?date=${date}&mood=${m}`} aria-current={m === mood ? "page" : undefined} className={cx("rounded-full border px-4 py-1.5 text-sm", m === mood ? "border-accent text-fg" : "border-line text-fg-muted")}>
            {MOOD_META[m].label}
          </Link>
        ))}
      </nav>
      <IssueBuilder
        key={`${date}-${mood}-${found?.issue.version ?? 0}`}
        eveningDate={date}
        mood={mood}
        initial={initial}
        candidates={eligible.map((e) => ({ id: e.id, title: e.title, penName: e.penName, writerId: e.writerId }))}
        status={found?.issue.status ?? null}
        locked={isLocked(date, now) || ["locked", "live"].includes(found?.issue.status ?? "")}
      />
    </>
  );
}
