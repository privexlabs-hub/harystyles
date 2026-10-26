import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/modules/identity";
import { features } from "@/server/kernel/env";
import { SignInForm } from "@/features/auth/sign-in-form";
import { Notice, Skeleton } from "@/components/ui/primitives";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="eyebrow m-0">The lamp is waiting</p>
        <h1 className="title-display m-0">
          Sign in to <span className="italic-display text-accent">harystyles.</span>
        </h1>
        <p className="body-ui m-0">Browse freely without an account. You’ll need one to keep lines, follow writers, or support them.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <SignInBody searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function SignInBody({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getViewer()) redirect(next);
  const error = typeof sp.error === "string" ? sp.error : null;
  return (
    <>
      {error && <Notice tone="error">That link has expired or was already used. Ask for a new one below.</Notice>}
      <SignInForm next={next} google={features.google()} apple={features.apple()} />
    </>
  );
}
