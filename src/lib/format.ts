/** Display formatting in the reader's own time zone (locale-aware, docs/01 §1.7). */
export const fmtTime = (iso: string, tz: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
export const fmtLongDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
export const fmtDate = (iso: string | null | Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" }) : "";
