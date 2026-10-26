"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

const LINKS = [
  { href: "/tonight", label: "Tonight" },
  { href: "/moods", label: "Moods" },
  { href: "/writers", label: "Writers" },
  { href: "/shelf", label: "Your shelf" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "border-b pb-0.5 text-sm transition-colors",
              active ? "border-accent font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}

const TABS = [
  { href: "/tonight", label: "Tonight", icon: Icon.candle },
  { href: "/moods", label: "Moods", icon: Icon.search },
  { href: "/writers", label: "Writers", icon: Icon.letter },
  { href: "/shelf", label: "Shelf", icon: Icon.bookmark },
  { href: "/settings", label: "Me", icon: Icon.user },
];

export function TabBarLinks() {
  const path = usePathname();
  return (
    <>
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(`${t.href}/`);
        const I = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cx("flex min-w-14 flex-col items-center gap-1", active ? "text-accent" : "text-fg-faint")}
          >
            <I />
            <span className="text-[10px] font-medium uppercase tracking-[0.04em]">{t.label}</span>
          </Link>
        );
      })}
    </>
  );
}
