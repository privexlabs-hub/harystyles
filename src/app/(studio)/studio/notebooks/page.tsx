import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStudio } from "@/server/http/studio";
import { StudioShell } from "@/components/studio/studio-shell";
import { DeleteNotebookButton, NewNotebookForm } from "@/features/studio/forms";
import { EmptyState, Meta, MoodDot, Skeleton } from "@/components/ui/primitives";
import type { Mood } from "@/contracts/enums";

export const metadata: Metadata = { title: "Notebooks", robots: { index: false } };

export default function NotebooksPage() {
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96" />}>
      <Notebooks />
    </Suspense>
  );
}

async function Notebooks() {
  const { profile, notebooks } = await requireStudio();
  return (
    <StudioShell active="notebooks" penName={profile.penName} hue={profile.avatarHue} notebooks={notebooks}>
      <h1 className="title-display m-0 mb-2">Notebooks</h1>
      <p className="body-ui mb-8 mt-0">Group letters into a series. Add a letter to a notebook from its settings in the editor.</p>
      <NewNotebookForm />
      <ul className="m-0 mt-10 flex list-none flex-col gap-3 p-0">
        {notebooks.map((n) => (
          <li key={n.id} className="flex items-center gap-4 rounded-[14px] border border-line-soft bg-bg-elevated p-5">
            <MoodDot mood={(n.moodTint as Mood | null) ?? "tender"} size={10} />
            <div className="flex min-w-0 flex-col">
              <span className="title-sm">{n.title}</span>
              {n.description && <span className="body-sm">{n.description}</span>}
            </div>
            <Meta className="ml-auto">{n.publishedCount} published</Meta>
            <DeleteNotebookButton id={n.id} title={n.title} />
          </li>
        ))}
      </ul>
      {notebooks.length === 0 && <EmptyState title="No notebooks yet." />}
    </StudioShell>
  );
}
