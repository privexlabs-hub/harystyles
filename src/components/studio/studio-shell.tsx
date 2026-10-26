import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand";
import { Avatar, MoodDot } from "@/components/ui/primitives";
import type { Mood } from "@/contracts/enums";

/** WebStudio sidebar (screens-web.jsx): 240px rail on desktop, compact top bar on mobile. */
export function StudioShell({
  active,
  penName,
  hue,
  notebooks,
  children,
}: {
  active: "letters" | "notebooks" | "profile";
  penName: string;
  hue: number;
  notebooks: { id: string; title: string; moodTint: string | null; publishedCount: number }[];
  children: ReactNode;
}) {
  const items = [
    ["letters", "Letters", "/studio"],
    ["notebooks", "Notebooks", "/studio/notebooks"],
    ["profile", "Profile", "/studio/profile"],
  ] as const;
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line-soft bg-bg-raised px-4 py-4 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r md:px-5 md:py-6">
        <div className="flex items-center justify-between md:block">
          <BrandLink href="/tonight" />
          <div className="mt-0 flex items-center gap-3 md:mt-8">
            <Avatar name={penName} size={36} hue={hue} />
            <div className="hidden flex-col md:flex">
              <span className="text-sm text-fg">{penName}</span>
              <span className="caption">writing studio</span>
            </div>
          </div>
        </div>
        <p className="eyebrow mb-2 mt-8 hidden md:block">Studio</p>
        <nav aria-label="Studio" className="mt-3 flex gap-1 overflow-x-auto md:mt-0 md:flex-col">
          {items.map(([id, label, href]) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${active === id ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-fg" : "text-fg-muted hover:text-fg"}`}
            >
              {label}
            </Link>
          ))}
          <Link href="/tonight" className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-fg-muted hover:text-fg md:mt-2">
            ← Back to reading
          </Link>
        </nav>
        {notebooks.length > 0 && (
          <div className="hidden md:block">
            <p className="eyebrow mb-2 mt-8">Notebooks</p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {notebooks.map((n) => (
                <li key={n.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-fg-muted">
                  <MoodDot mood={(n.moodTint as Mood | null) ?? "tender"} />
                  <span className="truncate">{n.title}</span>
                  <span className="ml-auto font-mono text-[10px]">{n.publishedCount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <div className="min-w-0 px-4 py-8 md:px-10 md:py-12">{children}</div>
    </div>
  );
}
