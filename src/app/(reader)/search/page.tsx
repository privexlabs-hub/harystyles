import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { pageDb, requestNow } from "@/server/http/now";
import { getViewer } from "@/server/modules/identity";
import { search } from "@/server/modules/search";
import { blockedUserIds } from "@/server/modules/engagement";
import { rateLimit } from "@/server/kernel/rate-limit";
import { isAppError } from "@/server/kernel/errors";
import { LetterCard } from "@/components/reader/letter-card";
import { Avatar, EmptyState, Notice, Skeleton } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-10">
      <h1 className="title-display m-0 mb-6">
        Search <span className="italic-display text-accent">on purpose.</span>
      </h1>
      <form role="search" action="/search" className="relative mb-10">
        <label htmlFor="q" className="sr-only">
          Search letters and writers
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-faint">
          <Icon.search />
        </span>
        <Suspense fallback={<input id="q" name="q" className="h-12 w-full rounded-full border border-line bg-bg-elevated pl-11 pr-4" />}>
          <SearchInput searchParams={props.searchParams} />
        </Suspense>
      </form>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchInput({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const q = (await searchParams).q;
  return (
    <input
      id="q"
      name="q"
      type="search"
      defaultValue={typeof q === "string" ? q : ""}
      placeholder="A title, a phrase, a pen name"
      autoComplete="off"
      className="h-12 w-full rounded-full border border-line bg-bg-elevated pl-11 pr-4 text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none"
    />
  );
}

/** Relevance, then date — never trending (BR-RA-11). Patron bodies are never indexed (INV-18). */
async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim() : "";
  if (q.length < 2) return <p className="body-ui m-0">Letters are found by title, writer, and their public words. There’s no trending list.</p>;
  const db = await pageDb();
  const viewer = await getViewer();
  try {
    await rateLimit(db, "search", viewer?.id ?? "anon", await requestNow());
  } catch (e) {
    if (isAppError(e)) return <Notice tone="error">{e.message}</Notice>;
    throw e;
  }
  const res = await search(db, q, viewer ? await blockedUserIds(db, viewer.id) : new Set());
  if (!res.letters.length && !res.writers.length) return <EmptyState title="Nothing quite matched." body="Try fewer words, or a writer's pen name." />;
  return (
    <>
      {res.writers.length > 0 && (
        <section aria-labelledby="w" className="mb-10">
          <h2 id="w" className="eyebrow mb-3 mt-0">
            Writers
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {res.writers.map((w) => (
              <li key={w.id}>
                <Link href={`/${w.slug}`} className="flex items-center gap-2 rounded-full border border-line px-3 py-2 hover:border-line-strong">
                  <Avatar name={w.penName} size={24} hue={w.avatarHue} />
                  <span className="text-sm">{w.penName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {res.letters.length > 0 && (
        <section aria-labelledby="l">
          <h2 id="l" className="eyebrow mb-1 mt-0">
            Letters
          </h2>
          {res.letters.map((l) => (
            <LetterCard key={l.id} letter={l} />
          ))}
        </section>
      )}
    </>
  );
}
