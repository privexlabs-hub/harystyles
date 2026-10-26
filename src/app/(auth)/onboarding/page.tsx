import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/modules/identity";
import { pageDb } from "@/server/http/now";
import { approvedWriters } from "@/server/modules/profiles";
import { writerCard } from "@/server/modules/content";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { Skeleton } from "@/components/ui/primitives";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default function OnboardingPage(props: PageProps<"/onboarding">) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="eyebrow m-0">Five letters tonight. Then rest.</p>
        <h1 className="title-display m-0">
          Welcome to <span className="italic-display text-accent">harystyles.</span>
        </h1>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Onboarding searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Onboarding({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const next = safeNext((await searchParams).next);
  const viewer = await getViewer();
  if (!viewer) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (viewer.onboarded && viewer.ageAttested) redirect(next);
  const db = await pageDb();
  // Suggestions are alphabetical, never popularity-ranked (BR-RA-11); the first three approved writers.
  const writers = (await approvedWriters(db, 3)).filter((w) => w.userId !== viewer.id).map(writerCard);
  return <OnboardingFlow writers={writers} next={next} />;
}
