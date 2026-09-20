import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconLoader2,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDataProvider } from "@/lib/data-provider";
import type { PayFrequency, Profile } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { useRouteBase } from "@/pages/overview/components/app-shell";
import { SettingsFtuxBanner } from "./settings-ftux-banner";
import { PayCycleSection } from "./pay-cycle-section";
import { PreferencesSection } from "./preferences-section";

const DEFAULTS = {
  currency: "USD",
  pay_frequency: "Monthly" as PayFrequency,
  anchor_day: 25,
};

/**
 * Settings data section. Reads the profile via the DataProvider, owns the form
 * state, and writes back through the update mutation. On the FTUX path the save
 * button navigates forward to Overview (cloudboard side effect).
 */
export function SettingsForm() {
  const { useProfile } = useDataProvider();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <SettingsSkeleton />;

  // Remount when the loaded profile changes so form state re-seeds cleanly
  // (avoids syncing async data into state with an effect).
  return <SettingsFormInner key={profile?.id ?? "new"} profile={profile} />;
}

function SettingsFormInner({ profile }: { profile: Profile | null }) {
  const { useUpdateProfile } = useDataProvider();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const base = useRouteBase();
  const { setPayConfig } = useFilters();

  const isFtux = !profile?.ftux_completed;

  const [currency, setCurrency] = useState(profile?.currency ?? DEFAULTS.currency);
  const [frequency, setFrequency] = useState<PayFrequency>(
    profile?.pay_frequency ?? DEFAULTS.pay_frequency,
  );
  const [anchorDay, setAnchorDay] = useState(
    profile?.anchor_day ?? DEFAULTS.anchor_day,
  );

  // Warning appears only for returning users who changed the pay cycle itself
  // (frequency or anchor day) — not for currency (storyboard §29).
  const payCycleChanged =
    !isFtux &&
    profile != null &&
    (frequency !== profile.pay_frequency || anchorDay !== profile.anchor_day);

  const handleFrequencyChange = (next: PayFrequency) => {
    setFrequency(next);
    // Keep the anchor day valid for the new frequency's option set.
    if (next === "Weekly" && (anchorDay < 1 || anchorDay > 5)) {
      setAnchorDay(1);
    } else if (next !== "Weekly" && (anchorDay < 1 || anchorDay > 31)) {
      setAnchorDay(DEFAULTS.anchor_day);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        currency,
        pay_frequency: frequency,
        anchor_day: anchorDay,
        ftux_completed: true,
      });
    } catch {
      // Mutation surfaces its own error toast; stay on the page so the user can retry.
      return;
    }
    // Recalculate all periods so Overview reflects the new pay cycle.
    setPayConfig({ payFrequency: frequency, anchorDay });
    if (isFtux) navigate(`${base}/overview`);
  };

  return (
    <div className="flex flex-col gap-8">
      {isFtux && <SettingsFtuxBanner />}

      <PayCycleSection
        frequency={frequency}
        anchorDay={anchorDay}
        onFrequencyChange={handleFrequencyChange}
        onAnchorDayChange={setAnchorDay}
      />

      {/* Appearance is not here any more: it is a menu setting now, because you
          want to change it, look at the page, and change it again. */}
      <PreferencesSection currency={currency} onCurrencyChange={setCurrency} />

      <div className="flex flex-col gap-6">
        <div>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Save settings
                {isFtux && <IconArrowRight className="size-4" />}
              </>
            )}
          </Button>
        </div>

        {payCycleChanged && (
          <Alert>
            <IconAlertTriangle className="size-4" />
            <AlertDescription>
              Changing your pay cycle will recalculate all periods. Past
              fulfillments stay correct.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

/** Static skeleton (no pulse) matching the two-card settings shape. */
function SettingsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-8">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="flex flex-col gap-4 rounded-lg border-solid p-6">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-9 w-full rounded bg-muted" />
          </div>
        </div>
      ))}
      <div className="h-9 w-32 rounded bg-muted" />
    </div>
  );
}
