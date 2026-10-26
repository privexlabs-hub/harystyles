/**
 * Money math — single home of BR-LD-01/02 (docs/03 §3.9f). Integers (minor units) only; floats are
 * forbidden anywhere money is handled. Built in Milestone A so Milestone B billing builds on a
 * tested core.
 */
export type Line = { id: string; amountMinor: number; taxMinor: number };

function assertInt(n: number, what: string) {
  if (!Number.isSafeInteger(n)) throw new Error(`${what} must be a safe integer (minor units)`);
}

/** Round half to even for a rational a/b (b > 0), integers only. */
export function roundHalfEvenDiv(a: number, b: number): number {
  assertInt(a, "numerator");
  assertInt(b, "denominator");
  if (b <= 0) throw new Error("denominator must be positive");
  const q = Math.floor(a / b);
  const r = a - q * b; // 0 ≤ r < b
  const twice = 2 * r;
  if (twice < b) return q;
  if (twice > b) return q + 1;
  return q % 2 === 0 ? q : q + 1;
}

/** Largest-remainder allocation of `fee` across lines by amount; ties → lower line id. */
export function allocateFee(lines: readonly Line[], fee: number): Map<string, number> {
  assertInt(fee, "fee");
  const total = lines.reduce((s, l) => (assertInt(l.amountMinor, "amount"), s + l.amountMinor), 0);
  const out = new Map<string, number>();
  if (lines.length === 0) return out;
  if (total <= 0) {
    lines.forEach((l, i) => out.set(l.id, i === 0 ? fee : 0));
    return out;
  }
  const parts = lines.map((l) => {
    const num = fee * l.amountMinor;
    const floor = Math.floor(num / total);
    return { id: l.id, floor, rem: num - floor * total };
  });
  let remainder = fee - parts.reduce((s, p) => s + p.floor, 0);
  const order = [...parts].sort((a, b) => b.rem - a.rem || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const p of order) {
    if (remainder <= 0) break;
    p.floor += 1;
    remainder -= 1;
  }
  for (const p of parts) out.set(p.id, p.floor);
  return out;
}

export const PLATFORM_PERCENT = 10;

/** BR-LD-02: net = gross − fee − tax; platform = roundHalfEven(net × 10%); writer = net − platform. */
export function split(amountMinor: number, feeAllocMinor: number, taxMinor: number) {
  assertInt(amountMinor, "amount");
  assertInt(feeAllocMinor, "fee allocation");
  assertInt(taxMinor, "tax");
  const net = amountMinor - feeAllocMinor - taxMinor;
  const platform = roundHalfEvenDiv(net * PLATFORM_PERCENT, 100);
  return { net, platform, writer: net - platform };
}
