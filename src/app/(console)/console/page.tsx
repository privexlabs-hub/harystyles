import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireCurator } from "@/server/http/console";
import { requestNow } from "@/server/http/now";
import { evergreenCounts, issuesInRange, moodQueue } from "@/server/modules/curation";
import { pendingApplications } from "@/server/modules/profiles";
import { EVERGREEN_ALERT, EVERGREEN_MIN } from "@/server/modules/curation/domain/issue-policy";
import { addDays } from "@/server/modules/ration/domain/time";
import { MOODS, MOOD_META } from "@/contracts/enums";
import { Skeleton } from "@/components/ui/primitives";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Console", robots: { index: false } };

export default function ConsolePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const { viewer, db } = await requireCurator();
  const today = (await requestNow()).toISOString().slice(0, 10);
  const end = addDays(today, 13);
  const [apps, queue, issues, pool] = await Promise.all([pendingApplications(db), moodQueue(db, viewer.id, 200), issuesInRange(db, today, end), evergreenCounts(db)]);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const byKey = new Map(issues.map((i) => [`${i.eveningDate}|${i.mood}`, i]));
  return (
    <>
      <h1 className="title-display m-0 mb-8">Tonight’s shelves</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/console/applications" className="rounded-[14px] border border-line-soft bg-bg-elevated p-5">
          <p className="mono m-0">Applications waiting</p>
          <p className="m-0 mt-2 font-serif text-4xl">{apps.length}</p>
          <p className="caption m-0">Reply within 5 working days (BR-WR-06)</p>
        </Link>
        <Link href="/console/queue" className="rounded-[14px] border border-line-soft bg-bg-elevated p-5">
          <p className="mono m-0">Letters awaiting mood</p>
          <p className="m-0 mt-2 font-serif text-4xl">{queue.length}</p>
          <p className="caption m-0">Confirmed letters become eligible for issues</p>
        </Link>
        <Link href="/console/evergreen" className="rounded-[14px] border border-line-soft bg-bg-elevated p-5">
          <p className="mono m-0">Evergreen pool</p>
          <p className="m-0 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {MOODS.map((m) => (
              <span key={m} className={cx(pool[m] < EVERGREEN_MIN ? "text-mood-burning" : pool[m] < EVERGREEN_ALERT ? "text-accent" : "text-fg")}>
                {MOOD_META[m].label} {pool[m]}
              </span>
            ))}
          </p>
          <p className="caption m-0 mt-1">Minimum {EVERGREEN_MIN} per mood; alert below {EVERGREEN_ALERT} (BR-CU-05)</p>
        </Link>
      </div>
      <section className="mt-12" aria-labelledby="schedule">
        <h2 id="schedule" className="eyebrow mb-3 mt-0">
          Next 14 evenings
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="mono py-2 text-left font-normal">Evening</th>
                {MOODS.map((m) => (
                  <th key={m} className="mono py-2 text-left font-normal">
                    {MOOD_META[m].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d} className="border-t border-line-soft">
                  <td className="py-2 pr-4 font-mono text-xs">{d}</td>
                  {MOODS.map((m) => {
                    const i = byKey.get(`${d}|${m}`);
                    return (
                      <td key={m} className="py-1.5 pr-2">
                        <Link
                          href={`/console/issues?date=${d}&mood=${m}`}
                          className={cx(
                            "inline-flex min-w-24 rounded-md border px-2 py-1 text-xs",
                            !i ? "border-dashed border-line text-fg-faint" : i.status === "draft" ? "border-accent/50 text-accent" : "border-line text-fg",
                          )}
                        >
                          {i ? `${i.status}${i.source === "evergreen" ? " · ev" : ""} · ${i.slots}/5` : "plan"}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
