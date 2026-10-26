import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStudio } from "@/server/http/studio";
import { studioEditorState } from "@/server/modules/content";
import { isAppError } from "@/server/kernel/errors";
import { LetterEditor } from "@/features/studio/letter-editor";
import { Skeleton } from "@/components/ui/primitives";
import type { Mood, Visibility } from "@/contracts/enums";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

export default function EditorPage(props: PageProps<"/studio/letters/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-[60vh] max-w-[62ch]" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/studio/letters/[id]">["params"] }) {
  const { id } = await params;
  const { profile, notebooks, db } = await requireStudio();
  const state = await studioEditorState(db, profile.userId, id).catch((e: unknown) => {
    if (isAppError(e)) notFound(); // another writer's letter → 404, never 403 (docs/06 §6.3)
    throw e;
  });
  const l = state.letter;
  return (
    <LetterEditor
      letterId={l.id}
      status={l.status}
      slug={l.slug}
      writerSlug={profile.slug}
      initialVersion={l.version}
      initialTitle={state.title}
      initialSubtitle={state.subtitle}
      initialDoc={state.doc}
      initialWords={state.wordCount}
      settings={{
        primaryMood: l.primaryMood as Mood | null,
        visibility: l.visibility as Visibility,
        deliverToInbox: l.deliverToInbox,
        aiAssisted: l.aiAssisted,
        notes: state.writerNotes,
        curatorNotes: state.curatorNotes,
        notebookId: l.notebookId,
      }}
      notebooks={notebooks.map((n) => ({ id: n.id, title: n.title }))}
      hasUnpublishedChanges={state.hasUnpublishedChanges}
      scheduledFor={l.scheduledFor?.toISOString() ?? null}
    />
  );
}
