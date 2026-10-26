/**
 * Injected time source. Domain code never calls Date.now() (AGENTS.md, docs/04 §4.6);
 * application code receives a Clock so tests can freeze or move time.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export function fixedClock(at: Date | string): Clock & { set(d: Date | string): void; advance(ms: number): void } {
  let t = new Date(at).getTime();
  return {
    now: () => new Date(t),
    set: (d) => {
      t = new Date(d).getTime();
    },
    advance: (ms) => {
      t += ms;
    },
  };
}
