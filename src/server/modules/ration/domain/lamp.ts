import { addDays, localDate, localTime, minutesOf, timeOfMinutes, zonedToInstant, type LocalDate, type LocalTime } from "./time";
import type { LampMode } from "@/contracts/enums";
export { geohashEncode } from "@/lib/geohash";

/**
 * Lamp time and evening date — the single home of BR-RA-01 / BR-RA-02 (docs/03 §3.9b–c).
 * Pure: callers pass `now`.
 */
export const DEFAULT_LAMP: LocalTime = "18:00";
export const SUNSET_CLAMP = { min: "17:00", max: "21:30" } as const;
export const FIXED_RANGE = { min: "15:00", max: "23:30" } as const;

export type LampPrefs = { lampMode: LampMode; lampFixedTime: LocalTime | null; timezone: string; geoCell: string | null };

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
/** Geohash → centroid (BR-PR-02 stores precision 4 only). */
export function geohashCentroid(hash: string): { lat: number; lon: number } {
  let even = true;
  const lat: [number, number] = [-90, 90];
  const lon: [number, number] = [-180, 180];
  for (const c of hash.toLowerCase()) {
    const v = BASE32.indexOf(c);
    if (v < 0) throw new Error("invalid geohash");
    for (let bit = 4; bit >= 0; bit--) {
      const range = even ? lon : lat;
      const mid = (range[0] + range[1]) / 2;
      if ((v >> bit) & 1) range[0] = mid;
      else range[1] = mid;
      even = !even;
    }
  }
  return { lat: (lat[0] + lat[1]) / 2, lon: (lon[0] + lon[1]) / 2 };
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * NOAA sunset (General Solar Position, zenith 90.833°). Returns minutes after 00:00 UTC on `date`
 * (may be < 0 or ≥ 1440), or "polar_day" / "polar_night" when the sun doesn't set / rise.
 */
export function sunsetUtcMinutes(date: LocalDate, lat: number, lon: number): number | "polar_day" | "polar_night" {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const start = Date.UTC(y, 0, 1);
  const n = (Date.UTC(y, m - 1, d) - start) / 86_400_000; // 0-based day of year
  const daysInYear = (Date.UTC(y + 1, 0, 1) - start) / 86_400_000;
  const g = ((2 * Math.PI) / daysInYear) * (n + (18 - 12) / 24); // fractional year at 18:00
  const eqtime =
    229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl);
  if (cosHa < -1) return "polar_day";
  if (cosHa > 1) return "polar_night";
  const ha = deg(Math.acos(cosHa));
  return 720 - 4 * (lon - ha) - eqtime;
}

/** Local lamp wall-clock time for a date. */
export function lampLocalTime(prefs: LampPrefs, date: LocalDate): LocalTime {
  if (prefs.lampMode === "fixed" && prefs.lampFixedTime) return prefs.lampFixedTime.slice(0, 5);
  if (!prefs.geoCell) return DEFAULT_LAMP;
  const { lat, lon } = geohashCentroid(prefs.geoCell);
  const s = sunsetUtcMinutes(date, lat, lon);
  const min = minutesOf(SUNSET_CLAMP.min);
  const max = minutesOf(SUNSET_CLAMP.max);
  if (s === "polar_day") return SUNSET_CLAMP.max; // EX-03
  if (s === "polar_night") return SUNSET_CLAMP.min;
  // Convert UTC minutes on `date` to the reader's local wall time.
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const instant = new Date(Date.UTC(y, m - 1, d) + s * 60_000);
  // A sunset that lands on another local calendar day (high latitudes, far-off zones) clamps to the edge.
  const day = localDate(instant, prefs.timezone);
  if (day > date) return SUNSET_CLAMP.max;
  if (day < date) return SUNSET_CLAMP.min;
  const local = minutesOf(localTime(instant, prefs.timezone));
  return timeOfMinutes(Math.min(max, Math.max(min, local)));
}

export function lampAt(prefs: LampPrefs, date: LocalDate): Date {
  return zonedToInstant(date, lampLocalTime(prefs, date), prefs.timezone);
}

/** BR-RA-02: today's local date if now ≥ today's lamp time, otherwise yesterday's. */
export function eveningDate(prefs: LampPrefs, now: Date): LocalDate {
  const today = localDate(now, prefs.timezone);
  return now.getTime() >= lampAt(prefs, today).getTime() ? today : addDays(today, -1);
}

export function nextLamp(prefs: LampPrefs, now: Date): { at: Date; eveningDate: LocalDate } {
  const e = addDays(eveningDate(prefs, now), 1);
  return { at: lampAt(prefs, e), eveningDate: e };
}

/** Anonymous / default prefs (BR-RA-01: no location → 18:00 local). */
export function defaultLampPrefs(timezone: string): LampPrefs {
  return { lampMode: "sunset", lampFixedTime: null, timezone, geoCell: null };
}
