import { describe, expect, it } from "vitest";
import { canTransition, normalizePenName, slugify, validatePenName } from "@/server/modules/profiles/domain/writer-state";
import { lockInstant, validateIssue, type IssueContext, type SlotCandidate } from "@/server/modules/curation/domain/issue-policy";

describe("BR-WR-01/03 writers", () => {
  it("only allows documented transitions", () => {
    expect(canTransition("applied", "approved")).toBe(true);
    expect(canTransition("declined", "approved")).toBe(false);
    expect(canTransition("suspended", "approved")).toBe(true);
    expect(canTransition("banned", "approved")).toBe(false);
  });
  it("normalizes pen names for uniqueness", () => {
    expect(normalizePenName("  Inès   MARLOWE ")).toBe("ines marlowe");
    expect(normalizePenName("Ｉｎｅｓ")).toBe("ines"); // NFKC full-width
    expect(validatePenName("I")).not.toBeNull();
    expect(validatePenName("Ines Marlowe")).toBeNull();
    expect(slugify("Inès Marlowe")).toBe("ines-marlowe");
  });
});

describe("BR-CU issue policy (INV-09)", () => {
  const ctx: IssueContext = { eveningDate: "2026-03-14", mood: "tender", curatorId: "cur", writerAppearances: new Map([["w2", 1], ["w3", 2]]), recentLetterIds: new Set() };
  const s = (i: number, w = `w${i}`, extra: Partial<SlotCandidate> = {}): SlotCandidate => ({
    letterId: `l${i}`, writerId: w, status: "published", visibility: "public", writerStatus: "approved", confirmedMood: "tender", ...extra,
  });
  it("locks at 08:00 UTC the day before the evening date", () => {
    expect(lockInstant("2026-03-14").toISOString()).toBe("2026-03-13T08:00:00.000Z");
  });
  it("requires 5 distinct eligible writers and flags weekly caps", () => {
    const v = validateIssue([s(1), s(2), s(3), s(4), s(5, "w1", { visibility: "patron" })], ctx, true);
    const codes = v.map((x) => x.code);
    expect(codes).toContain("CURATION_DUPLICATE_WRITER");
    expect(codes).toContain("CURATION_PATRON_LETTER");
    expect(codes).toContain("CURATION_WRITER_WEEKLY_WARN"); // w2: 2nd appearance
    expect(codes).toContain("CURATION_WRITER_WEEKLY_CAP"); // w3: 3rd appearance
  });
  it("forbids a curator's own letter and unconfirmed moods", () => {
    const v = validateIssue([s(1, "cur"), s(6, "w6", { confirmedMood: null })], ctx, false);
    expect(v.map((x) => x.code)).toEqual(expect.arrayContaining(["CURATION_OWN_LETTER", "CURATION_MOOD_NOT_CONFIRMED"]));
  });
});
