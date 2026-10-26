import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStudio } from "@/server/http/studio";
import { StudioShell } from "@/components/studio/studio-shell";
import { ProfileForm } from "@/features/studio/forms";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96" />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const { profile, notebooks } = await requireStudio();
  return (
    <StudioShell active="profile" penName={profile.penName} hue={profile.avatarHue} notebooks={notebooks}>
      <h1 className="title-display m-0 mb-2">Profile</h1>
      <p className="body-ui mb-8 mt-0">
        Your public page:{" "}
        <Link href={`/${profile.slug}`} className="text-accent underline underline-offset-4">
          /{profile.slug}
        </Link>
        . Payouts and legal identity are handled by our payment provider when patronage opens — they’re never stored or shown here.
      </p>
      <ProfileForm initial={{ penName: profile.penName, bioQuote: profile.bioQuote ?? "", locationPhrase: profile.locationPhrase ?? "", previewPercent: profile.previewPercent }} />
    </StudioShell>
  );
}
