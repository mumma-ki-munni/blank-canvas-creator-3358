import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { SocialAuthButtons } from "@/components/base/social-auth-buttons";
import { AUTH_WELCOME } from "@/lib/auth/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The sign-up column — the same screen as sign-in, in the same two steps.
 *
 * Keep this shell identical to sign-in-column.tsx: same widths, same button
 * order, same quiet Email door. Two doors that look like two different products
 * is the thing docs/design/auth-screen.md exists to stop.
 */

const FIELD =
  "h-11 border-white/25 bg-white text-foreground placeholder:text-muted-foreground";

export function SignUpColumn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const onEmailStep = searchParams.get("step") === "email";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        // Confirmation lands on the callback route, never the homepage.
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setSubmitting(false);
      if (err) {
        setError(
          err.message.toLowerCase().includes("already registered")
            ? "That email is already registered. Sign in instead."
            : err.message,
        );
        return;
      }
      setSent(email);
    },
    [email, password],
  );

  if (sent) {
    return (
      <div className="flex w-full max-w-[340px] flex-col items-center text-center">
        <p className="text-[28px] font-semibold leading-[1.25] tracking-[-0.02em]">
          Check your email
        </p>
        <p className="mt-3 max-w-[280px] text-sm text-white/80">
          Confirm your account from the link we just sent to {sent}, then sign
          in.
        </p>
        <Link
          to="/sign-in"
          className="mt-8 flex h-11 w-full max-w-[280px] items-center justify-center rounded-full bg-white text-[15px] font-semibold"
          style={{ color: "var(--tint-pill-text)" }}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center">
      {onEmailStep ? (
        <>
          <p className="text-center text-[28px] font-semibold leading-[1.25] tracking-[-0.02em]">
            What&rsquo;s your email?
          </p>
          <p className="mb-8 mt-2 text-center text-sm text-white/80">
            We&rsquo;ll send one link to confirm it.
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
              {submitting ? "Creating account…" : "Continue"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setSearchParams({});
            }}
            className="mt-6 w-full max-w-[280px] text-center text-sm text-white/80 transition-colors hover:text-white"
          >
            Back
          </button>
        </>
      ) : (
        <>
          <p className="mb-14 text-center text-[28px] font-semibold leading-[1.25] tracking-[-0.02em]">
            {AUTH_WELCOME.signUp[0]}
            <br />
            {AUTH_WELCOME.signUp[1]}
          </p>

          <div className="w-full max-w-[280px]">
            <SocialAuthButtons mode="signup" />

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSearchParams({ step: "email" });
              }}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-white/40 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Continue with Email
            </button>

            <p className="mt-10 text-center text-sm text-white/80">
              Already have an account?{" "}
              <Link to="/sign-in" className="font-medium text-white underline">
                Sign in
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
