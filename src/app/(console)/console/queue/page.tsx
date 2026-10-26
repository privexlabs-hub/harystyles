import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireCurator } from "@/server/http/console";
import { moodQueue } from "@/server/modules/curation";
import { MoodConfirm } from "@/features/console/components";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import type { Mood } from "@/contracts/enums";

export const metadata: Metadata = { title: "Mood queue", robots: { index: false } };

export default function QueuePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Queue />
    </Suspense>
  );
}

async function Queue() {
  const { viewer, db } = await requireCurator();
  const queue = await moodQueue(db, viewer.id);
  return (
    <>
      <h1 className="title-display m-0 mb-2">Mood queue</h1>
      <p className="body-ui mb-8 mt-0">Public letters waiting for a curator’s mood. Your own letters never appear here.</p>
      {queue.length === 0 && <EmptyState title="The queue is clear." />}
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {queue.map((l) => (
          <li key={l.id} className="grid gap-5 rounded-[14px] border border-line-soft bg-bg-elevated p-6 lg:grid-cols-[1fr_380px]">
            <div>
              <Link href={`/${l.writerSlug}/${l.slug}`} className="title-md hover:underline" target="_blank">
                {l.title}
              </Link>
              <p className="caption m-0 mt-1">{l.penName}</p>
              {l.excerpt && <p className="body-sm mt-3">{l.excerpt}</p>}
            </div>
            <MoodConfirm letterId={l.id} writerMood={l.writerMood as Mood | null} />
          </li>
        ))}
      </ul>
    </>
  );
}
