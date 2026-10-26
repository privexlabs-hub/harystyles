"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/** Toasts (page-components.jsx): accent-bordered with candle. Announced politely to screen readers. */
type Toast = { id: number; text: string; action?: { href: string; label: string } };
const Ctx = createContext<{ show: (text: string, action?: { href: string; label: string }) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, action?: { href: string; label: string }) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-[12px] border border-accent bg-bg-elevated px-4 py-3 text-sm text-fg shadow-[var(--shadow-md)]">
            <span className="text-accent">
              <Icon.candle />
            </span>
            <span>{t.text}</span>
            {t.action && (
              <Link href={t.action.href} className="ml-2 whitespace-nowrap text-accent underline underline-offset-4">
                {t.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside ToastProvider");
  return c;
}

/** Shows a one-off toast on mount (e.g. after a redirect). */
export function ToastOnMount({ text }: { text: string }) {
  const t = useToast();
  useEffect(() => t.show(text), [t, text]);
  return null;
}
