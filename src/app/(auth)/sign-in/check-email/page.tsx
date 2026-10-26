import type { Metadata } from "next";
import Link from "next/link";
import { Logomark } from "@/components/ui/brand";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="amber-orb grid size-[72px] place-items-center">
        <Logomark size={40} color="var(--ink-1000)" />
      </span>
      <p className="eyebrow m-0">Check your email</p>
      <h1 className="title-display m-0">
        A link is on its <span className="italic-display text-accent">way.</span>
      </h1>
      <p className="body-ui m-0 max-w-[40ch]">
        If that address can sign in, you’ll find a link from us. It works once, for 15 minutes. You can close this tab.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <p className="caption m-0">Development: links are written to <code className="font-mono">.mail/outbox.jsonl</code>.</p>
      )}
      <Link href="/sign-in" className="text-sm text-fg-muted underline underline-offset-4">
        Use a different email
      </Link>
    </div>
  );
}
