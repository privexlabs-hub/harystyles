import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";

import { pageDb, requestNow } from "@/server/http/now";
import { getViewer } from "@/server/modules/identity";
import { findWriterBySlug, renderForViewer, type LetterDoc } from "@/server/modules/content";
import { computeAnchors } from "@/server/modules/content/domain/document";
import { viewerLetterState } from "@/server/modules/engagement";
import { isAppError } from "@/server/kernel/errors";
import { CONTENT_NOTE_LABEL, MOOD_META } from "@/contracts/enums";
import type { LetterBodyView } from "@/contracts/views";
import { LetterBody } from "@/components/reader/letter-body";
import { ReaderInteractions } from "@/components/reader/reader-interactions";
import { ReadingTracker } from "@/components/reader/reading-tracker";
import { BlockButton, FollowButton, PatronCta, SaveButton } from "@/components/reader/controls";
import { CrisisInterstitial } from "@/components/reader/crisis-interstitial";
import { Avatar, Meta, Skeleton } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { fmtDate } from "@/lib/format";

type Params = PageProps<"/[writer]/[letter]">["params"];

export async function generateMetadata(props: PageProps<"/[writer]/[letter]">): Promise<Metadata> {
  const { writer, letter } = await props.params;
  try {
    // Anonymous render only: metadata/OG must never carry patron text (INV-01).
    const v = await renderForViewer(await pageDb(), { writerSlug: writer, letterSlug: letter }, null, await requestNow());
    const description = v.subtitle ?? (v.excerpt || `A letter by ${v.writer.penName}`);
    return {
      title: `${v.title} — ${v.writer.penName}`,
      description,
      openGraph: { title: v.title, description, type: "article", authors: [v.writer.penName] },
      alternates: { canonical: `/${v.writer.slug}/${v.slug}` },
    };
  } catch {
    return { title: "Letter" };
  }
}

export default function LetterPage(props: PageProps<"/[writer]/[letter]">) {
  return (
    <Suspense fallback={<LetterSkeleton />}>
      <Letter params={props.params} />
    </Suspense>
  );
}

async function Letter({ params }: { params: Params }) {
  const { writer, letter } = await params;
  const db = await pageDb();
  const found = await findWriterBySlug(db, writer);
  if (!found) notFound();
  if ("redirectTo" in found) permanentRedirect(`/${found.redirectTo}/${letter}`); // FX-09
  const viewer = await getViewer();
  let view: LetterBodyView;
  try {
    view = await renderForViewer(db, { writerSlug: writer, letterSlug: letter }, viewer?.id ?? null, await requestNow());
  } catch (e) {
    if (isAppError(e) && e.code === "CONTENT_WITHDRAWN") return <Withdrawn />; // EX-09
    if (isAppError(e)) notFound();
    throw e;
  }
  const full = view.access.level === "full";
  const state = await viewerLetterState(db, viewer?.id ?? null, view.id, view.writer.id, full);
  const doc = view.doc as LetterDoc;
  const engage = Boolean(viewer?.ageAttested) && full && !view.isAuthor;
  const needsInterstitial = view.contentNotes.some((n) => n === "self_harm" || n === "suicide");
  const signedIn = Boolean(viewer);

  return (
    <>
      <div className="sticky top-14 z-[9] border-b border-line-soft bg-bg/95 backdrop-blur md:top-16">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-4 px-4 md:px-10">
          <Link href="/tonight" aria-label="Back to Tonight" className="grid size-11 place-items-center rounded-full text-fg-muted hover:text-fg">
            <Icon.back />
          </Link>
          <Link href={`/${view.writer.slug}`} className="hidden items-center gap-2 sm:flex">
            <Avatar name={view.writer.penName} size={24} hue={view.writer.avatarHue} />
            <span className="text-sm text-fg">{view.writer.penName}</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <ReadingTracker letterId={view.id} targetId="letter-text" enabled={signedIn && full && !view.isAuthor} readingMinutes={view.readingMinutes ?? 1} />
            <SaveButton letterId={view.id} saved={state.saved} signedIn={signedIn} />
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-[calc(62ch+2rem)] px-4 pb-24 pt-12 md:pt-20" aria-labelledby="letter-title">
        <Meta className="mb-6 block">
          Letter · {fmtDate(view.publishedAt)} · {view.mood ? MOOD_META[view.mood].label : ""} · {view.readingMinutes} min
          {view.visibility === "patron" ? " · for patrons" : ""}
        </Meta>
        <h1 id="letter-title" className="m-0 font-serif text-[clamp(2.25rem,6vw,4rem)] font-normal leading-[1.05] tracking-[-0.03em] text-fg-strong [font-variation-settings:'opsz'_144,'SOFT'_30]">
          {view.title}
        </h1>
        {view.subtitle && <p className="italic-display mb-0 mt-5 text-[22px] leading-snug text-fg-muted">{view.subtitle}</p>}
        {view.aiAssisted && <p className="caption mb-0 mt-3">AI-assisted</p>}
        {view.contentNotes.length > 0 && (
          <p className="mt-4 text-sm text-fg-subtle">
            <span className="sr-only">Content notes: </span>
            {view.contentNotes.map((n) => CONTENT_NOTE_LABEL[n]).join(" · ")}
          </p>
        )}
        <div className="my-8 flex flex-wrap items-center gap-3 border-y border-line-soft py-5">
          <Avatar name={view.writer.penName} size={36} hue={view.writer.avatarHue} />
          <div className="flex min-w-0 flex-col">
            <Link href={`/${view.writer.slug}`} className="text-fg">
              {view.writer.penName}
            </Link>
            {view.writer.locationPhrase && <span className="caption">{view.writer.locationPhrase}</span>}
          </div>
          {!view.isAuthor && (
            <span className="ml-auto">
              <FollowButton writerId={view.writer.id} following={state.following} signedIn={signedIn} />
            </span>
          )}
          {view.isAuthor && (
            <ButtonLink href="/studio" variant="ghost" size="sm" className="ml-auto">
              Your studio
            </ButtonLink>
          )}
        </div>

        <div id="letter-text">
          {needsInterstitial && !view.isAuthor ? (
            <CrisisInterstitial letterId={view.id} notes={view.contentNotes}>
              <Body view={view} doc={doc} full={full} engage={engage} reactions={state.myReactions} signedIn={signedIn} />
            </CrisisInterstitial>
          ) : (
            <Body view={view} doc={doc} full={full} engage={engage} reactions={state.myReactions} signedIn={signedIn} />
          )}
        </div>

        {full && (
          <footer className="mt-16 flex flex-col items-center gap-5 border-t border-line-soft pt-10 text-center">
            <span aria-hidden className="text-2xl text-accent">
              ❦
            </span>
            <p className="title-sm m-0 italic">The end of the letter.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {!view.isAuthor && <FollowButton writerId={view.writer.id} following={state.following} signedIn={signedIn} size="md" />}
              {!view.isAuthor && <PatronCta penName={view.writer.penName} />}
              <ButtonLink href="/tonight" variant="ghost" iconRight={<Icon.arrowRight />}>
                Back to tonight
              </ButtonLink>
            </div>
            {view.notebook && (
              <Link href={`/${view.writer.slug}/notebooks/${view.notebook.slug}`} className="caption underline underline-offset-4">
                Part of the notebook “{view.notebook.title}”
              </Link>
            )}
            {signedIn && !view.isAuthor && <BlockButton writerId={view.writer.id} penName={view.writer.penName} />}
          </footer>
        )}
      </article>
    </>
  );
}

