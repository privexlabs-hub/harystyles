"use client";
import { useOptimistic, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockAction, followAction, saveAction, switchMoodAction } from "@/features/reader/actions";
import { Button, IconButton, type ButtonSize } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { MOOD_META, type Mood } from "@/contracts/enums";
import { cx } from "@/lib/cx";

/** "Follow" is the only name for free following (brief §14: never "Subscribe"). */
export function FollowButton({ writerId, following, signedIn, size = "sm" }: { writerId: string; following: boolean; signedIn: boolean; size?: ButtonSize }) {
  const [state, set] = useOptimistic(following);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size={size}
      aria-pressed={state}
      disabled={pending}
      onClick={() => {
        if (!signedIn) return router.push(`/sign-in?next=${encodeURIComponent(location.pathname)}`);
        start(async () => {
          set(!state);
          const r = await followAction(writerId, !state);
          if (!r.ok) toast.show(r.message);
        });
      }}
    >
      {state ? "Following" : "Follow"}
    </Button>
  );
}

export function SaveButton({ letterId, saved, signedIn }: { letterId: string; saved: boolean; signedIn: boolean }) {
  const [state, set] = useOptimistic(saved);
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <IconButton
      label={state ? "Remove from your shelf" : "Save to your shelf"}
      aria-pressed={state}
      onClick={() => {
        if (!signedIn) return router.push(`/sign-in?next=${encodeURIComponent(location.pathname)}`);
        start(async () => {
          set(!state);
          const r = await saveAction(letterId, !state);
          toast.show(r.ok ? (!state ? "Saved to your shelf." : "Removed from your shelf.") : r.message);
        });
      }}
    >
      {state ? <Icon.bookmarkFill /> : <Icon.bookmark />}
    </IconButton>
  );
}

export function BlockButton({ writerId, penName }: { writerId: string; penName: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-left text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
      onClick={() => {
        if (!confirm(`Block ${penName}? You won't see their letters anywhere, and they won't be told.`)) return;
        start(async () => {
          const r = await blockAction(writerId, true);
          toast.show(r.ok ? `${penName} is blocked. You can undo this in Settings.` : r.message);
          if (r.ok) router.push("/tonight");
        });
      }}
    >
      Block this writer
    </button>
  );
}

/**
 * Patronage CTA. Milestone A ships no payments (roadmap Milestone A: "No payments"), so this opens
 * an honest explanation instead of a checkout — copy follows "support Ines", never "unlock".
 */
export function PatronCta({ penName, size = "md", full = false }: { penName: string; size?: ButtonSize; full?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const first = penName.split(" ")[0];
  return (
    <>
      <Button variant="primary" size={size} full={full} icon={<Icon.candle />} onClick={() => ref.current?.showModal()}>
        $4 / month · support {first}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby="patron-title"
        className="m-auto w-[min(480px,calc(100vw-32px))] rounded-[20px] border border-line bg-bg-elevated p-8 text-fg shadow-[var(--shadow-lg)] backdrop:bg-scrim"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="amber-orb size-14" aria-hidden />
          <p className="eyebrow m-0">Patronage</p>
          <h2 id="patron-title" className="title-lg m-0">
            Keep the lamp <span className="italic-display text-accent">lit</span> for {first}.
          </h2>
          <p className="body-ui m-0">
            Patronage opens after our founding-writer beta. When it does, $4 a month will let you read every letter {first} writes — 90% goes to the writer, and you can stop any time.
          </p>
          <p className="caption m-0">Nothing has been charged. There’s no checkout yet.</p>
          <Button variant="secondary" full onClick={() => ref.current?.close()}>
            Close
          </Button>
        </div>
      </dialog>
    </>
  );
}

/** Mood switch (BR-RA-07): once per evening. */
export function MoodSwitcher({ current, allowed, anonymous }: { current: Mood; allowed: boolean; anonymous: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const others = (Object.keys(MOOD_META) as Mood[]).filter((m) => m !== current);
  if (!allowed && !anonymous) return <p className="mono m-0 text-fg-faint">You changed tonight’s mood once already. It resets at the next lamp.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mono text-fg-faint">Not {MOOD_META[current].label.toLowerCase()} tonight?</span>
      {others.map((m) => (
        <button
          key={m}
          type="button"
          disabled={pending}
          onClick={() => {
            if (anonymous) return router.push(`/tonight?mood=${m}`);
            if (!confirm(`Switch tonight to ${MOOD_META[m].label.toLowerCase()}? You can do this once per evening; letters you've read stay.`)) return;
            start(async () => {
              const r = await switchMoodAction(m);
              if (!r.ok) toast.show(r.message);
            });
          }}
          className={cx("min-h-9 rounded-full border border-line px-3 py-1.5 text-xs capitalize text-fg-muted transition-colors hover:border-line-strong hover:text-fg", pending && "opacity-50")}
        >
          {MOOD_META[m].label}
        </button>
      ))}
    </div>
  );
}
