import type { HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./icons";
import { MOOD_META, type Mood } from "@/contracts/enums";

/** Avatar: initial on a hue-tinted disc (components.jsx). */
export function Avatar({
  name,
  size = 40,
  hue = 45,
  ring = false,
  className,
}: {
  name: string;
  size?: number;
  hue?: number;
  ring?: boolean;
  className?: string;
}) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden
      className={cx("inline-grid shrink-0 place-items-center rounded-full font-serif font-medium", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `oklch(0.30 0.04 ${hue})`,
        color: `oklch(0.85 0.08 ${hue})`,
        boxShadow: ring ? "0 0 0 2px var(--bg), 0 0 0 3px var(--accent)" : undefined,
      }}
    >
      {initial}
    </span>
  );
}

export const moodVar = (m: Mood) => `var(--mood-${m})`;

/** Small glowing mood dot. */
export function MoodDot({ mood, size = 8, glow = false }: { mood: Mood; size?: number; glow?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: moodVar(mood), boxShadow: glow ? `0 0 14px ${moodVar(mood)}` : undefined }}
    />
  );
}

/** Mono uppercase badge: PATRON (wine), mood (tinted), NEW (accent). page-components.jsx. */
export function Badge({
  tone = "neutral",
  mood,
  children,
  icon,
}: {
  tone?: "neutral" | "patron" | "mood" | "new";
  mood?: Mood;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const style =
    tone === "mood" && mood
      ? { color: moodVar(mood), background: `color-mix(in oklch, ${moodVar(mood)} 18%, transparent)` }
      : undefined;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]",
        tone === "patron" && "bg-wine-900 text-wine-300",
        tone === "new" && "bg-accent-soft text-accent",
        tone === "neutral" && "bg-bg-elevated text-fg-muted",
      )}
      style={style}
    >
      {icon}
      {children}
    </span>
  );
}

export function PatronMark({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.02em] text-wine-300", className)}>
      <Icon.lock />
      Patron
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-line bg-bg-elevated px-3.5 py-1.5 text-xs text-fg-muted">{children}</span>;
}

export function Eyebrow({ children, className, as: As = "p" }: { children: ReactNode; className?: string; as?: "p" | "span" | "h2" }) {
  return <As className={cx("eyebrow m-0", className)}>{children}</As>;
}

/** Mono meta line, e.g. "7 MIN · TENDER". */
export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("font-mono text-[10px] uppercase tracking-[0.04em] text-fg-faint", className)}>{children}</span>;
}

export function MoodLabel({ mood }: { mood: Mood }) {
  return <>{MOOD_META[mood].label}</>;
}

const fieldBase =
  "w-full rounded-md border border-line bg-bg-elevated px-3.5 py-3 text-[15px] text-fg placeholder:text-fg-faint outline-none transition-[border-color,box-shadow] duration-[var(--dur-2)] focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_18%,transparent)] aria-[invalid=true]:border-mood-burning";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="caption">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="m-0 text-xs text-mood-burning">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="m-0 text-xs text-fg-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, className)} {...p} />;
}

export function TextArea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, "font-serif text-base leading-[1.6]", className)} {...p} />;
}

export function Select({ className, children, ...p }: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cx(fieldBase, "appearance-none", className)} {...(p as object)}>
      {children}
    </select>
  );
}

/** Toggle switch (page-components.jsx): 40×24 track, 18px knob. Native checkbox for a11y. */
export function Toggle({
  name,
  label,
  defaultChecked,
  id,
  description,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  id: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-sm text-fg">{label}</span>
        {description && <span className="caption">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-10 rounded-full bg-bg-elevated ring-1 ring-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent" />
        <span className="absolute left-[3px] top-[3px] size-[18px] rounded-full bg-fg-muted transition-transform duration-[var(--dur-2)] peer-checked:translate-x-4 peer-checked:bg-ink-1000" />
      </span>
    </label>
  );
}

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-lg border border-line-soft bg-bg-elevated", className)} {...rest}>
      {children}
    </div>
  );
}

/** Empty / quiet states use the brand voice: specific, tender, never generic. */
export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span aria-hidden className="text-2xl text-accent">
        ❦
      </span>
      <p className="title-sm m-0 italic">{title}</p>
      {body && <p className="body-sm m-0 max-w-[38ch]">{body}</p>}
      {action}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "rounded-md border px-4 py-3 text-sm",
        tone === "error" && "border-mood-burning/50 bg-[color-mix(in_oklch,var(--mood-burning)_10%,transparent)] text-fg",
        tone === "success" && "border-accent/60 bg-accent-soft/40 text-fg",
        tone === "info" && "border-line bg-bg-elevated text-fg-muted",
      )}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx("block animate-pulse rounded-md bg-bg-elevated", className)} />;
}
