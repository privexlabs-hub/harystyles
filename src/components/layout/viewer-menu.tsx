import Link from "next/link";
import { getViewer, hasRole, isStaff } from "@/server/modules/identity";
import { Avatar } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/sign-out-button";

/** Session-dependent corner of the nav; streams in behind <Suspense>. */
export async function ViewerMenu() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Link href="/sign-in" className={buttonClass("outline", "sm")}>
        Sign in
      </Link>
    );
  }
  const name = viewer.displayName || viewer.email;
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-full [&::-webkit-details-marker]:hidden" aria-label="Your account">
        <Avatar name={name} size={32} hue={45} />
      </summary>
      <div className="absolute right-0 top-11 z-[40] flex w-56 flex-col rounded-[12px] border border-line bg-bg-elevated p-1.5 shadow-[var(--shadow-md)]">
        <p className="caption m-0 truncate px-3 py-2">{viewer.email}</p>
        <MenuLink href="/shelf">Your shelf</MenuLink>
        <MenuLink href="/settings">Settings</MenuLink>
        {hasRole(viewer, "writer") ? <MenuLink href="/studio">Writing studio</MenuLink> : <MenuLink href="/studio/apply">Apply to write</MenuLink>}
        {isStaff(viewer) && <MenuLink href="/console">Curation console</MenuLink>}
        <div className="my-1 h-px bg-line-soft" />
        <SignOutButton />
      </div>
    </details>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2.5 text-sm text-fg hover:bg-bg-raised">
      {children}
    </Link>
  );
}
