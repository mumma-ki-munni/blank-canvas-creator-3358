import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { SocialAuthButtons } from "@/components/base/social-auth-buttons";
import { AUTH_WELCOME } from "@/lib/auth/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The sign-in column: two steps, and the first one has no fields.
 *
 * Step 1 is the chooser — a welcome and three buttons, nothing else. Someone
 * arriving has one decision to make, which door, and a form makes them read the
 * screen before they can act, with the quiet common path looking like the hard
 * one.
 *
 * Step 2 is the email form, and it replaces the column in place at
 * `?step=email`, so the browser's own Back button walks back to the chooser
 * instead of leaving the app.
 *
 * There is no card. The column sits straight on the brand gradient, because a
 * card puts a lid on the one branded thing the screen has. See
 * docs/design/auth-screen.md.
 */

const FIELD =
  "h-11 border-white/25 bg-white text-foreground placeholder:text-muted-foreground";

export function SignInColumn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const onEmailStep = searchParams.get("step") === "email";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      // The AuthProvider's onAuthStateChange picks up SIGNED_IN and the page's
      // own redirect guard sends the visitor onward — no navigate here.
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(
          err.message.toLowerCase().includes("email not confirmed")
            ? "Confirm your email first — check your inbox for the activation link."
            : "That email and password don't match. Try again.",
        );
        setSubmitting(false);
      }
    },
    [email, password],
  );

  const openEmail = useCallback(() => {
    setError(null);
    setSearchParams({ step: "email" });
  }, [setSearchParams]);

  const backToChoices = useCallback(() => {
    setError(null);
    setSearchParams({});
  }, [setSearchParams]);

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center">
      {onEmailStep ? (
        <>
          <p className="text-center text-[28px] font-semibold leading-[1.25] tracking-[-0.02em]">
            What&rsquo;s your email?
          </p>
          <p className="mb-8 mt-2 text-center text-sm text-white/80">
            The one you signed up with.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-[280px] flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className={FIELD}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={FIELD}
              />
            </div>

            {error && (
              <p className="text-center text-sm font-medium text-white">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold disabled:opacity-60"
              style={{ color: "var(--tint-pill-text)" }}
            >
              {submitting && <IconLoader2 className="size-4 animate-spin" />}
              {submitting ? "Signing in…" : "Continue"}
            </button>
          </form>

          <button
            type="button"
            onClick={backToChoices}
            className="mt-6 w-full max-w-[280px] text-center text-sm text-white/80 transition-colors hover:text-white"
          >
            Back
          </button>
        </>
      ) : (
        <>
          <p className="mb-14 text-center text-[28px] font-semibold leading-[1.25] tracking-[-0.02em]">
            {AUTH_WELCOME.signIn[0]}
            <br />
            {AUTH_WELCOME.signIn[1]}
          </p>

          <div className="w-full max-w-[280px]">
            {/* The ONE brand-compliant SSO button set. Do not restyle or rebuild
                inline — see docs/design/auth-and-navigation.md §2. */}
            <SocialAuthButtons mode="signin" />

            {/* Email is the quietest door on purpose, but it is still a button,
                so it keeps a shape — bare text on the gradient reads as a stray
                label. */}
            <button
              type="button"
              onClick={openEmail}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-white/40 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Continue with Email
            </button>

            <p className="mt-10 text-center text-sm text-white/80">
              Don&rsquo;t have an account?{" "}
              <Link to="/sign-up" className="font-medium text-white underline">
                Create one
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
