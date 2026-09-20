import { Navigate, useLocation, Link } from "react-router-dom";
import { IconWallet } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { LandingHeader } from "@/components/tools/landing-header";
import { AUTH_CTA, DEMO_ROUTE } from "@/lib/auth/constants";
import { SignInColumn } from "./components/sign-in-column";

/**
 * Sign in (`/sign-in`) — the front door.
 *
 * Two steps, and the first has no fields: a welcome and three buttons on the
 * brand gradient, then the email form in place. See docs/design/auth-screen.md.
 *
 * The gradient is the landing page's own treatment, not a new one invented
 * here, and the header is the landing page's header minus its auth CTA —
 * rendering "Get started" here would be a button to the page you are already
 * on.
 */
export default function Page() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (!loading && user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname;
    return <Navigate to={from ?? "/overview"} replace />;
  }

  return (
    <div
      className="relative flex min-h-screen flex-col text-white"
      style={{ backgroundImage: "var(--tint-gradient)" }}
    >
      <LandingHeader
        // Absolute, not the header's own `sticky`: a header in the flow pushes
        // the column below the viewport's centre by half its height.
        className="absolute inset-x-0 top-0"
        icon={<IconWallet size={24} strokeWidth={2} />}
        name="Budget & Expense Tracker"
        actions={
          <Link to={DEMO_ROUTE} className="text-[15px] font-medium text-white/80">
            {AUTH_CTA.demo}
          </Link>
        }
      />
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <h1 className="sr-only">Sign in to Budget &amp; Expense Tracker</h1>
        <SignInColumn />
      </main>
    </div>
  );
}
