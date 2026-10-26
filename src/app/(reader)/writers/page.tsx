import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pageDb } from "@/server/http/now";
import { approvedWriters } from "@/server/modules/profiles";
import { Avatar, Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Writers" };

export default function WritersPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10">
      <p className="eyebrow m-0 mb-3">Pen names welcome</p>
      <h1 className="title-display m-0 mb-2">
        The <span className="italic-display text-accent">writers.</span>
      </h1>
      <p className="body-ui mb-10 mt-0">In alphabetical order. We don’t rank people here.</p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <WriterList />
      </Suspense>
    </div>
  );
}

async function WriterList() {
  const writers = await approvedWriters(await pageDb());
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {writers.map((w) => (
        <li key={w.userId}>
          <Link href={`/${w.slug}`} className="flex h-full items-start gap-4 rounded-[14px] border border-line-soft bg-bg-elevated p-5 hover:border-line">
            <Avatar name={w.penName} size={48} hue={w.avatarHue} />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="title-sm">{w.penName}</span>
              {w.bioQuote && <span className="body-sm italic">“{w.bioQuote}”</span>}
              {w.locationPhrase && <span className="caption">{w.locationPhrase}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
