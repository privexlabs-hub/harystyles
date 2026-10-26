import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Btn from the design source: always pill, 5 variants × 3 sizes (components.jsx). */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "premium";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE: Record<ButtonSize, string> = {
  // sm keeps a 44px hit area through padding on the wrapper only where needed; visual height per design.
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-5 text-[15px] gap-2.5",
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg border-transparent hover:bg-accent-hover",
  secondary: "bg-bg-elevated text-fg border-line hover:border-line-strong",
  ghost: "bg-transparent text-fg border-transparent hover:bg-bg-elevated",
  outline: "bg-transparent text-fg border-line-strong hover:bg-bg-elevated",
  premium: "bg-premium text-ink-50 border-transparent hover:brightness-110",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", full = false): string {
  return cx(
    "inline-flex items-center justify-center rounded-full border font-sans font-medium tracking-[0.005em] whitespace-nowrap",
    "transition-[background-color,border-color,color,filter] duration-[var(--dur-2)] ease-out",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    SIZE[size],
    VARIANT[variant],
    full && "w-full",
  );
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; icon?: ReactNode; iconRight?: ReactNode };

export function Button({
  variant,
  size,
  full,
  icon,
  iconRight,
  className,
  children,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cx(buttonClass(variant, size, full), className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  full,
  icon,
  iconRight,
  className,
  children,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cx(buttonClass(variant, size, full), className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

/** Round icon-only button (36px visual, 44px target). Requires an accessible label. */
export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "relative inline-grid size-9 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:text-fg hover:border-line-strong",
        "before:absolute before:-inset-1 before:content-['']",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
