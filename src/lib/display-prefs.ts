import type { ReadingSize, Theme, TypePair } from "@/contracts/enums";

/** Display preferences mirrored into a non-HttpOnly cookie so the root layout can apply them pre-paint. */
export const PREF_COOKIE = "hs_pref";

export type DisplayPrefs = { theme: Theme; typePair: TypePair; readingSize: ReadingSize; dyslexia: boolean };

export function serializeDisplayPrefs(p: DisplayPrefs): string {
  return encodeURIComponent(JSON.stringify(p));
}
