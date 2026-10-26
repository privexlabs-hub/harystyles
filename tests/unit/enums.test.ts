import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CONTENT_NOTES, GLYPHS, LETTER_STATUSES, MOODS, ROLES, WRITER_STATUSES } from "@/contracts/enums";

// docs/03 §3.1: CHECK constraints mirror the shared enums; the migration must list exactly these values.
const sql = readFileSync("drizzle/0001_init.sql", "utf8");
const listIn = (constraint: string) => {
  const m = sql.match(new RegExp(`"${constraint}" CHECK \\([^)]*? in \\(([^)]*)\\)`));
  return m ? m[1]!.split(",").map((s) => s.trim().replace(/'/g, "")) : null;
};

describe("enum ↔ CHECK parity", () => {
  it.each([
    ["letters_status_check", LETTER_STATUSES],
    ["writer_status_check", WRITER_STATUSES],
    ["user_roles_role_check", ROLES],
    ["reactions_glyph_check", GLYPHS],
    ["content_note_check", CONTENT_NOTES],
    ["issues_mood_check", MOODS],
  ])("%s", (name, values) => {
    expect(listIn(name)).toEqual([...values]);
  });
});
