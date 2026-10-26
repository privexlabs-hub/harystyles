"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { geohashEncode } from "@/lib/geohash";
import { saveDisplayAction, saveReadingAction, unblockAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, MoodDot, Notice, TextInput } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { MOODS, MOOD_META, type Mood, type ReadingSize, type Theme, type TypePair } from "@/contracts/enums";
import { cx } from "@/lib/cx";

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="caption mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className={cx("cursor-pointer rounded-full border px-4 py-2 text-sm", value === v ? "border-accent bg-accent-soft/40 text-fg" : "border-line text-fg-muted")}>
            <input type="radio" className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DisplayForm({ initial }: { initial: { theme: Theme; typePair: TypePair; readingSize: ReadingSize; dyslexiaFont: boolean } }) {
  const [s, set] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const apply = (n: typeof s) => {
    set(n);
    const d = document.documentElement;
    d.setAttribute("data-theme", n.theme);
    d.setAttribute("data-type-pair", n.typePair);
    d.setAttribute("data-reading-size", n.readingSize);
    if (n.dyslexiaFont) d.setAttribute("data-dyslexia", "true");
    else d.removeAttribute("data-dyslexia");
  };
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveDisplayAction(s);
          toast.show(r.ok ? "Saved. Your other devices will follow." : r.message);
        });
      }}
    >
      <Seg label="Theme" value={s.theme} onChange={(theme) => apply({ ...s, theme })} options={[["ink", "Ink"], ["dusk", "Dusk"], ["paper", "Paper"], ["system", "Match my device"]] as const} />
      <Seg label="Type pairing" value={s.typePair} onChange={(typePair) => apply({ ...s, typePair })} options={[["serif_sans", "Serif + sans"], ["serif_mono", "Serif + mono"], ["all_serif", "All serif"]] as const} />
      <Seg label="Reading size" value={s.readingSize} onChange={(readingSize) => apply({ ...s, readingSize })} options={[["s", "Smaller"], ["m", "Default"], ["l", "Larger"]] as const} />
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={s.dyslexiaFont} onChange={(e) => apply({ ...s, dyslexiaFont: e.target.checked })} className="size-4 accent-[var(--accent)]" />
        Use a more legible reading font
      </label>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save display"}
        </Button>
      </div>
    </form>
  );
}

export function ReadingForm({
  initial,
}: {
  initial: { displayName: string; preferredMoods: Mood[]; lampMode: "sunset" | "fixed"; lampFixedTime: string | null; hasLocation: boolean; nextLamp: string };
}) {
  const [name, setName] = useState(initial.displayName);
  const [moods, setMoods] = useState(initial.preferredMoods);
  const [mode, setMode] = useState(initial.lampMode);
  const [fixed, setFixed] = useState(initial.lampFixedTime ?? "21:00");
  const [geo, setGeo] = useState<string | null>(null);
  const [clear, setClear] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const toggle = (m: Mood) => setMoods((c) => (c.includes(m) ? (c.length > 1 ? c.filter((x) => x !== m) : c) : c.length < 3 ? [...c, m] : c));
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveReadingAction({
            displayName: name,
            preferredMoods: moods,
            lampMode: mode,
            lampFixedTime: mode === "fixed" ? fixed : null,
            clearLocation: clear,
            geoCell: geo,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
          toast.show(r.ok ? "Saved. Changes apply from the next lamp." : r.message);
        });
      }}
    >
      <Field label="Display name (optional)" htmlFor="dn" hint="Shown to writers if you write to them. Empty means “A reader”.">
        <TextInput id="dn" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </Field>
      <fieldset className="m-0 border-0 p-0">
        <legend className="caption mb-2">Moods (up to three; the first starts your evening)</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={moods.includes(m)}
              onClick={() => toggle(m)}
              className={cx("flex items-center gap-2 rounded-full border px-4 py-2 text-sm", moods.includes(m) ? "text-fg" : "border-line text-fg-muted")}
              style={moods.includes(m) ? { borderColor: `var(--mood-${m})`, background: `color-mix(in oklch, var(--mood-${m}) 14%, transparent)` } : undefined}
            >
              <MoodDot mood={m} /> {MOOD_META[m].label}
              {moods.includes(m) && <span className="font-mono text-[10px]">{moods.indexOf(m) + 1}</span>}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="caption mb-2">Lamp time</legend>
        <label className="flex items-center gap-3 text-sm">
          <input type="radio" checked={mode === "sunset"} onChange={() => setMode("sunset")} className="accent-[var(--accent)]" /> At sunset where I am
        </label>
        {mode === "sunset" && (
          <div className="flex flex-wrap items-center gap-3 pl-7">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition(
                  (p) => {
                    setGeo(geohashEncode(p.coords.latitude, p.coords.longitude, 4));
                    setClear(false);
                  },
                  () => toast.show("No location shared — the lamp stays at 6:00 pm."),
                )
              }
            >
              {geo ? "Location updated" : initial.hasLocation ? "Update my rough location" : "Use my rough location"}
            </Button>
            {initial.hasLocation && (
              <label className="flex items-center gap-2 text-sm text-fg-muted">
                <input type="checkbox" checked={clear} onChange={(e) => setClear(e.target.checked)} className="accent-[var(--accent)]" /> Forget my location
              </label>
            )}
          </div>
        )}
        <label className="flex items-center gap-3 text-sm">
          <input type="radio" checked={mode === "fixed"} onChange={() => setMode("fixed")} className="accent-[var(--accent)]" /> At a time I choose
        </label>
        {mode === "fixed" && (
          <div className="pl-7">
            <label htmlFor="ft" className="sr-only">
              Lamp time
            </label>
            <input id="ft" type="time" min="15:00" max="23:30" step={900} value={fixed} onChange={(e) => setFixed(e.target.value)} className="rounded-md border border-line bg-bg-elevated px-3 py-2 text-fg" />
          </div>
        )}
        <p className="caption m-0">Your next lamp: {initial.nextLamp}.</p>
      </fieldset>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save reading"}
        </Button>
      </div>
    </form>
  );
}

export function SecurityPanel({ passkeyCount }: { passkeyCount: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4">
      <p className="body-ui m-0">
        {passkeyCount ? `You have ${passkeyCount} passkey${passkeyCount === 1 ? "" : "s"}.` : "Add a passkey to sign in with your fingerprint, face or device PIN."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={async () => {
            const r = await authClient.passkey.addPasskey({ name: "harystyles" });
            setMsg(r?.error ? "That device didn't create a passkey. You can still sign in with email links." : "Passkey added.");
            router.refresh();
          }}
        >
          Add a passkey
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            await authClient.revokeOtherSessions();
            setMsg("Signed out everywhere else.");
          }}
        >
          Sign out of other devices
        </Button>
      </div>
      {msg && <Notice>{msg}</Notice>}
    </div>
  );
}

export function UnblockButton({ userId, penName }: { userId: string; penName: string }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => void (await unblockAction(userId)))}>
      Unblock {penName}
    </Button>
  );
}
