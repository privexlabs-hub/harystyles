import type { Metadata } from "next";
import { Suspense } from "react";
import { requireCurator } from "@/server/http/console";
import { pendingApplications } from "@/server/modules/profiles";
import { ApplicationDecision } from "@/features/console/components";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Applications", robots: { index: false } };

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Applications />
    </Suspense>
  );
}

async function Applications() {
  const { viewer, db } = await requireCurator();
  const apps = (await pendingApplications(db)).filter((a) => a.app.userId !== viewer.id);
  return (
    <>
      <h1 className="title-display m-0 mb-2">Writer applications</h1>
      <p className="body-ui mb-8 mt-0">Oldest first. Check pen names for impersonation of real people or other writers (BR-WR-04).</p>
      {apps.length === 0 && <EmptyState title="No applications waiting." />}
      <ul className="m-0 flex list-none flex-col gap-6 p-0">
        {apps.map(({ app }) => (
          <li key={app.id} className="rounded-[14px] border border-line-soft bg-bg-elevated p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="title-md m-0">{app.penName}</h2>
              <span className="mono">Applied {fmtDate(app.createdAt)}</span>
            </div>
            <p className="body-ui mt-3">{app.bio}</p>
            {app.samples.map((s, i) => (
              <details key={i} className="mt-3 rounded-md border border-line-soft p-4">
                <summary className="cursor-pointer text-sm text-fg">
                  Sample {i + 1}: {s.title}
                </summary>
                <p className="body-reading mt-3 whitespace-pre-wrap text-base">{s.body}</p>
              </details>
            ))}
            <div className="mt-5">
              <ApplicationDecision id={app.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
