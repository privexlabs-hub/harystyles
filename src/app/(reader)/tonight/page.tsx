import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/modules/identity";

import { pageDb, requestNow } from "@/server/http/now";
import { anonymousTonight, getTonight, type TonightView } from "@/server/modules/ration";
import { isValidTimeZone } from "@/server/modules/ration/domain/time";
import { DEFAULT_ANON_MOOD, MOODS, MOOD_META, type Mood } from "@/contracts/enums";
import { LetterRow, letterHref } from "@/components/reader/letter-card";
import { MoodSwitcher } from "@/components/reader/controls";
import { Avatar, EmptyState, Meta, Skeleton } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmtLongDate, fmtTime } from "@/lib/format";

export const metadata: Metadata = { title: "Tonight" };

export default function TonightPage(props: PageProps<"/tonight">) {
  return (
    <Suspense fallback={<TonightSkeleton />}>
      <Tonight searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Tonight({ searchParams }: { searchParams: PageProps<"/tonight">["searchParams"] }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const db = await pageDb();
  const now = await requestNow();
  let view: TonightView | null;
  if (viewer) {
    if (!viewer.onboarded || !viewer.ageAttested) redirect("/onboarding?next=/tonight");
    view = await getTonight(db, viewer.id, now);
    if (!view) redirect("/onboarding?next=/tonight");
  } else {
    // BR-RA-10: anonymous mood is per-session (query string); nothing is stored server-side.
    const mood = MOODS.includes(sp.mood as Mood) ? (sp.mood as Mood) : DEFAULT_ANON_MOOD;
    const tz = (await cookies()).get("hs_tz")?.value;
    view = await anonymousTonight(db, mood, tz && isValidTimeZone(tz) ? tz : "UTC", now);
  }
  return <TonightBody view={view} />;
}

function TonightBody({ view }: { view: TonightView }) {
  const active = view.slots.filter((s) => s.state === "active" && s.letter);
  const unread = active.filter((s) => !s.read);
  const allRead = active.length > 0 && unread.length === 0;
  const featured = unread[0] ?? active[0];
  const rest = view.slots.filter((s) => s !== featured);
  const next = fmtTime(view.nextLampAt, view.timezone);
  return (
    <>
      <section className="mx-auto max-w-[1280px] border-b border-line-soft px-4 pb-10 pt-10 md:px-10 md:pt-[60px]">
        <p className="mono m-0 mb-3.5 flex items-center gap-2 text-accent">
          <span className="glow-dot" aria-hidden /> Tonight, {fmtLongDate(view.eveningDate)} · {active.length === 5 ? "five letters" : `${active.length} letters`}
        </p>
        <h1 className="m-0 max-w-[16ch] font-serif text-[clamp(2.75rem,8vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.035em] text-fg-strong [font-variation-settings:'opsz'_144,'SOFT'_30]">
          You came home <span className="italic-display text-accent">a little {MOOD_META[view.mood].label.toLowerCase()}.</span>
        </h1>
        <p className="body-reading mb-0 mt-5 max-w-[52ch] text-[18px] text-fg-muted">
          Five letters, picked for the mood you arrived in. Read them in any order. When you’re done, the lamp goes out; the next is lit at {next}.
        </p>
        <div className="mt-5">
          <MoodSwitcher current={view.mood} allowed={view.canSwitchMood} anonymous={view.anonymous} />
        </div>
        {view.anonymous && (
          <p className="caption mb-0 mt-4">
            <Link href="/sign-in?next=/tonight" className="text-accent underline underline-offset-4">
              Sign in
            </Link>{" "}
            to get your own five each evening, at your own sunset.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-20 pt-10 md:px-10 md:pt-12">
        {active.length === 0 ? (
          <EmptyState
            title="The lamp is lit, but the shelf is quiet."
            body="There are no letters for this mood yet tonight. Try another mood, or find a writer to follow."
            action={
              <Link href="/writers" className={buttonClass("outline", "md")}>
                Find a writer
              </Link>
            }
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {featured?.letter && (
              <article className="relative">
                <div
                  aria-hidden
                  className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[14px] border border-line-soft"
                  style={{ background: `linear-gradient(135deg, var(--mood-${featured.letter.mood ?? view.mood}), var(--wine-700))` }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,transparent,rgba(0,0,0,0.5))]" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase text-[var(--ink-100)] backdrop-blur-md">
                    ● {featured.read ? "Read · tonight" : "Featured · tonight"}
                  </span>
                </div>
                <Meta className="mb-2.5 block text-[9px]">
                  Letter · {featured.letter.readingMinutes} min · {featured.letter.mood ? MOOD_META[featured.letter.mood].label : ""}
                  {featured.letter.visibility === "patron" ? " · patron" : ""}
                </Meta>
                <h2 className="title-display m-0 mb-3.5 max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05]">
                  <Link href={letterHref(featured.letter)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                    {featured.letter.title}
                  </Link>
                </h2>
                {featured.letter.excerpt && <p className="body-reading m-0 mb-4 max-w-[50ch] text-[17px] text-fg-muted">{featured.letter.excerpt}</p>}
                <div className="flex items-center gap-2.5">
                  <Avatar name={featured.letter.writer.penName} size={28} hue={featured.letter.writer.avatarHue} />
                  <span className="body-sm text-fg">{featured.letter.writer.penName}</span>
                  {featured.source === "follow" && <Meta className="text-fg-subtle">· from someone you follow</Meta>}
                </div>
              </article>
            )}
            <div className="flex flex-col gap-[22px]">
              {rest.map((s) =>
                s.state === "tombstoned" || !s.letter ? (
                  <p key={s.position} className="caption m-0 border-b border-line-soft pb-5 italic">
                    This letter was withdrawn by the writer.
                  </p>
                ) : (
                  <LetterRow key={s.position} letter={s.letter} read={s.read} />
                ),
              )}
            </div>
          </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span aria-hidden className="text-2xl text-accent">
            ❦
          </span>
          <p className="title-sm m-0 italic">{allRead ? "That's all for tonight." : "That's tonight's five."}</p>
          <p className="caption m-0">
            The lamp will be lit again at {next}
            {view.short ? ". Tonight's shelf was a little short; there are more letters coming." : "."}
          </p>
          <p className="caption m-0">
            Or{" "}
            <Link href="/writers" className="text-fg underline underline-offset-4">
              find a writer
            </Link>{" "}
            to read on purpose.
          </p>
        </div>
      </section>
    </>
  );
}

function TonightSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-12 md:px-10" aria-busy="true" aria-label="Lighting the lamp">
      <Skeleton className="mb-4 h-3 w-56" />
      <Skeleton className="mb-3 h-16 w-full max-w-2xl" />
      <Skeleton className="mb-12 h-5 w-full max-w-xl" />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="aspect-[16/10]" />
        <div className="flex flex-col gap-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}
