import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { buildRation, rebuildForMoodSwitch, type BuildInput, type Candidate } from "@/server/modules/ration/domain/builder";
import { applyHeartbeat } from "@/server/modules/ration/domain/reading";

const now = new Date("2026-03-14T20:00:00Z");
const L = (id: string, writerId: string, extra: Partial<Candidate> = {}): Candidate => ({
  id,
  writerId,
  status: "published",
  visibility: "public",
  publishedAt: new Date("2026-03-01T00:00:00Z"),
  ...extra,
});
const base = (over: Partial<BuildInput> = {}): BuildInput => ({
  readerId: "r1",
  eveningDate: "2026-03-14",
  now,
  issue: [L("i1", "w1"), L("i2", "w2"), L("i3", "w3"), L("i4", "w4"), L("i5", "w5")],
  evergreen: [L("e1", "w6"), L("e2", "w7"), L("e3", "w8")],
  adjacentEvergreen: [L("a1", "w9"), L("a2", "w10")],
  personal: [],
  completedLetterIds: new Set(),
  blockedWriterIds: new Set(),
  entitledWriterIds: new Set(),
  ...over,
});

describe("BR-RA-05 ration builder", () => {
  it("uses the issue in curated order", () => {
    const r = buildRation(base());
    expect(r.slots.map((s) => s.letterId)).toEqual(["i1", "i2", "i3", "i4", "i5"]);
    expect(r.short).toBe(false);
  });

  it("puts up to 2 recent followed-writer letters first", () => {
    const recent = new Date("2026-03-14T08:00:00Z");
    const r = buildRation(
      base({
        personal: [
          { ...L("f1", "w20", { publishedAt: recent }), viaPatronage: false },
          { ...L("f2", "w21", { publishedAt: recent }), viaPatronage: false },
          { ...L("f3", "w22", { publishedAt: recent }), viaPatronage: false },
          { ...L("old", "w23", { publishedAt: new Date("2026-03-10T00:00:00Z") }), viaPatronage: false },
        ],
      }),
    );
    expect(r.slots.slice(0, 2).every((s) => s.source === "follow")).toBe(true);
    expect(r.slots.map((s) => s.letterId)).not.toContain("old");
    expect(r.slots).toHaveLength(5);
  });

  it("skips completed letters, blocked writers and duplicate writers, backfilling from evergreen (EX-04)", () => {
    const r = buildRation(
      base({
        issue: [L("i1", "w1"), L("i2", "w1"), L("i3", "w3"), L("i4", "w4"), L("i5", "w5")],
        completedLetterIds: new Set(["i3"]),
        blockedWriterIds: new Set(["w4"]),
      }),
    );
    expect(r.slots.map((s) => s.letterId)).toEqual(["i1", "i5", "e1", "e2", "e3"]);
  });

  it("returns a short ration instead of duplicates", () => {
    const r = buildRation(base({ issue: [L("i1", "w1")], evergreen: [L("e1", "w1")], adjacentEvergreen: [] }));
    expect(r.slots).toHaveLength(1);
    expect(r.short).toBe(true);
  });

  it("never includes patron letters without entitlement; anonymous gets no personal slots (BR-RA-10)", () => {
    const r = buildRation(
      base({
        readerId: null,
        issue: [L("p1", "w1", { visibility: "patron" }), L("i2", "w2")],
        personal: [{ ...L("f1", "w20", { publishedAt: new Date("2026-03-14T08:00:00Z") }), viaPatronage: false }],
      }),
    );
    expect(r.slots.map((s) => s.letterId)).not.toContain("p1");
    expect(r.slots.map((s) => s.letterId)).not.toContain("f1");
  });

  it("is deterministic and always satisfies INV-07 (property)", () => {
    const cand = fc.record({
      id: fc.string({ minLength: 1, maxLength: 4 }),
      writerId: fc.constantFrom("w1", "w2", "w3", "w4", "w5", "w6", "w7"),
      status: fc.constantFrom("published", "published", "withdrawn", "draft"),
      visibility: fc.constantFrom("public", "public", "patron"),
      publishedAt: fc.constant(new Date("2026-03-14T10:00:00Z")),
    }) as fc.Arbitrary<Candidate>;
    fc.assert(
      fc.property(
        fc.array(cand, { maxLength: 8 }),
        fc.array(cand, { maxLength: 12 }),
        fc.array(cand.map((c) => ({ ...c, viaPatronage: false })), { maxLength: 5 }),
        fc.subarray(["w1", "w2", "w3"]),
        (issue, evergreen, personal, blocked) => {
          // Letter ids are unique in reality; make generated ones unique across all lists.
          let n = 0;
          const uniq = <T extends Candidate>(xs: T[]) => xs.map((x) => ({ ...x, id: `${x.id}#${n++}` }));
          const input = base({ issue: uniq(issue), evergreen: uniq(evergreen), adjacentEvergreen: [], personal: uniq(personal), blockedWriterIds: new Set(blocked) });
          const a = buildRation(input); // throws if INV-07 is violated
          const b = buildRation(input);
          expect(a).toEqual(b);
          return new Set(a.slots.map((s) => s.writerId)).size === a.slots.length;
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe("BR-RA-07 / FX-07 mood switch", () => {
  it("keeps read and personal slots, rebuilds the rest from the new mood", () => {
    const res = rebuildForMoodSwitch({
      ...base({ issue: [L("n1", "w11"), L("n2", "w12"), L("n3", "w13")], evergreen: [], adjacentEvergreen: [] }),
      current: [
        { position: 1, letterId: "f1", writerId: "w20", source: "follow", read: false },
        { position: 2, letterId: "i1", writerId: "w1", source: "issue", read: true },
        { position: 3, letterId: "i2", writerId: "w2", source: "issue", read: false },
        { position: 4, letterId: "i3", writerId: "w3", source: "issue", read: false },
        { position: 5, letterId: "i4", writerId: "w4", source: "issue", read: false },
      ],
    });
    expect(res.keep.map((s) => s.letterId)).toEqual(["f1", "i1"]);
    expect(res.replace.map((s) => [s.position, s.letterId])).toEqual([
      [3, "n1"],
      [4, "n2"],
      [5, "n3"],
    ]);
  });
});

describe("BR-RA-08 read detection", () => {
  const opened = new Date("2026-03-14T20:00:00Z");
  it("completes at progress ≥ 0.8", () => {
    const s = applyHeartbeat(null, { progress: 0.82, activeSeconds: 10 }, new Date("2026-03-14T20:00:15Z"), 7, opened);
    expect(s.completedAt).not.toBeNull();
  });
  it("clamps dwell to wall-clock time and keeps progress monotonic", () => {
    const s1 = applyHeartbeat(null, { progress: 0.5, activeSeconds: 9999 }, new Date("2026-03-14T20:00:15Z"), 7, opened);
    expect(s1.dwellSeconds).toBe(17); // 15 s wall + 2 s slack
    const s2 = applyHeartbeat(s1, { progress: 0.2, activeSeconds: 5 }, new Date("2026-03-14T20:00:30Z"), 7, opened);
    expect(s2.maxProgress).toBe(0.5);
    expect(s2.completedAt).toBeNull();
  });
  it("completes when dwell reaches half the reading time", () => {
    let s = null;
    let t = opened.getTime();
    for (let i = 0; i < 15; i++) {
      t += 15_000;
      s = applyHeartbeat(s, { progress: 0.3, activeSeconds: 15 }, new Date(t), 4, opened);
    }
    expect(s!.dwellSeconds).toBeGreaterThanOrEqual(120);
    expect(s!.completedAt).not.toBeNull();
  });
});
