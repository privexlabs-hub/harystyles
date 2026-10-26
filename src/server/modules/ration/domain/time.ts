/**
 * Wall-clock helpers over IANA time zones using Intl only (no Date.now(), no host-TZ dependence).
 * Local dates are "YYYY-MM-DD" strings; local times are "HH:MM".
 */
export type LocalDate = string;
export type LocalTime = string;

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type Wall = { y: number; mo: number; d: number; h: number; mi: number; s: number };

export function wallClock(instant: Date, tz: string): Wall {
  const parts = fmt(tz).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** Offset of `tz` from UTC at `instant`, in ms (local − UTC). */
export function offsetMs(instant: Date, tz: string): number {
  const w = wallClock(instant, tz);
  const asUtc = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function localDate(instant: Date, tz: string): LocalDate {
  const w = wallClock(instant, tz);
  return `${w.y}-${pad(w.mo)}-${pad(w.d)}`;
}

export function localTime(instant: Date, tz: string): LocalTime {
  const w = wallClock(instant, tz);
  return `${pad(w.h)}:${pad(w.mi)}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minutesOf(t: LocalTime): number {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

export function timeOfMinutes(mins: number): LocalTime {
  const m = Math.round(mins);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/**
 * Wall-clock date + time in `tz` → instant, with Temporal's "compatible" disambiguation (EX-02):
 * a nonexistent time (spring-forward gap) moves forward; an ambiguous time (fall-back overlap)
 * takes the earlier occurrence.
 */
export function zonedToInstant(date: LocalDate, time: LocalTime, tz: string): Date {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const before = offsetMs(new Date(guess - 86_400_000), tz);
  const after = offsetMs(new Date(guess + 86_400_000), tz);
  const candidates = [...new Set([guess - before, guess - after])]
    .filter((t) => {
      const w = wallClock(new Date(t), tz);
      return w.y === y && w.mo === mo && w.d === d && w.h === h && w.mi === mi;
    })
    .sort((a, b) => a - b);
  if (candidates.length > 0) return new Date(candidates[0]!);
  // Gap: interpret with the pre-transition offset, which lands after the gap.
  return new Date(guess - before);
}

/** Day of year (1–366) for a local date. */
export function dayOfYear(date: LocalDate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
}
