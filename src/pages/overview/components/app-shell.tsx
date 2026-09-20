import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconReceipt,
  IconWallet,
  IconLogin,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth-provider";
import { AccountMenu } from "@/components/account/account-menu";
import { SettingsDialog } from "@/components/account/settings-dialog";

/**
 * What the demo says about itself, in one place, once.
 *
 * Everything in the demo really works — add, edit, mark paid, delete. The only
 * difference from the paying app is that a page load starts it over, so this
 * line says exactly that and nothing else. No sign-in nudge: nothing here was
 * ever the visitor's to lose.
 */
const DEMO_SECOND_LINE = "Demo — resets when you reload";

function useIsDemo(): boolean {
  const { pathname } = useLocation();
  return pathname.toLowerCase().startsWith("/demo");
}

/** The `/demo` prefix is preserved so the sidebar keeps the user inside the demo. */
export function useRouteBase(): string {
  const { pathname } = useLocation();
  return pathname.startsWith("/demo") ? "/demo" : "";
}

interface NavItem {
  label: string;
  path: string;
  icon: typeof IconLayoutDashboard;
}

const bodyItems: NavItem[] = [
  { label: "Overview", path: "/overview", icon: IconLayoutDashboard },
  { label: "Expenses", path: "/expenses", icon: IconReceipt },
  { label: "Income", path: "/income", icon: IconWallet },
];

function NavLink({ item, base }: { item: NavItem; base: string }) {
  const { pathname } = useLocation();
  const href = `${base}${item.path}`;
  const isActive = pathname === href;
  return (
    <Link
      to={href}
      style={
        isActive
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}

/**
 * Workspace shell for the app screens (adapts workspace-layout-03).
 * Narrow, always-visible sidebar; no collapse toggle (screenboard).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const base = useRouteBase();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemo = useIsDemo();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border p-4 md:flex">
        <Link
          to={`${base}/overview`}
          className="mb-8 px-3 pt-2 font-heading text-base font-semibold tracking-tight text-foreground text-balance"
        >
          Budget & Expense Tracker
        </Link>
        <nav className="flex flex-col gap-1">
          {bodyItems.map((item) => (
            <NavLink key={item.path} item={item} base={base} />
          ))}
        </nav>
        <div className="flex-1" />
        <Separator className="my-2" />
        {/* Settings is reached from the account menu, not beside it. One door in. */}
        {isDemo || user ? (
          <AccountMenu
            signOutLabel={isDemo ? "Exit demo" : "Sign Out"}
            onSignOut={isDemo ? () => navigate("/") : undefined}
            // The one place the demo says what it is. Everything here works;
            // the only difference is that reloading starts it over.
            secondLine={isDemo ? DEMO_SECOND_LINE : undefined}
          />
        ) : (
          <Link
            to="/sign-in"
            className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconLogin className="size-5" />
            Sign in
          </Link>
        )}
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>

      <MobileNavBar base={base} isDemo={isDemo} />

      {/* Mounted once, on every app screen, so `?settings=…` works cold. */}
      <SettingsDialog />
    </div>
  );
}

/**
 * Fixed bottom navigation for mobile.
 * Shown below `md`; the sidebar takes over at wider widths.
 */
function MobileNavBar({ base, isDemo }: { base: string; isDemo: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items: NavItem[] = bodyItems;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {items.map((item) => {
          const href = `${base}${item.path}`;
          const isActive = pathname === href;
          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-full py-1.5 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Same one door on a phone: Settings lives inside this menu. */}
        <AccountMenu
          variant="compact"
          signOutLabel={isDemo ? "Exit demo" : "Sign Out"}
          onSignOut={isDemo ? () => navigate("/") : undefined}
          secondLine={isDemo ? DEMO_SECOND_LINE : undefined}
        />
      </div>
    </nav>
  );
}
