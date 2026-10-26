import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStudio } from "@/server/http/studio";
import { studioLetters } from "@/server/modules/content";
import { statsForLetters } from "@/server/modules/engagement";
import { StudioShell } from "@/components/studio/studio-shell";
import { EmptyState, Meta, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { newLetterAction } from "@/features/studio/actions";
import { MOOD_META, type Mood } from "@/contracts/enums";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

export default function StudioPage() {
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96" />}>
      <Studio />
    </Suspense>
  );
}

/**
 * WebStudio dashboard. Writer-only numbers (BR-EN-02) come from the aggregated letter_stats;
 * patron and earnings cards arrive with Milestone B billing — Studio money only ever comes
 * from the ledger (BR-LD-07), so nothing is shown until it exists.
 */
async function Studio() {
  const { profile, notebooks, db } = await requireStudio();
  const letters = await studioLetters(db, profile.userId);
  const stats = await statsForLetters(db, letters.map((l) => l.id));
  const published = letters.filter((l) => l.status === "published");
  const sum = (k: "kept" | "reads" | "reactions") => [...stats.values()].reduce((s, x) => s + x[k], 0);
  const first = profile.penName.split(" ")[0];
  return (
    <StudioShell active="letters" penName={profile.penName} hue={profile.avatarHue} notebooks={notebooks}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow m-0 mb-2">Your studio</p>
          <h1 className="title-display m-0">
            Welcome back, <span className="italic-display text-accent">{first}.</span>
          </h1>
          <p className="body-ui mb-0 mt-2">
            You’ve published {published.length} {published.length === 1 ? "letter" : "letters"}.
            {profile.status === "suspended" ? " Your profile is suspended, so publishing is paused." : ""}
          </p>
        </div>
        <form action={newLetterAction}>
          <Button type="submit" size="lg" icon={<Icon.feather />} disabled={profile.status !== "approved"}>
            Write a letter
          </Button>
        </form>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(
          [
            ["Letters", published.length, "published"],
            ["Read through", sum("reads"), "readers who finished one"],
            ["Kept lines", sum("kept"), "all-time, by readers"],
            ["Reactions", sum("reactions"), "private to you"],
          ] as const
        ).map(([label, value, sub]) => (
          <div key={label} className="rounded-[14px] border border-line-soft bg-bg-elevated p-5">
            <dt className="mono">{label}</dt>
            <dd className="m-0 mt-2 font-serif text-4xl text-fg-strong">{value.toLocaleString("en-US")}</dd>
            <dd className="caption m-0 mt-1">{sub}</dd>
          </div>
        ))}
      </dl>
      <p className="caption mb-0 mt-3">Patrons and earnings appear here once patronage opens. Only you and our staff ever see these numbers.</p>

      <section className="mt-12" aria-labelledby="letters">
        <h2 id="letters" className="eyebrow mb-3 mt-0">
          Letters
        </h2>
        {letters.length === 0 ? (
          <EmptyState title="Your first letter is waiting." body="Start with a single true sentence. We'll keep everything you write as you go." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="mono">
                  <th className="border-b border-line-soft py-3 font-normal">Letter</th>
                  <th className="w-[110px] border-b border-line-soft py-3 font-normal">Status</th>
                  <th className="w-[100px] border-b border-line-soft py-3 font-normal">Kept</th>
                  <th className="w-[100px] border-b border-line-soft py-3 font-normal">Read</th>
                  <th className="w-[110px] border-b border-line-soft py-3 font-normal">Written</th>
                </tr>
              </thead>
              <tbody>
                {letters.map((l) => {
                  const st = stats.get(l.id);
                  return (
                    <tr key={l.id} className="border-b border-line-soft">
                      <td className="py-4 pr-4">
                        <Link href={`/studio/letters/${l.id}`} className="title-sm hover:underline">
                          {l.title}
                        </Link>
                        {l.mood && <Meta className="ml-3">{MOOD_META[l.mood as Mood].label}</Meta>}
                      </td>
                      <td>
                        <Meta className={l.status === "published" ? (l.visibility === "patron" ? "text-wine-300" : "text-fg-muted") : "text-fg-faint"}>
                          {l.status === "published" ? (l.visibility === "patron" ? "Patron" : "Public") : l.status}
                        </Meta>
                      </td>
                      <td className="mono-num text-sm">{st?.kept ?? 0}</td>
                      <td className="mono-num text-sm">{st?.reads ?? 0}</td>
                      <td>
                        <Meta>{fmtDate(l.publishedAt ?? l.updatedAt, { month: "short", day: "numeric" })}</Meta>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </StudioShell>
  );
}
