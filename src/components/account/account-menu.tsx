import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-provider";
import { useDataProvider } from "@/lib/data-provider";
import { useAppearance } from "@/lib/appearance";
import { UserAvatar } from "./user-avatar";
import { useSettingsUrl } from "./use-settings-url";

const APPEARANCE_LABEL = { light: "light", dark: "dark", auto: "auto" } as const;

/**
 * The account menu — three bands answering three different questions:
 * who am I signed in as, where do I go and what can I change from here, and
 * how do I leave.
 *
 * The way out sits alone in the last band, for the same reason Delete does on
 * an item: you should never land on it while reaching for something else.
 */
export function AccountMenu({
  variant = "full",
  signOutLabel = "Sign Out",
  onSignOut,
  secondLine: secondLineOverride,
}: {
  /** "compact" is the narrow trigger for the mobile bar: the avatar on its own. */
  variant?: "full" | "compact";
  signOutLabel?: string;
  onSignOut?: () => void;
  /**
   * The small line under the name. Defaults to the signed-in email.
   *
   * The demo passes its own, because "Not signed in" is auth chrome on a
   * surface that never asks anyone to sign in — it tells a visitor they are
   * logged out of something they never tried to log into.
   */
  secondLine?: string;
}) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { useProfile } = useDataProvider();
  const { data: profile } = useProfile();
  const { appearance, cycleAppearance } = useAppearance();
  const { openSettings } = useSettingsUrl();

  const name = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Your account";
  const secondLine = secondLineOverride ?? user?.email ?? "Not signed in";

  const handleSignOut = useCallback(async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    await signOut();
    navigate("/sign-in", { replace: true });
  }, [navigate, onSignOut, signOut]);

  const handleSettings = useCallback(() => openSettings("account"), [openSettings]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* The accessible name is the job — "Account Menu" — not the person's
            name, because a screen reader already reads the name written inside. */}
        {variant === "compact" ? (
          <button
            type="button"
            aria-label="Account Menu"
            className="flex flex-1 flex-col items-center gap-1 rounded-full py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            {/* No name is written beside it here, so the circle carries the name. */}
            <UserAvatar
              userId={profile?.id ?? user?.id}
              name={name}
              photoUrl={profile?.avatar_url}
              size={20}
            />
            Account
          </button>
        ) : (
          <button
            type="button"
            aria-label="Account Menu"
            className="flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition-colors hover:bg-muted"
          >
            <UserAvatar
              userId={profile?.id ?? user?.id}
              name={name}
              photoUrl={profile?.avatar_url}
              size={32}
              nameIsWritten
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {secondLine}
              </span>
            </span>
            <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-64">
        {/* Band 1 — who am I signed in as. The tick answers "which one am I
            in", so adding a second account later changes nothing here. */}
        <DropdownMenuItem
          onSelect={handleSettings}
          className="flex items-start gap-2"
        >
          <IconCheck className="mt-0.5 size-4 shrink-0" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {secondLine}
            </span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Band 2 — where do I go, and what can I change from here. */}
        <DropdownMenuItem onSelect={handleSettings}>Settings</DropdownMenuItem>
        <DropdownMenuItem
          // Cycling must not close the menu: the page changes behind it, so you
          // look, judge, and click again until it is right.
          onSelect={(event) => {
            event.preventDefault();
            cycleAppearance();
          }}
          className="justify-between"
        >
          <span>Appearance</span>
          <span className="text-xs text-muted-foreground">
            {APPEARANCE_LABEL[appearance]}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Band 3 — how do I leave. Alone, on purpose. */}
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
