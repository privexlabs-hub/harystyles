import type { WriterStatus } from "@/contracts/enums";

/** BR-WR-01 — the only allowed writer transitions. */
const TRANSITIONS: Record<WriterStatus, readonly WriterStatus[]> = {
  applied: ["approved", "waitlisted", "declined"],
  waitlisted: [],
  declined: [],
  approved: ["suspended", "banned", "departed"],
  suspended: ["approved", "banned"],
  banned: [],
  departed: [],
};

export function canTransition(from: WriterStatus, to: WriterStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** BR-WR-02: only approved writers publish, receive patronages, or appear in issues. */
export const canPublish = (s: WriterStatus) => s === "approved";

/** BR-WR-06: a declined applicant may re-apply after 60 days. */
export const REAPPLY_AFTER_DAYS = 60;

/**
 * BR-WR-03 normalization: NFKC, lowercase, collapsed whitespace, diacritics folded.
 */
export function normalizePenName(name: string): string {
  return name
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

export function validatePenName(name: string): string | null {
  const trimmed = name.replace(/\s+/gu, " ").trim();
  const len = [...trimmed].length;
  if (len < 2 || len > 40) return "A pen name is 2 to 40 characters.";
  if (!/\p{L}/u.test(trimmed)) return "A pen name needs at least one letter.";
  return null;
}

export function slugify(input: string, max = 60): string {
  const s = normalizePenName(input)
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s || "untitled";
}

/** BR-WR-03: pen name may change at most once per 90 days. */
export function canChangePenName(lastChangedAt: Date | null, now: Date): boolean {
  return !lastChangedAt || now.getTime() - lastChangedAt.getTime() >= 90 * 86_400_000;
}

/** Reserved first path segments — writer slugs share the root namespace with app routes. */
export const RESERVED_SLUGS = new Set([
  "tonight", "moods", "writers", "search", "shelf", "settings", "studio", "console", "sign-in", "onboarding",
  "api", "about", "manifesto", "patrons", "letters", "me", "dev", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
]);
