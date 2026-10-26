/**
 * Read detection — single home of BR-RA-08 (docs/03 §3.9e). A letter counts as read when scroll
 * progress ≥ 0.8 or active dwell ≥ 50% of reading time. Client numbers are clamped for plausibility.
 */
export const READ_PROGRESS = 0.8;
export const HEARTBEAT_SLACK_S = 2;

export type ReadState = { maxProgress: number; dwellSeconds: number; lastHeartbeatAt: Date | null; completedAt: Date | null };
export type Heartbeat = { progress: number; activeSeconds: number };

export function applyHeartbeat(prev: ReadState | null, hb: Heartbeat, now: Date, readingMinutes: number, firstOpenedAt: Date): ReadState {
  const last = prev?.lastHeartbeatAt ?? firstOpenedAt;
  // Dwell can't exceed wall-clock time since the previous heartbeat (+2 s slack).
  const wall = Math.max(0, (now.getTime() - last.getTime()) / 1000) + HEARTBEAT_SLACK_S;
  const active = Math.max(0, Math.min(hb.activeSeconds, wall, 120));
  const progress = Math.min(1, Math.max(prev?.maxProgress ?? 0, Number.isFinite(hb.progress) ? hb.progress : 0, 0));
  const dwellSeconds = Math.round((prev?.dwellSeconds ?? 0) + active);
  const completed =
    prev?.completedAt ?? (progress >= READ_PROGRESS || dwellSeconds >= readingMinutes * 60 * 0.5 ? now : null);
  return { maxProgress: progress, dwellSeconds, lastHeartbeatAt: now, completedAt: completed };
}
