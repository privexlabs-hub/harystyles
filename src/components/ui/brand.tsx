import Link from "next/link";
import { cx } from "@/lib/cx";

/** Logomark: an "h" drawn as a candle with a flame (page-brand.jsx, HSLogomark). */
export function Logomark({ size = 48, color = "var(--accent)", className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
      <path d="M16 36V12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 24Q24 18 24 28T32 36" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M32 12Q34 9 32 6Q30 9 32 12Z" fill={color} />
      <circle cx="32" cy="14" r="1.4" fill="var(--bg)" />
    </svg>
  );
}

/** Wordmark: lowercase "harystyles" in Fraunces with an accent period (HSWordmark). */
export function Wordmark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx("font-serif font-normal text-fg-strong", className)}
      style={{ fontSize: size, letterSpacing: "-0.035em", lineHeight: 1, fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
    >
      harystyles<span className="text-accent">.</span>
    </span>
  );
}

export function BrandLink({ href = "/", small = true }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="harystyles home">
      <Logomark size={small ? 24 : 40} />
      <Wordmark size={small ? 18 : 30} />
    </Link>
  );
}
