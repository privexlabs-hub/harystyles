/**
 * Fixed vocabularies (docs/01 §1.1, docs/03). Mirrored by text + CHECK constraints in the schema;
 * tests/unit/enums.test.ts asserts the generated migration matches these lists.
 */
export const MOODS = ["tender", "restless", "melancholy", "still", "burning", "untethered"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_META: Record<Mood, { label: string; caption: string }> = {
  tender: { label: "Tender", caption: "soft, ached, gentle" },
  restless: { label: "Restless", caption: "the kind that won't sit" },
  melancholy: { label: "Melancholy", caption: "blue, low-lit, beautiful" },
  still: { label: "Still", caption: "quiet, even, observed" },
  burning: { label: "Burning", caption: "alive, vivid, urgent" },
  untethered: { label: "Untethered", caption: "drifting, unanchored, light" },
};

/**
 * EX-04 "fixed adjacency table". The source docs reference it but never define it; this table is
 * an implementation decision recorded in docs/PRODUCT.md (open questions) for the product owner.
 */
export const MOOD_ADJACENCY: Record<Mood, readonly Mood[]> = {
  tender: ["still", "melancholy"],
  restless: ["burning", "untethered"],
  melancholy: ["tender", "still"],
  still: ["tender", "melancholy"],
  burning: ["restless", "tender"],
  untethered: ["restless", "melancholy"],
};

export const DEFAULT_ANON_MOOD: Mood = "tender"; // BR-RA-10

export const GLYPHS = ["kept", "tender", "spark", "staying", "held"] as const;
export type Glyph = (typeof GLYPHS)[number];
export const GLYPH_CHAR: Record<Glyph, string> = { kept: "❦", tender: "♡", spark: "✦", staying: "◐", held: "—" };

export const ROLES = ["writer", "curator", "moderator", "finance", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: readonly Role[] = ["curator", "moderator", "finance", "admin"];

export const ACCOUNT_STATUSES = ["active", "deletion_requested", "deleted", "banned"] as const;
export const WRITER_STATUSES = ["applied", "waitlisted", "declined", "approved", "suspended", "banned", "departed"] as const;
export type WriterStatus = (typeof WRITER_STATUSES)[number];
export const APPLICATION_STATUSES = ["pending", "approved", "waitlisted", "declined"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const LETTER_STATUSES = ["draft", "scheduled", "published", "withdrawn", "removed"] as const;
export type LetterStatus = (typeof LETTER_STATUSES)[number];
export const VISIBILITIES = ["public", "patron"] as const;
export type Visibility = (typeof VISIBILITIES)[number];
export const CONTENT_NOTES = ["grief", "self_harm", "suicide", "abuse", "addiction", "illness", "violence", "sexual_content"] as const;
export type ContentNote = (typeof CONTENT_NOTES)[number];
export const CONTENT_NOTE_LABEL: Record<ContentNote, string> = {
  grief: "grief",
  self_harm: "self-harm",
  suicide: "suicide",
  abuse: "abuse",
  addiction: "addiction",
  illness: "illness",
  violence: "violence",
  sexual_content: "sexual content",
};
export const NOTE_SET_BY = ["writer", "curator"] as const;

export const ISSUE_STATUSES = ["draft", "scheduled", "locked", "live", "archived"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const ISSUE_SOURCES = ["curated", "evergreen"] as const;
export const SLOT_SOURCES = ["issue", "patron", "follow", "evergreen"] as const;
export type SlotSource = (typeof SLOT_SOURCES)[number];
export const SLOT_STATES = ["active", "superseded", "tombstoned"] as const;

export const THEMES = ["system", "ink", "dusk", "paper"] as const;
export type Theme = (typeof THEMES)[number];
export const TYPE_PAIRS = ["serif_sans", "serif_mono", "all_serif"] as const;
export type TypePair = (typeof TYPE_PAIRS)[number];
export const READING_SIZES = ["s", "m", "l"] as const;
export type ReadingSize = (typeof READING_SIZES)[number];
export const LAMP_MODES = ["sunset", "fixed"] as const;
export type LampMode = (typeof LAMP_MODES)[number];

export const NOTIFICATION_KINDS = [
  "lamp_lit",
  "new_letter_from_patronized_writer",
  "private_reply",
  "inbox_letter",
  "billing_problem",
  "security",
] as const; // BR-NO-01 — nothing else ships without a rule change
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export const NOTIFICATION_CHANNELS = ["push", "email", "in_app"] as const;

export const ENTITLEMENT_SOURCES = ["stripe", "apple", "google", "gift", "comp"] as const;
export const ENTITLEMENT_STATUSES = ["active", "grace", "revoked"] as const;
export const MEDIA_BUCKETS = ["quarantine", "public", "private"] as const;
export const MEDIA_STATUSES = ["pending", "ready", "rejected"] as const;
export const FLAG_KINDS = ["release", "ops", "experiment"] as const;
