"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BlockId } from "./block-id";
import { publishAction, saveDraftAction, saveSettingsAction, withdrawAction } from "./actions";
import { Button, IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/primitives";
import { CONTENT_NOTES, CONTENT_NOTE_LABEL, MOODS, MOOD_META, type ContentNote, type Mood, type Visibility } from "@/contracts/enums";
import { cx } from "@/lib/cx";

/**
 * WebEditor (screens-web.jsx): calm canvas, autosave every 5 s (brief §8.7), floating toolbar,
 * publish settings. Every save is an immutable revision on the server (BR-LE-03); version
 * conflicts surface instead of silently overwriting (docs/02 §2.5).
 */
type Props = {
  letterId: string;
  status: string;
  slug: string;
  writerSlug: string;
  initialVersion: number;
  initialTitle: string;
  initialSubtitle: string | null;
  initialDoc: unknown;
  initialWords: number;
  settings: { primaryMood: Mood | null; visibility: Visibility; deliverToInbox: boolean; aiAssisted: boolean; notes: ContentNote[]; curatorNotes: ContentNote[]; notebookId: string | null };
  notebooks: { id: string; title: string }[];
  hasUnpublishedChanges: boolean;
  scheduledFor: string | null;
};

const MIN_WORDS = 150;
const countWords = (t: string) => t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;

export function LetterEditor(p: Props) {
  const [title, setTitle] = useState(p.initialTitle === "Untitled letter" ? "" : p.initialTitle);
  const [subtitle, setSubtitle] = useState(p.initialSubtitle ?? "");
  const [words, setWords] = useState(p.initialWords);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [savedAt, setSavedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState(false);
  const [s, setS] = useState(p.settings);
  const [schedule, setSchedule] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const version = useRef(p.initialVersion);
  const dirty = useRef(false);
  const titleRef = useRef(title);
  const subRef = useRef(subtitle);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: false,
      }),
      BlockId,
    ],
    content: p.initialDoc as object,
    editorProps: { attributes: { class: "letter-body min-h-[50vh] outline-none", "aria-label": "Letter body", role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor: e }) => {
      dirty.current = true;
      setSaveState("dirty");
      setWords(countWords(e.getText()));
    },
  });

  const save = useCallback(async (): Promise<boolean> => {
    if (!editor || !dirty.current) return true;
    dirty.current = false;
    setSaveState("saving");
    const r = await saveDraftAction({
      letterId: p.letterId,
      title: titleRef.current,
      subtitle: subRef.current || null,
      // ProseMirror attrs are null-prototype objects, which server actions can't serialize as data —
      // send a plain JSON copy.
      doc: JSON.parse(JSON.stringify(editor.getJSON())) as unknown,
      expectedVersion: version.current,
    });
    if (r.ok) {
      version.current = r.data.version;
      setSavedAt(Date.parse(r.data.savedAt));
      setNow(Date.now());
      setSaveState(dirty.current ? "dirty" : "saved");
      setError(null);
      return true;
    }
    dirty.current = true;
    setSaveState("error");
    setError(r.message);
    return false;
  }, [editor, p.letterId]);

  // Autosave every 5 s while there are changes.
  useEffect(() => {
    const t = setInterval(() => void save(), 5000);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      clearInterval(t);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [save]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const markDirty = () => {
    dirty.current = true;
    setSaveState("dirty");
  };

  const saveSettings = async () => {
    await save();
    const r = await saveSettingsAction({ letterId: p.letterId, primaryMood: s.primaryMood, visibility: s.visibility, deliverToInbox: s.deliverToInbox, aiAssisted: s.aiAssisted, contentNotes: s.notes, notebookId: s.notebookId });
    if (r.ok) {
      version.current = r.data.version;
      setError(null);
      return true;
    }
    setError(r.message);
    return false;
  };

  const publish = () =>
    start(async () => {
      setFieldErrors({});
      if (!(await save())) return;
      if (!(await saveSettings())) return;
      const r = await publishAction({ letterId: p.letterId, expectedVersion: version.current, scheduleAt: schedule ? new Date(schedule).toISOString() : null });
      if (!r.ok) {
        setError(r.message);
        setFieldErrors(r.fields ?? {});
        setPanel(true);
        return;
      }
      router.push(r.data.status === "published" ? `/${p.writerSlug}/${r.data.slug}` : "/studio");
    });

  const seconds = Math.max(0, Math.round((now - savedAt) / 1000));
  const savedLabel =
    saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved changes" : saveState === "error" ? "Not saved" : seconds < 60 ? `Saved ${seconds < 5 ? "just now" : `${seconds} seconds ago`}` : `Saved ${Math.round(seconds / 60)} min ago`;
  const isPublished = p.status === "published";

  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-[10] border-b border-line-soft bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:px-10">
          <Link href="/studio" aria-label="Back to studio" className="grid size-11 place-items-center rounded-full text-fg-muted hover:text-fg">
            <Icon.back />
          </Link>
          <span className="mono" aria-live="polite">
            {p.status === "scheduled" ? "Scheduled" : isPublished ? "Published" : "Draft"} · {savedLabel}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {isPublished && (
              <Link href={`/${p.writerSlug}/${p.slug}`} className="hidden h-8 items-center rounded-full px-3 text-[13px] text-fg hover:bg-bg-elevated sm:inline-flex">
                View
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={() => setPanel((v) => !v)} aria-expanded={panel} aria-controls="publish-settings">
              Settings
            </Button>
            <Button size="sm" onClick={publish} disabled={pending}>
              {pending ? "Publishing…" : schedule ? "Schedule" : isPublished ? "Republish" : "Publish letter"}
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-4 max-w-[calc(62ch+2rem)] px-4">
          <Notice tone="error">
            {error}
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="mb-0 mt-2 pl-5">
                {Object.values(fieldErrors).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </Notice>
        </div>
      )}
      {isPublished && p.hasUnpublishedChanges && (
        <div className="mx-auto mt-4 max-w-[calc(62ch+2rem)] px-4">
          <Notice>Readers still see the published version. Republish when you’re ready to share your edits.</Notice>
        </div>
      )}

      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 md:px-10 lg:grid-cols-[1fr_320px]">
        <div className="mx-auto w-full max-w-[62ch] pt-12">
          <p className="mono m-0 mb-6">
            Letter{s.notebookId ? ` · in notebook: ${p.notebooks.find((n) => n.id === s.notebookId)?.title ?? ""}` : ""}
            {s.visibility === "patron" ? " · patron-only" : ""}
          </p>
          <label htmlFor="title" className="sr-only">
            Title
          </label>
          <textarea
            id="title"
            rows={1}
            value={title}
            maxLength={140}
            placeholder="Title"
            onChange={(e) => {
              setTitle(e.target.value);
              titleRef.current = e.target.value;
              markDirty();
            }}
            className="m-0 w-full resize-none border-0 bg-transparent p-0 font-serif text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.03em] text-fg-strong outline-none placeholder:text-fg-disabled [field-sizing:content]"
          />
          <label htmlFor="subtitle" className="sr-only">
            Subtitle
          </label>
          <textarea
            id="subtitle"
            rows={1}
            value={subtitle}
            maxLength={200}
            placeholder="Subtitle, optional"
            onChange={(e) => {
              setSubtitle(e.target.value);
              subRef.current = e.target.value;
              markDirty();
            }}
            className="italic-display mt-4 w-full resize-none border-0 bg-transparent p-0 text-[22px] text-fg-muted outline-none placeholder:text-fg-disabled [field-sizing:content]"
          />
          <div className="mt-10">
            <EditorContent editor={editor} />
          </div>
        </div>

        <aside id="publish-settings" hidden={!panel} className="lg:block lg:pt-12" aria-label="Publish settings">
          <div className="flex flex-col gap-5 rounded-[14px] border border-line-soft bg-bg-raised p-5 lg:sticky lg:top-24">
            <h2 className="title-sm m-0">Before it goes out</h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mood" className="caption">
                Mood
              </label>
              <select
                id="mood"
                value={s.primaryMood ?? ""}
                onChange={(e) => setS({ ...s, primaryMood: (e.target.value || null) as Mood | null })}
                aria-invalid={Boolean(fieldErrors.primaryMood)}
                className="rounded-md border border-line bg-bg-elevated px-3 py-2.5 text-fg"
              >
                <option value="">Choose a mood…</option>
                {MOODS.map((m) => (
                  <option key={m} value={m}>
                    {MOOD_META[m].label}
                  </option>
                ))}
              </select>
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="caption mb-1.5">Who can read it</legend>
              {(["public", "patron"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2.5 text-sm">
                  <input type="radio" name="vis" checked={s.visibility === v} onChange={() => setS({ ...s, visibility: v, deliverToInbox: v === "public" ? false : s.deliverToInbox })} className="accent-[var(--accent)]" />
                  {v === "public" ? "Everyone" : "Patrons (others see a preview)"}
                </label>
              ))}
              {s.visibility === "patron" && (
                <label className="flex items-center gap-2.5 pl-6 text-sm text-fg-muted">
                  <input type="checkbox" checked={s.deliverToInbox} onChange={(e) => setS({ ...s, deliverToInbox: e.target.checked })} className="accent-[var(--accent)]" />
                  Also send to patrons’ Letters (4 a month)
                </label>
              )}
            </fieldset>
            <fieldset className="m-0 border-0 p-0">
              <legend className="caption mb-2">Content notes</legend>
              <div className="flex flex-wrap gap-2">
                {CONTENT_NOTES.map((n) => {
                  const fromCurator = p.settings.curatorNotes.includes(n);
                  const on = s.notes.includes(n) || fromCurator;
                  return (
                    <label key={n} className={cx("flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs", on ? "border-accent text-fg" : "border-line text-fg-muted", fromCurator && "opacity-70")}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        disabled={fromCurator}
                        onChange={(e) => setS({ ...s, notes: e.target.checked ? [...s.notes, n] : s.notes.filter((x) => x !== n) })}
                      />
                      {CONTENT_NOTE_LABEL[n]}
                      {fromCurator && <span className="sr-only"> (added by a curator)</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notebook" className="caption">
                Notebook
              </label>
              <select id="notebook" value={s.notebookId ?? ""} onChange={(e) => setS({ ...s, notebookId: e.target.value || null })} className="rounded-md border border-line bg-bg-elevated px-3 py-2.5 text-fg">
                <option value="">None</option>
                {p.notebooks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={s.aiAssisted} onChange={(e) => setS({ ...s, aiAssisted: e.target.checked })} className="accent-[var(--accent)]" />
              AI helped with this letter
            </label>
            {!isPublished && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="schedule" className="caption">
                  Schedule (optional)
                </label>
                <input id="schedule" type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="rounded-md border border-line bg-bg-elevated px-3 py-2 text-fg" />
                {p.scheduledFor && <span className="caption">Currently scheduled for {new Date(p.scheduledFor).toLocaleString()}.</span>}
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                start(async () => {
                  if (await saveSettings()) setError(null);
                })
              }
              disabled={pending}
            >
              Save settings
            </Button>
            {(isPublished || p.status === "scheduled") && (
              <button
                type="button"
                className="text-left text-sm text-mood-burning underline-offset-4 hover:underline"
                onClick={() => {
                  if (!confirm(isPublished ? "Withdraw this letter? It disappears from every reader surface. Kept lines stay with their readers." : "Unschedule this letter? It goes back to drafts.")) return;
                  start(async () => {
                    const r = await withdrawAction(p.letterId);
                    if (r.ok) router.push("/studio");
                    else setError(r.message);
                  });
                }}
              >
                {isPublished ? "Withdraw letter" : "Unschedule"}
              </button>
            )}
          </div>
        </aside>
      </div>

      <Toolbar editor={editor} words={words} />
    </div>
  );
}

function Toolbar({ editor, words }: { editor: Editor | null; words: number }) {
  if (!editor) return null;
  const btn = (label: string, active: boolean, run: () => void, child: React.ReactNode) => (
    <IconButton label={label} aria-pressed={active} onClick={run} className={cx("border-transparent", active && "bg-accent-soft text-accent")}>
      {child}
    </IconButton>
  );
  return (
    <div role="toolbar" aria-label="Formatting" className="fixed bottom-6 left-1/2 z-[20] flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-bg-elevated px-2 py-1.5 shadow-[var(--shadow-md)]">
      {btn("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <b className="font-serif">B</b>)}
      {btn("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <i className="font-serif">I</i>)}
      {btn("Quote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <span className="font-serif text-lg">“</span>)}
      {btn("Section heading", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <span className="font-serif">H</span>)}
      {btn("Section break", false, () => editor.chain().focus().setHorizontalRule().run(), <span>—</span>)}
      <span className="mx-1 h-6 w-px bg-line" aria-hidden />
      <span className={cx("px-2 font-mono text-[10px] uppercase", words < MIN_WORDS ? "text-fg-subtle" : "text-accent")} aria-live="polite">
        {words.toLocaleString("en-US")} words{words < MIN_WORDS ? ` · ${MIN_WORDS - words} to go` : ""}
      </span>
    </div>
  );
}
