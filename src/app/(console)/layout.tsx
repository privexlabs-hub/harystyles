import Link from "next/link";
import { BrandLink } from "@/components/ui/brand";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Curation console. The docs place it on a separate origin with SSO + hardware-key MFA; in
 * Milestone A it is a role-gated route group in the same app (ADR-027, docs/SECURITY.md).
 */
export default function ConsoleLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <header className="border-b border-line-soft bg-bg-raised">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 overflow-x-auto px-4 md:px-10">
          <BrandLink href="/console" />
          <span className="mono text-accent">Console</span>
          <nav aria-label="Console" className="flex gap-5 text-sm text-fg-muted">
            <Link href="/console">Overview</Link>
            <Link href="/console/applications">Applications</Link>
            <Link href="/console/queue">Mood queue</Link>
            <Link href="/console/issues">Issues</Link>
            <Link href="/console/evergreen">Evergreen</Link>
          </nav>
          <Link href="/tonight" className="ml-auto whitespace-nowrap text-sm text-fg-muted">
            Back to reading
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
        {children}
      </main>
    </ToastProvider>
  );
}
