import { Navigate, Link } from "react-router-dom";
import { IconWallet } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { LandingHeader } from "@/components/tools/landing-header";
import { AUTH_CTA, DEMO_ROUTE } from "@/lib/auth/constants";
import { SignUpColumn } from "./components/sign-up-column";

/**
 * Sign up (`/sign-up`) — the same screen as sign-in, in the same two steps.
 *
 * Keep this shell identical to sign-in/index.tsx: same surface, same header,
 * same centring. See docs/design/auth-screen.md.
 */
export default function Page() {
  const { user, loading } = useAuth();

  // Already authenticated → Settings FTUX for first-time setup.
  if (!loading && user) {
    return <Navigate to="/overview?settings=money" replace />;
  }

  return (
    <div
      className="relative flex min-h-screen flex-col text-white"
      style={{ backgroundImage: "var(--tint-gradient)" }}
    >
      <LandingHeader
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
        <h1 className="sr-only">Create your Budget &amp; Expense Tracker account</h1>
        <SignUpColumn />
      </main>
    </div>
  );
}
