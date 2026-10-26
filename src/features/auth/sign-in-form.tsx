"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, Notice, TextInput } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";

/** BR-ID-01: magic link, passkey, Google/Apple. No passwords. Responses never reveal whether an account exists. */
export function SignInForm({ next, google, apple }: { next: string; google: boolean; apple: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "email" | "passkey" | "oauth">(null);
  const [error, setError] = useState<string | null>(null);
  const callbackURL = `/onboarding?next=${encodeURIComponent(next)}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("That email doesn't look quite right.");
      return;
    }
    setBusy("email");
    const res = await authClient.signIn.magicLink({ email, callbackURL, newUserCallbackURL: callbackURL, errorCallbackURL: "/sign-in?error=link" });
    setBusy(null);
    if (res.error) {
      setError(res.error.status === 429 ? "That's a lot of links at once. Try again in a minute." : "We couldn't send a link just now. Please try again.");
      return;
    }
    router.push(`/sign-in/check-email?email=${encodeURIComponent(email)}`);
  }

  async function withPasskey() {
    setError(null);
    setBusy("passkey");
    const res = await authClient.signIn.passkey();
    setBusy(null);
    if (res?.error) {
      setError("That passkey didn't work here. Use an email link instead, then add a passkey in Settings.");
      return;
    }
    router.push(callbackURL);
    router.refresh();
  }

  async function social(provider: "google" | "apple") {
    setBusy("oauth");
    await authClient.signIn.social({ provider, callbackURL, errorCallbackURL: "/sign-in?error=oauth" });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={sendLink} className="flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="email" error={error ?? undefined}>
          <TextInput
            id="email"
            type="email"
            name="email"
            autoComplete="email webauthn"
            inputMode="email"
            placeholder="you@somewhere.coast"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : undefined}
            required
          />
        </Field>
        <Button type="submit" size="lg" full disabled={busy !== null}>
          {busy === "email" ? "Sending your link…" : "Email me a sign-in link"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-fg-faint" aria-hidden>
        <span className="h-px flex-1 bg-line-soft" />
        <span className="mono">or</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>
      <Button variant="outline" size="lg" full onClick={withPasskey} disabled={busy !== null} icon={<Icon.lock />}>
        {busy === "passkey" ? "Waiting for your passkey…" : "Sign in with a passkey"}
      </Button>
      {google && (
        <Button variant="secondary" size="lg" full onClick={() => social("google")} disabled={busy !== null}>
          Continue with Google
        </Button>
      )}
      {apple && (
        <Button variant="secondary" size="lg" full onClick={() => social("apple")} disabled={busy !== null}>
          Continue with Apple
        </Button>
      )}
      <Notice>No passwords here. We’ll send a link that works once, for 15 minutes.</Notice>
    </div>
  );
}
