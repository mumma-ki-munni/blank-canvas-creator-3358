import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * First-visit onboarding banner. Rendered only when the profile has not yet
 * completed FTUX (`ftux_completed === false`). There is no dismiss button — the
 * user completes it by saving their pay cycle, not by closing (screenboard).
 */
export function SettingsFtuxBanner() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Set up your pay cycle to get started
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-pretty text-sm text-muted-foreground">
          Budget & Expense Tracker works paycheck to paycheck — not calendar
          month. Tell us when you get paid so we can calculate your periods.
        </p>
      </CardContent>
    </Card>
  );
}
