"use client";
import { useState, useTransition } from "react";
import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Avatar, Field, MoodDot, Notice, TextInput } from "@/components/ui/primitives";
import { MOODS, MOOD_META, type Mood, type Theme } from "@/contracts/enums";
import type { WriterCard } from "@/contracts/views";
import { geohashEncode } from "@/lib/geohash";
import { cx } from "@/lib/cx";

const STEPS = ["About you", "Moods", "Reading hours", "Theme", "Writers"] as const;

export function OnboardingFlow({ writers, next }: { writers: WriterCard[]; next: string }) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(false);
  const [name, setName] = useState("");
  const [moods, setMoods] = useState<Mood[]>(["tender"]);
  const [lampMode, setLampMode] = useState<"sunset" | "fixed">("sunset");
  const [fixed, setFixed] = useState("21:00");
  const [geoCell, setGeoCell] = useState<string | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "asking" | "ok" | "denied">("idle");
  const [theme, setTheme] = useState<Theme>("ink");
  const [follows, setFollows] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggleMood = (m: Mood) =>
    setMoods((cur) => (cur.includes(m) ? (cur.length > 1 ? cur.filter((x) => x !== m) : cur) : cur.length < 3 ? [...cur, m] : cur));

  const askLocation = () => {
    if (!("geolocation" in navigator)) return setGeoState("denied");
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        // Only a ~20 km cell leaves the device (BR-PR-02).
        setGeoCell(geohashEncode(p.coords.latitude, p.coords.longitude, 4));
        setGeoState("ok");
      },
      () => setGeoState("denied"),
      { maximumAge: 86_400_000, timeout: 10_000 },
    );
  };

  const applyTheme = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const finish = () =>
    start(async () => {
      setError(null);
      const res = await completeOnboarding(
        {
          ageAttested: true,
          displayName: name,
          moods,
          lampMode,
          lampFixedTime: lampMode === "fixed" ? fixed : null,
          geoCell: lampMode === "sunset" ? geoCell : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          theme,
          follows,
        },
        next,
      );
      if (res && !res.ok) setError(res.message);
    });

  const canNext = step !== 0 || age;

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={cx("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-bg-elevated")}>
            <span className="sr-only">
              {s}
              {i < step ? " (done)" : ""}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="flex flex-col gap-5" aria-labelledby="s0">
          <h2 id="s0" className="title-lg m-0">
            First, a little about <span className="italic-display text-accent">you.</span>
          </h2>
          <Field label="What should writers call you? (optional)" htmlFor="name" hint="Leave it empty and you'll appear as “A reader”.">
            <TextInput id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="A reader" autoComplete="nickname" />
          </Field>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-fg">
            <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
            <span>I am 16 or older.</span>
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-5" aria-labelledby="s1">
          <h2 id="s1" className="title-lg m-0">
            How do you like to <span className="italic-display text-accent">feel</span> in the evening?
          </h2>
          <p className="body-ui m-0">Choose up to three. Tonight’s letters will start from the first one you pick.</p>
          <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Moods">
            {MOODS.map((m) => {
              const on = moods.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleMood(m)}
                  className="flex min-h-14 items-center gap-3.5 rounded-[14px] border px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: on ? `var(--mood-${m})` : "var(--border-soft)",
                    background: on ? `color-mix(in oklch, var(--mood-${m}) 14%, var(--bg-card))` : "var(--bg-card)",
                  }}
                >
                  <MoodDot mood={m} size={18} glow={on} />
                  <span className="flex flex-col">
                    <span className="title-sm text-base">{MOOD_META[m].label}</span>
                    <span className="caption">{MOOD_META[m].caption}</span>
                  </span>
                  {on && <span className="ml-auto font-mono text-[10px] text-fg-subtle">{moods.indexOf(m) + 1}</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-5" aria-labelledby="s2">
          <h2 id="s2" className="title-lg m-0">
            When should the <span className="italic-display text-accent">lamp</span> be lit?
          </h2>
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="sr-only">Lamp time</legend>
            <label className={cx("flex cursor-pointer flex-col gap-2 rounded-[14px] border p-4", lampMode === "sunset" ? "border-accent bg-bg-elevated" : "border-line-soft")}>
              <span className="flex items-center gap-3">
                <input type="radio" name="lamp" checked={lampMode === "sunset"} onChange={() => setLampMode("sunset")} className="accent-[var(--accent)]" />
                <span className="text-fg">At sunset where I am</span>
              </span>
              <span className="caption pl-7">Between 5:00 and 9:30 pm. Without a location, the lamp lights at 6:00 pm.</span>
              {lampMode === "sunset" && (
                <span className="flex flex-wrap items-center gap-3 pl-7">
                  <Button size="sm" variant="secondary" onClick={askLocation} disabled={geoState === "asking"}>
                    {geoState === "ok" ? "Location shared" : geoState === "asking" ? "Asking…" : "Use my rough location"}
                  </Button>
                  <span className="caption">{geoState === "denied" ? "No location — we'll use 6:00 pm." : "Only a ~20 km area is stored."}</span>
                </span>
              )}
            </label>
            <label className={cx("flex cursor-pointer flex-col gap-2 rounded-[14px] border p-4", lampMode === "fixed" ? "border-accent bg-bg-elevated" : "border-line-soft")}>
              <span className="flex items-center gap-3">
                <input type="radio" name="lamp" checked={lampMode === "fixed"} onChange={() => setLampMode("fixed")} className="accent-[var(--accent)]" />
                <span className="text-fg">At a time I choose</span>
              </span>
              {lampMode === "fixed" && (
                <span className="flex items-center gap-3 pl-7">
                  <label htmlFor="fixed" className="caption">
                    Time
                  </label>
                  <input id="fixed" type="time" min="15:00" max="23:30" step={900} value={fixed} onChange={(e) => setFixed(e.target.value)} className="rounded-md border border-line bg-bg-elevated px-3 py-2 text-fg" />
                </span>
              )}
            </label>
          </fieldset>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-5" aria-labelledby="s3">
          <h2 id="s3" className="title-lg m-0">
            Choose your <span className="italic-display text-accent">light.</span>
          </h2>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
            {(
              [
                ["ink", "Ink", "Dark, by default"],
                ["dusk", "Dusk", "Warmer dark"],
                ["paper", "Paper", "Light"],
              ] as const
            ).map(([t, label, sub]) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme === t}
                onClick={() => applyTheme(t)}
                data-theme={t}
                className={cx("flex flex-col gap-1 rounded-[14px] border bg-bg p-4 text-left text-fg", theme === t ? "border-accent" : "border-line")}
              >
                <span className="title-sm">{label}</span>
                <span className="caption">{sub}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-5" aria-labelledby="s4">
          <h2 id="s4" className="title-lg m-0">
            A few writers you might <span className="italic-display text-accent">follow.</span>
          </h2>
          <p className="body-ui m-0">Optional. Their newest letters can find you on Tonight. Follows are private.</p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {writers.map((w) => {
              const on = follows.includes(w.id);
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFollows((f) => (on ? f.filter((x) => x !== w.id) : [...f, w.id].slice(0, 3)))}
                    className={cx("flex w-full items-center gap-3.5 rounded-[14px] border p-3.5 text-left", on ? "border-accent bg-bg-elevated" : "border-line-soft")}
                  >
                    <Avatar name={w.penName} hue={w.avatarHue} size={40} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-fg">{w.penName}</span>
                      <span className="caption truncate italic">{w.bioQuote}</span>
                    </span>
                    <span className="ml-auto text-sm text-fg-muted">{on ? "Following" : "Follow"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Continue
          </Button>
        ) : (
          <Button onClick={finish} disabled={pending}>
            {pending ? "Lighting the lamp…" : "Begin reading tonight"}
          </Button>
        )}
      </div>
    </div>
  );
}
