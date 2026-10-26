import Link from "next/link";
import { Suspense } from "react";
import { BrandLink } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";
import { NavLinks, TabBarLinks } from "./nav-links";
import { ViewerMenu } from "./viewer-menu";

/** ReaderTopNav (screens-web-reader.jsx) on ≥ md; the iOS TabBar (components.jsx) below md. */
export function ReaderTopNav() {
  return (
    <header className="sticky top-0 z-[10] border-b border-line-soft bg-[color-mix(in_oklch,var(--bg)_92%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-8 px-4 md:h-16 md:px-10">
        <BrandLink href="/tonight" />
        <nav aria-label="Primary" className="ml-6 hidden gap-7 md:flex">
          <Suspense fallback={<StaticLinks />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-3.5">
          <Link
            href="/search"
            aria-label="Search"
            className="grid size-11 place-items-center rounded-full border border-line bg-bg-elevated text-fg md:size-9"
          >
            <Icon.search />
          </Link>
          <Suspense fallback={<span className="size-8 rounded-full bg-bg-elevated" aria-hidden />}>
            <ViewerMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[10] flex h-[78px] justify-around border-t border-line-soft bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] pb-[18px] pt-2.5 backdrop-blur-xl md:hidden"
    >
      <Suspense fallback={null}>
        <TabBarLinks />
      </Suspense>
    </nav>
  );
}

/** Pre-hydration fallback: same links, no active state. */
function StaticLinks() {
  return (
    <>
      {[
        ["/tonight", "Tonight"],
        ["/moods", "Moods"],
        ["/writers", "Writers"],
        ["/shelf", "Your shelf"],
      ].map(([href, label]) => (
        <Link key={href} href={href!} className="border-b border-transparent pb-0.5 text-sm text-fg-muted">
          {label}
        </Link>
      ))}
    </>
  );
}
