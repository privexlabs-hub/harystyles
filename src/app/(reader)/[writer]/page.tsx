import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { pageDb } from "@/server/http/now";
import { getViewer } from "@/server/modules/identity";
import { findWriterBySlug, writerCard, writerNotebooks, writerPublicLetters } from "@/server/modules/content";
import { isFollowing } from "@/server/modules/engagement";
import { MOOD_META, type Mood } from "@/contracts/enums";
import { FollowButton, PatronCta } from "@/components/reader/controls";
import { letterHref } from "@/components/reader/letter-card";
import { Avatar, EmptyState, Meta, PatronMark, Skeleton } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { fmtDate } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/[writer]">): Promise<Metadata> {
  const { writer } = await props.params;
  const found = await findWriterBySlug(await pageDb(), writer);
  if (!found || "redirectTo" in found) return { title: "Writer" };
  return { title: found.profile.penName, description: found.profile.bioQuote ?? `Letters by ${found.profile.penName} on harystyles.` };
}

export default function WriterPage(props: PageProps<"/[writer]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-12 h-72 max-w-[1280px]" />}>
      <Writer params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Writer({ params, searchParams }: { params: PageProps<"/[writer]">["params"]; searchParams: PageProps<"/[writer]">["searchParams"] }) {
  const { writer } = await params;
  const tab = (await searchParams).tab === "patrons" ? "patrons" : "letters";
  const db = await pageDb();
  const found = await findWriterBySlug(db, writer);
  if (!found) notFound();
  if ("redirectTo" in found) permanentRedirect(`/${found.redirectTo}`);
  const p = found.profile;
  const card = writerCard(p);
  const viewer = await getViewer();
  const [all, notebooks, following] = await Promise.all([
    writerPublicLetters(db, p.userId, { limit: 100 }),
    writerNotebooks(db, p.userId),
    isFollowing(db, viewer?.id ?? null, p.userId),
  ]);
  const list = tab === "patrons" ? all.filter((l) => l.visibility === "patron") : all;
  const since = p.approvedAt ? new Date(p.approvedAt).getUTCFullYear() : null;
  const isSelf = viewer?.id === p.userId;
  return (
    <>
      <section className="border-b border-line-soft" style={{ background: "linear-gradient(180deg, color-mix(in oklch, var(--mood-tender) 8%, var(--bg)), var(--bg))" }}>
        <div className="mx-auto grid max-w-[1280px] items-center gap-6 px-4 py-12 md:grid-cols-[auto_1fr_auto] md:gap-10 md:px-10 md:py-16">
          <span className="hidden md:block">
            <Avatar name={card.penName} size={120} hue={card.avatarHue} ring />
          </span>
          <span className="md:hidden">
            <Avatar name={card.penName} size={72} hue={card.avatarHue} ring />
          </span>
          <div className="flex flex-col gap-3">
            <p className="mono m-0">
              Writer{card.locationPhrase ? ` · ${card.locationPhrase.replace(/^writes from /i, "")}` : ""}
              {since ? ` · writing since ${since}` : ""}
            </p>
            <h1 className="title-display m-0 text-[clamp(2.25rem,5vw,3.5rem)]">{card.penName}</h1>
            {card.bioQuote && <p className="italic-display m-0 text-xl text-fg-muted">“{card.bioQuote}”</p>}
            <p className="caption m-0">
              {all.length} {all.length === 1 ? "letter" : "letters"} · {notebooks.length} {notebooks.length === 1 ? "notebook" : "notebooks"} · a pen name
            </p>
          </div>
          {!isSelf && (
            <div className="flex flex-wrap gap-3 md:flex-col">
              <PatronCta penName={card.penName} />
              <FollowButton writerId={card.id} following={following} signedIn={Boolean(viewer)} size="md" />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
        {notebooks.length > 0 && (
          <section aria-labelledby="nb" className="mb-12">
            <h2 id="nb" className="eyebrow mb-4 mt-0">
              Notebooks — read as a series
            </h2>
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
              {notebooks.map((nb) => (
                <Link
                  key={nb.id}
                  href={`/${card.slug}/notebooks/${nb.slug}`}
                  className="flex min-w-[220px] flex-col gap-2 rounded-[14px] border border-line-soft bg-bg-elevated p-5 hover:border-line"
                  style={{ borderLeft: `3px solid var(--mood-${(nb.moodTint as Mood | null) ?? "tender"})` }}
                >
                  <Meta>{nb.publishedCount} letters</Meta>
                  <span className="title-sm">{nb.title}</span>
                  {nb.description && <span className="body-sm">{nb.description}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        <nav aria-label="Writer sections" className="mb-6 flex gap-6 border-b border-line-soft">
          {(
            [
              ["letters", "Letters"],
              ["patrons", "Patron-only"],
            ] as const
          ).map(([id, label]) => (
            <Link
              key={id}
              href={id === "letters" ? `/${card.slug}` : `/${card.slug}?tab=patrons`}
              aria-current={tab === id ? "page" : undefined}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 py-3 text-sm ${tab === id ? "border-accent text-fg" : "border-transparent text-fg-faint hover:text-fg"}`}
            >
              {id === "patrons" && <Icon.lock />}
              {label}
            </Link>
          ))}
        </nav>

        <h2 className="eyebrow mb-2 mt-0">{tab === "patrons" ? "For patrons" : "All letters · newest first"}</h2>
        {list.length === 0 ? (
          <EmptyState title={tab === "patrons" ? "No patron letters yet." : "No letters yet."} body="When the first one is published, it will appear here." />
        ) : (
          <ul className="m-0 list-none p-0">
            {list.map((l) => (
              <li key={l.id} className="relative grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line-soft py-5 md:grid-cols-[1fr_80px_120px_90px_24px]">
                <Link href={letterHref(l)} className="title-sm flex items-center gap-2 after:absolute after:inset-0 after:content-['']">
                  {l.title}
                  {l.visibility === "patron" && <PatronMark />}
                </Link>
                <Meta className="hidden md:block">{l.readingMinutes} min</Meta>
                <Meta className="hidden md:block">{l.mood ? MOOD_META[l.mood].label : ""}</Meta>
                <Meta>{fmtDate(l.publishedAt, { month: "short", day: "numeric" })}</Meta>
                <span className="hidden text-fg-faint md:block">
                  <Icon.arrowRight />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
