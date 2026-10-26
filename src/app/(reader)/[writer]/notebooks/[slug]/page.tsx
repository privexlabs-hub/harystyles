import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { pageDb } from "@/server/http/now";
import { findWriterBySlug, notebookBySlug, summariesByIds } from "@/server/modules/content";
import { LetterCard } from "@/components/reader/letter-card";
import { EmptyState, Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Notebook" };

export default function NotebookPage(props: PageProps<"/[writer]/notebooks/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-12 h-72 max-w-3xl" />}>
      <Notebook params={props.params} />
    </Suspense>
  );
}

async function Notebook({ params }: { params: PageProps<"/[writer]/notebooks/[slug]">["params"] }) {
  const { writer, slug } = await params;
  const db = await pageDb();
  const found = await findWriterBySlug(db, writer);
  if (!found) notFound();
  if ("redirectTo" in found) permanentRedirect(`/${found.redirectTo}/notebooks/${slug}`);
  const nb = await notebookBySlug(db, found.profile.userId, slug);
  if (!nb) notFound();
  const summaries = await summariesByIds(db, nb.letterIds);
  const ordered = nb.letterIds.map((id) => summaries.get(id)).filter((l) => l !== undefined);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-10">
      <p className="eyebrow m-0">
        A notebook by{" "}
        <Link href={`/${found.profile.slug}`} className="text-fg underline underline-offset-4">
          {found.profile.penName}
        </Link>
      </p>
      <h1 className="title-display mb-3 mt-3">{nb.notebook.title}</h1>
      {nb.notebook.description && <p className="body-reading m-0 text-fg-muted">{nb.notebook.description}</p>}
      <ol className="m-0 mt-10 list-none p-0">
        {ordered.map((l, i) => (
          <li key={l.id} className="relative">
            <span className="mono absolute -left-10 top-7 hidden md:block">{String(i + 1).padStart(2, "0")}</span>
            <LetterCard letter={l} />
          </li>
        ))}
      </ol>
      {ordered.length === 0 && <EmptyState title="This notebook is still being written." />}
    </div>
  );
}
