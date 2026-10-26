import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { allocateFee, roundHalfEvenDiv, split } from "@/server/money/allocate";

describe("BR-LD-02 money", () => {
  it("rounds half to even", () => {
    expect(roundHalfEvenDiv(25, 10)).toBe(2);
    expect(roundHalfEvenDiv(35, 10)).toBe(4);
    expect(roundHalfEvenDiv(26, 10)).toBe(3);
    expect(roundHalfEvenDiv(-25, 10)).toBe(-2);
  });
  it("splits a $4 line with a 42c fee 90/10 of net", () => {
    expect(split(400, 42, 0)).toEqual({ net: 358, platform: 36, writer: 322 });
  });
  it("allocations always sum to the fee (property)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 200_000 }), { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 50_000 }),
        (amounts, fee) => {
          const lines = amounts.map((a, i) => ({ id: `l${String(i).padStart(2, "0")}`, amountMinor: a, taxMinor: 0 }));
          const alloc = allocateFee(lines, fee);
          const sum = [...alloc.values()].reduce((s, v) => s + v, 0);
          return sum === fee && [...alloc.values()].every((v) => v >= 0 && Number.isInteger(v));
        },
      ),
      { numRuns: 1000 },
    );
  });
  it("platform + writer == net and both non-negative when amount ≥ fee + tax (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 }), (net, fee, tax) => {
        const r = split(net + fee + tax, fee, tax);
        return r.platform + r.writer === r.net && r.platform >= 0 && r.writer >= 0;
      }),
      { numRuns: 1000 },
    );
  });
  it("rejects non-integer money", () => {
    expect(() => split(4.5, 0, 0)).toThrow();
  });
});
