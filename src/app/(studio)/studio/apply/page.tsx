import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/server/modules/identity";
import { latestApplication, profileFor } from "@/server/modules/profiles";
import { pageDb } from "@/server/http/now";
import { ApplyForm } from "@/features/studio/forms";
import { BrandLink } from "@/components/ui/brand";
import { Notice, Skeleton } from "@/components/ui/primitives";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Apply to write", robots: { index: false } };

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <BrandLink href="/tonight" />
      <p className="eyebrow mb-3 mt-12">Write on harystyles</p>
      <h1 className="title-display m-0 mb-4">
        Letters, written <span className="italic-display text-accent">slowly.</span>
      </h1>
      <p className="body-ui mb-10 mt-0">
        We’re opening to writers a few at a time. Tell us who you are on the page, share two pieces you’re proud of, and a curator will reply within five working days.
      </p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Apply />
      </Suspense>
    </div>
  );
}

async function Apply() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/studio/apply");
  if (!viewer.ageAttested) redirect("/onboarding?next=/studio/apply");
  const db = await pageDb();
  const profile = await profileFor(db, viewer.id);
  if (profile?.status === "approved" && hasRole(viewer, "writer")) redirect("/studio");
  const last = await latestApplication(db, viewer.id);
  if (last?.status === "pending")
    return <Notice>Your application from {fmtDate(last.createdAt)} is with our curators. We’ll write as soon as there’s a decision.</Notice>;
  return (
    <>
      {last?.status === "waitlisted" && <Notice>You’re on our waitlist. You don’t need to apply again — we’ll be in touch.</Notice>}
      {last?.status === "declined" && (
        <div className="mb-6">
          <Notice>We couldn’t offer a place last time. You’re welcome to apply again 60 days after the decision.</Notice>
        </div>
      )}
      {last?.status !== "waitlisted" && <ApplyForm />}
      <p className="caption mt-8">
        Writers must be 18 or older. <Link href="/tonight" className="underline underline-offset-4">Back to reading</Link>
      </p>
    </>
  );
}
