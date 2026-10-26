"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIssueAction, confirmMoodAction, decideApplicationAction, saveIssueAction, setEvergreenAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Notice, TextArea, TextInput } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CONTENT_NOTES, CONTENT_NOTE_LABEL, MOODS, MOOD_META, type ContentNote, type Mood } from "@/contracts/enums";
import { cx } from "@/lib/cx";

export function ApplicationDecision({ id }: { id: string }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const decide = (decision: "approved" | "waitlisted" | "declined") =>
    start(async () => {
      const r = await decideApplicationAction({ applicationId: id, decision, note: note || null });
      toast.show(r.ok ? `Application ${decision}.` : r.message);
    });
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={`note-${id}`} className="caption">
        Note to the applicant (optional)
      </label>
      <TextArea id={`note-${id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => decide("approved")} disabled={pending}>
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => decide("waitlisted")} disabled={pending}>
          Waitlist
        </Button>
        <Button size="sm" variant="ghost" onClick={() => decide("declined")} disabled={pending}>
          Decline
        </Button>
      </div>
    </div>
  );
}

export function MoodConfirm({ letterId, writerMood }: { letterId: string; writerMood: Mood | null }) {
  const [mood, setMood] = useState<Mood | "">(writerMood ?? "");
  const [notes, setNotes] = useState<ContentNote[]>([]);
  const [evergreen, setEvergreen] = useState(true);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`m-${letterId}`} className="caption">
          Mood
        </label>
        <select id={`m-${letterId}`} value={mood} onChange={(e) => setMood(e.target.value as Mood)} className="rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm text-fg">
          <option value="">Choose…</option>
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {MOOD_META[m].label}
              {m === writerMood ? " (writer's choice)" : ""}
            </option>
          ))}
        </select>
        <label className="ml-2 flex items-center gap-2 text-sm text-fg-muted">
          <input type="checkbox" checked={evergreen} onChange={(e) => setEvergreen(e.target.checked)} className="accent-[var(--accent)]" /> Add to evergreen pool
        </label>
      </div>
      <details>
        <summary className="caption cursor-pointer">Add content notes</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTENT_NOTES.map((n) => (
            <label key={n} className={cx("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", notes.includes(n) ? "border-accent" : "border-line text-fg-muted")}>
              <input type="checkbox" className="sr-only" checked={notes.includes(n)} onChange={(e) => setNotes(e.target.checked ? [...notes, n] : notes.filter((x) => x !== n))} />
              {CONTENT_NOTE_LABEL[n]}
            </label>
          ))}
        </div>
      </details>
      <div>
        <Button
          size="sm"
          disabled={!mood || pending}
          onClick={() =>
            start(async () => {
              const r = await confirmMoodAction({ letterId, mood, addNotes: notes, toEvergreen: evergreen });
              toast.show(r.ok ? "Mood confirmed." : r.message);
            })
          }
        >
          Confirm mood
        </Button>
      </div>
    </div>
  );
}

type Candidate = { id: string; title: string; penName: string; writerId: string };

/** Issue builder (brief §8.9): five distinct writers, curated order, live rule checks (BR-CU-01..07). */
export function IssueBuilder({
  eveningDate,
  mood,
  initial,
  candidates,
  status,
  locked,
}: {
  eveningDate: string;
  mood: Mood;
  initial: Candidate[];
  candidates: Candidate[];
  status: string | null;
  locked: boolean;
}) {
  const [slots, setSlots] = useState<Candidate[]>(initial);
  const [reason, setReason] = useState("");
  const [violations, setViolations] = useState<{ code: string; message: string; severity: string; letterId?: string }[]>([]);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const ids = slots.map((s) => s.id);

  const idKey = ids.join(",");
  useEffect(() => {
    let live = true;
    const letterIds = idKey ? idKey.split(",") : [];
    void checkIssueAction({ eveningDate, mood, letterIds, schedule: letterIds.length === 5 }).then((r) => live && r.ok && setViolations(r.data));
    return () => {
      live = false;
    };
  }, [idKey, eveningDate, mood]);

  const move = (i: number, d: -1 | 1) => {
    const n = [...slots];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j]!, n[i]!];
    setSlots(n);
  };
  const errors = violations.filter((v) => v.severity === "error");
  const save = (schedule: boolean) =>
    start(async () => {
      const r = await saveIssueAction({ eveningDate, mood, letterIds: ids, schedule, reason: reason || null });
      toast.show(r.ok ? (r.data.status === "scheduled" ? "Issue scheduled." : r.data.status === "locked" ? "Hot swap saved." : "Draft saved.") : r.message);
      if (r.ok) router.refresh();
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="slots">
        <h2 id="slots" className="eyebrow mb-3 mt-0">
          Tonight’s five {status && <span className="text-fg-muted">· {status}</span>}
        </h2>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {[0, 1, 2, 3, 4].map((i) => {
            const s = slots[i];
            const v = s ? violations.filter((x) => x.letterId === s.id) : [];
            return (
              <li key={i} className={cx("flex min-h-16 items-center gap-3 rounded-[12px] border p-3", s ? "border-line bg-bg-elevated" : "border-dashed border-line-soft")}>
                <span className="mono w-5">{i + 1}</span>
                {s ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm text-fg">{s.title}</p>
                      <p className="caption m-0">{s.penName}</p>
                      {v.map((x) => (
                        <p key={x.code} className={cx("m-0 text-xs", x.severity === "error" ? "text-mood-burning" : "text-accent")}>
                          {x.message}
                        </p>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" aria-label={`Move ${s.title} up`} onClick={() => move(i, -1)}>
                      ↑
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Move ${s.title} down`} onClick={() => move(i, 1)}>
                      ↓
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Remove ${s.title}`} onClick={() => setSlots(slots.filter((x) => x.id !== s.id))}>
                      ✕
                    </Button>
                  </>
                ) : (
                  <span className="caption">Empty slot</span>
                )}
              </li>
            );
          })}
        </ol>
        {errors.filter((e) => !e.letterId).map((e) => (
          <p key={e.code} className="mt-3 text-sm text-mood-burning">
            {e.message}
          </p>
        ))}
        {locked && (
          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="reason" className="caption">
              This issue is locked. Reason for the hot swap (required; only rations built after this change will see it)
            </label>
            <TextInput id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {!locked && (
            <Button variant="secondary" onClick={() => save(false)} disabled={pending}>
              Save draft
            </Button>
          )}
          <Button onClick={() => save(true)} disabled={pending || slots.length !== 5 || errors.length > 0 || (locked && !reason.trim())}>
            {locked ? "Save hot swap" : "Schedule issue"}
          </Button>
        </div>
      </section>
      <section aria-labelledby="eligible">
        <h2 id="eligible" className="eyebrow mb-3 mt-0">
          Eligible letters · confirmed {MOOD_META[mood].label.toLowerCase()}, public, not yours
        </h2>
        {candidates.length === 0 && <Notice>No eligible letters yet. Confirm moods in the queue first.</Notice>}
        <ul className="m-0 flex max-h-[70vh] list-none flex-col gap-2 overflow-y-auto p-0">
          {candidates
            .filter((c) => !ids.includes(c.id))
            .map((c) => {
              const writerTaken = slots.some((s) => s.writerId === c.writerId);
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-[12px] border border-line-soft p-3">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm">{c.title}</p>
                    <p className="caption m-0">
                      {c.penName}
                      {writerTaken ? " · writer already in this issue" : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={slots.length >= 5 || writerTaken} onClick={() => setSlots([...slots, c])}>
                    Add
                  </Button>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}

export function EvergreenToggle({ letterId, active }: { letterId: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant={active ? "ghost" : "outline"} disabled={pending} onClick={() => start(async () => void (await setEvergreenAction(letterId, !active)))}>
      {active ? "Remove" : "Restore"}
    </Button>
  );
}
