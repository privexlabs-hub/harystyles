"use client";
import { useState, useTransition } from "react";
import { applyAction, createNotebookAction, deleteNotebookAction, updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Notice, TextArea, TextInput } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { MOODS, MOOD_META } from "@/contracts/enums";

/** brief §8.6: apply with a pen name, a short bio and two samples. */
export function ApplyForm() {
  const [penName, setPen] = useState("");
  const [bio, setBio] = useState("");
  const [samples, setSamples] = useState([{ title: "", body: "" }, { title: "", body: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done)
    return (
      <Notice tone="success">
        Thank you. Our curators read every application and reply within five working days. We’ll email you, and you’ll see the decision in Settings.
      </Notice>
    );
  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await applyAction({ penName, bio, samples });
          if (r.ok) setDone(true);
          else {
            setMsg(r.message);
            setErrors(r.fields ?? {});
          }
        });
      }}
    >
      {msg && <Notice tone="error">{msg}</Notice>}
      <Field label="Pen name" htmlFor="pen" hint="2–40 characters. Your legal name is never shown." error={errors.penName}>
        <TextInput id="pen" value={penName} maxLength={40} onChange={(e) => setPen(e.target.value)} aria-invalid={Boolean(errors.penName)} required />
      </Field>
      <Field label="About you" htmlFor="bio" hint="What do you write about, and why here?" error={errors.bio}>
        <TextArea id="bio" rows={4} value={bio} maxLength={1200} onChange={(e) => setBio(e.target.value)} aria-invalid={Boolean(errors.bio)} />
      </Field>
      {samples.map((s, i) => (
        <fieldset key={i} className="m-0 flex flex-col gap-3 rounded-[14px] border border-line-soft p-5">
          <legend className="px-1 text-sm text-fg">Sample {i + 1}</legend>
          <Field label="Title" htmlFor={`st${i}`} error={errors[`sample${i}Title`]}>
            <TextInput id={`st${i}`} value={s.title} maxLength={140} onChange={(e) => setSamples(samples.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
          </Field>
          <Field label="The writing" htmlFor={`sb${i}`} error={errors[`sample${i}Body`]} hint="At least 200 characters.">
            <TextArea id={`sb${i}`} rows={8} value={s.body} onChange={(e) => setSamples(samples.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
          </Field>
        </fieldset>
      ))}
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send my application"}
        </Button>
      </div>
    </form>
  );
}

export function NewNotebookForm() {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [mood, setMood] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <form
      className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createNotebookAction({ title, description: description || null, moodTint: mood || null });
          if (r.ok) {
            setTitle("");
            setDesc("");
            toast.show("Notebook created.");
          } else toast.show(r.message);
        });
      }}
    >
      <Field label="Title" htmlFor="nbt">
        <TextInput id="nbt" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Description" htmlFor="nbd">
        <TextInput id="nbd" value={description} maxLength={200} onChange={(e) => setDesc(e.target.value)} />
      </Field>
      <Field label="Tint" htmlFor="nbm">
        <select id="nbm" value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-md border border-line bg-bg-elevated px-3 py-3 text-fg">
          <option value="">None</option>
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {MOOD_META[m].label}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" disabled={pending || !title.trim()}>
        Create
      </Button>
    </form>
  );
}

export function DeleteNotebookButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete “${title}”? Its letters stay published; they just leave the notebook.`)) start(async () => void (await deleteNotebookAction(id)));
      }}
    >
      Delete
    </Button>
  );
}

export function ProfileForm({ initial }: { initial: { penName: string; bioQuote: string; locationPhrase: string; previewPercent: number } }) {
  const [s, set] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <form
      className="flex max-w-xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfileAction({ penName: s.penName, bioQuote: s.bioQuote || null, locationPhrase: s.locationPhrase || null, previewPercent: s.previewPercent });
          setErrors(r.ok ? {} : (r.fields ?? {}));
          toast.show(r.ok ? "Profile saved." : r.message);
        });
      }}
    >
      <Field label="Pen name" htmlFor="pn" hint="You can change it once every 90 days; old links keep working." error={errors.penName}>
        <TextInput id="pn" value={s.penName} maxLength={40} onChange={(e) => set({ ...s, penName: e.target.value })} />
      </Field>
      <Field label="A line about you" htmlFor="bq" error={errors.bioQuote}>
        <TextInput id="bq" value={s.bioQuote} maxLength={200} onChange={(e) => set({ ...s, bioQuote: e.target.value })} />
      </Field>
      <Field label="Where you write from (optional)" htmlFor="lp" hint="e.g. “writes from somewhere coastal”" error={errors.locationPhrase}>
        <TextInput id="lp" value={s.locationPhrase} maxLength={60} onChange={(e) => set({ ...s, locationPhrase: e.target.value })} />
      </Field>
      <Field label={`Preview for non-patrons: ${s.previewPercent}%`} htmlFor="pp" hint="How much of a patron letter others can read first (0–30%, cut at a sentence)." error={errors.previewPercent}>
        <input id="pp" type="range" min={0} max={30} step={5} value={s.previewPercent} onChange={(e) => set({ ...s, previewPercent: Number(e.target.value) })} className="accent-[var(--accent)]" />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
