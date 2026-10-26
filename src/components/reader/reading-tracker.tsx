"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Read heartbeats (docs/03 §3.9e): every 15 s while visible, plus on page hide. Sends only progress
 * and active seconds; the server clamps both and decides completion (BR-RA-08, INV-14).
 * Also drives the reading progress bar from WebReader.
 */
export function ReadingTracker({ letterId, targetId, enabled, readingMinutes }: { letterId: string; targetId: string; enabled: boolean; readingMinutes: number }) {
  const [progress, setProgress] = useState(0);
  const max = useRef(0);
  const active = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total));
      max.current = Math.max(max.current, p);
      setProgress(p);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [targetId]);

  useEffect(() => {
    if (!enabled) return;
    last.current = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === "visible") active.current += (now - last.current) / 1000;
      last.current = now;
    }, 1000);
    const send = (beacon = false) => {
      const payload = JSON.stringify({ letterId, progress: Math.round(max.current * 1000) / 1000, activeSeconds: Math.round(active.current) });
      active.current = 0;
      if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/v1/reading-progress", new Blob([payload], { type: "application/json" }));
      else void fetch("/api/v1/reading-progress", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => undefined);
    };
    const beat = setInterval(() => send(), 15_000);
    const hide = () => document.visibilityState === "hidden" && send(true);
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(tick);
      clearInterval(beat);
      document.removeEventListener("visibilitychange", hide);
      send(true);
    };
  }, [enabled, letterId]);

  const left = Math.max(0, Math.ceil(readingMinutes * (1 - progress)));
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="block h-0.5 w-24 overflow-hidden rounded-full bg-bg-elevated md:w-[200px]">
        <span className="block h-full bg-accent transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
      </span>
      <span className="font-mono text-[10px] uppercase text-fg-subtle">{left > 0 ? `${left} min left` : "the end"}</span>
    </div>
  );
}
