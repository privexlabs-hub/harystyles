import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";

import { pageDb, requestNow } from "@/server/http/now";
import { getViewer, hasRole } from "@/server/modules/identity";
import { passkeys } from "@/server/modules/identity/infra/schema";
import { getPrefs, lampPrefsOf } from "@/server/modules/preferences";
import { blockedWriters } from "@/server/modules/engagement";
import { recentNotifications } from "@/server/modules/notifications";
import { nextLamp } from "@/server/modules/ration";
import { DisplayForm, ReadingForm, SecurityPanel, UnblockButton } from "@/features/settings/settings-forms";
import { Skeleton } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmtTime } from "@/lib/format";
import type { Mood, ReadingSize, Theme, TypePair } from "@/contracts/enums";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-10">
      <p className="eyebrow m-0 mb-3">Me</p>
      <h1 className="title-display m-0 mb-10">Settings</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Settings />
      </Suspense>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line-soft py-8" aria-labelledby={title}>
      <h2 id={title} className="title-md m-0 mb-5">
        {title}
      </h2>
      {children}
    </section>
  );
}

async function Settings() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/settings");
  const db = await pageDb();
  const p = await getPrefs(db, viewer.id);
  if (!p || !viewer.ageAttested) redirect("/onboarding?next=/settings");
  const [blocked, notes, pk] = await Promise.all([
    blockedWriters(db, viewer.id),
    recentNotifications(db, viewer.id, 10),
    db.select({ n: count() }).from(passkeys).where(eq(passkeys.userId, viewer.id)),
  ]);
  const next = nextLamp(lampPrefsOf(p), await requestNow());
  return (
    <>
      {notes.length > 0 && (
        <Section title="Notices">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {notes.map((n) => (
              <li key={n.id} className="rounded-md border border-line-soft px-4 py-3 text-sm">
                {n.payload.href ? (
                  <Link href={n.payload.href} className="text-fg underline-offset-4 hover:underline">
                    {n.payload.title}
                  </Link>
                ) : (
                  n.payload.title
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Reading">
        <ReadingForm
          initial={{
            displayName: viewer.displayName,
            preferredMoods: p.preferredMoods as Mood[],
            lampMode: p.lampMode as "sunset" | "fixed",
            lampFixedTime: p.lampFixedTime?.slice(0, 5) ?? null,
            hasLocation: Boolean(p.geoCell),
            nextLamp: `${fmtTime(next.at.toISOString(), p.timezone)} (${p.timezone.replace(/_/g, " ")})`,
          }}
        />
      </Section>
      <Section title="Display">
        <DisplayForm initial={{ theme: p.theme as Theme, typePair: p.typePair as TypePair, readingSize: p.readingSize as ReadingSize, dyslexiaFont: p.dyslexiaFont }} />
      </Section>
      <Section title="Sign-in & security">
        <p className="caption m-0 mb-4">{viewer.email}</p>
        <SecurityPanel passkeyCount={pk[0]?.n ?? 0} />
      </Section>
      <Section title="Blocked writers">
        {blocked.length === 0 ? (
          <p className="body-ui m-0">You haven’t blocked anyone.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-md border border-line-soft px-4 py-2">
                <span>{b.penName}</span>
                <UnblockButton userId={b.id} penName={b.penName} />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Writing">
        {hasRole(viewer, "writer") ? (
          <Link href="/studio" className={buttonClass("outline")}>
            Open your writing studio
          </Link>
        ) : (
          <Link href="/studio/apply" className={buttonClass("outline")}>
            Apply to write on harystyles
          </Link>
        )}
      </Section>
      <Section title="Your data">
        <p className="body-ui m-0 mb-4">Your reading history, reactions, kept lines and follows belong to you. They’re never sold or used to train models.</p>
        <a href="/api/v1/me/export" className={buttonClass("secondary")} download>
          Download my shelf (JSON)
        </a>
      </Section>
    </>
  );
}
