"use client";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CONTENT_NOTE_LABEL, type ContentNote } from "@/contracts/enums";

/**
 * BR-MO-04: letters noted `self_harm` or `suicide` show crisis resources before the body, once per
 * reader per letter (remembered on this device). Localised resources are a launch-readiness item
 * (roadmap Phase 7); until then we link the international directory.
 */
export function CrisisInterstitial({ letterId, notes, children }: { letterId: string; notes: ContentNote[]; children: ReactNode }) {
  const key = `hs_seen_note_${letterId}`;
  const seen = useSyncExternalStore(
    () => () => undefined,
    () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false; // storage unavailable: keep showing
      }
    },
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const show = !seen && !dismissed;
  if (!show) return <>{children}</>;
  return (
    <section role="region" aria-labelledby="care-title" className="flex flex-col gap-4 rounded-[18px] border border-line bg-bg-elevated p-8">
      <p className="eyebrow m-0">A note before you read</p>
      <h2 id="care-title" className="title-md m-0">
        This letter touches on {notes.filter((n) => n === "self_harm" || n === "suicide").map((n) => CONTENT_NOTE_LABEL[n]).join(" and ")}.
      </h2>
      <p className="body-ui m-0">
        If you’re struggling, you don’t have to carry it alone tonight. You can find a free, confidential helpline in your country at{" "}
        <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">
          findahelpline.com
        </a>
        . If you’re in immediate danger, call your local emergency number.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            try {
              localStorage.setItem(key, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          Read the letter
        </Button>
        <Button variant="ghost" onClick={() => history.back()}>
          Not tonight
        </Button>
      </div>
    </section>
  );
}