function Body({ view, doc, full, engage, reactions, signedIn }: { view: LetterBodyView; doc: LetterDoc; full: boolean; engage: boolean; reactions: Record<string, string>; signedIn: boolean }) {
  if (!full) {
    const first = view.writer.penName.split(" ")[0];
    return (
      <>
        <div className="preview-fade" aria-describedby="patron-note">
          <LetterBody doc={doc} />
        </div>
        <section id="patron-note" className="relative mt-4 flex flex-col items-center gap-4 rounded-[18px] border border-accent bg-bg-elevated p-8 text-center shadow-[var(--shadow-glow)]">
          <span className="amber-orb size-14" aria-hidden />
          <h2 className="title-lg m-0">The rest of this letter is for patrons.</h2>
          <p className="body-ui m-0 max-w-[44ch]">
            Become a patron of {first} for $4/mo and read every letter they write, including the ones for patrons. 90% goes to the writer.
          </p>
          {view.access.cta === "sign_in" ? (
            <ButtonLink href={`/sign-in?next=/${view.writer.slug}/${view.slug}`} variant="outline">
              Sign in
            </ButtonLink>
          ) : (
            <PatronCta penName={view.writer.penName} />
          )}
          <Link href="/tonight" className="caption underline underline-offset-4">
            Maybe later
          </Link>
        </section>
      </>
    );
  }
  return (
    <ReaderInteractions letterId={view.id} initial={reactions as never} enabled={engage} signInHref={signedIn ? null : `/sign-in?next=/${view.writer.slug}/${view.slug}`}>
      <LetterBody doc={doc} anchors={computeAnchors(doc)} reactions={reactions} />
    </ReaderInteractions>
  );
}

function Withdrawn() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span aria-hidden className="text-2xl text-accent">
        ❦
      </span>
      <h1 className="title-lg m-0">This letter was withdrawn by the writer.</h1>
      <p className="body-ui m-0">Any lines you kept from it are still on your shelf.</p>
      <ButtonLink href="/shelf" variant="outline">
        Open your shelf
      </ButtonLink>
    </div>
  );
}

function LetterSkeleton() {
  return (
    <div className="mx-auto max-w-[62ch] px-4 pt-20" aria-busy="true" aria-label="Opening the letter">
      <Skeleton className="mb-6 h-3 w-48" />
      <Skeleton className="mb-4 h-14 w-full" />
      <Skeleton className="mb-12 h-6 w-3/4" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="mb-4 h-5 w-full" />
      ))}
    </div>
  );
}
