import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PayFrequency } from "@/lib/data-provider";
import { getPeriodForDate } from "@/lib/periods";

const FREQUENCIES: PayFrequency[] = ["Weekly", "Biweekly", "Monthly"];

// Weekday anchors map to periods.ts weekly convention: 1 = Monday … 5 = Friday.
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** "1st", "2nd", "3rd", "21st" … */
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Pay-day options depend on the selected frequency. */
function payDayOptions(
  frequency: PayFrequency,
): { value: number; label: string }[] {
  if (frequency === "Weekly") {
    return WEEKDAYS.map((label, i) => ({ value: i + 1, label }));
  }
  // Monthly + Biweekly both anchor to a day-of-month (schema stores anchor_day).
  return Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${ordinal(i + 1)} of the month`,
  }));
}

/**
 * Live, concrete preview of the pay period derived from frequency + anchor day
 * via `src/lib/periods.ts`. Updates as the user changes either field.
 */
function describePeriod(frequency: PayFrequency, anchorDay: number): string {
  const period = getPeriodForDate(frequency, anchorDay, new Date());
  const start = parseISO(period.start);
  const end = parseISO(period.end);

  if (frequency === "Weekly") {
    return `Your period: ${format(start, "EEEE")} → ${format(end, "EEEE")}`;
  }
  if (frequency === "Biweekly") {
    return `Your period: ${format(start, "MMM d")} → ${format(
      end,
      "MMM d",
    )} (14 days)`;
  }
  // Monthly — spoken in ordinal terms to match the anchor-day mental model.
  const sameMonth = start.getMonth() === end.getMonth();
  return `Your period: ${ordinal(start.getDate())} → ${ordinal(
    end.getDate(),
  )} of ${sameMonth ? "this month" : "next month"}`;
}

interface PayCycleSectionProps {
  frequency: PayFrequency;
  anchorDay: number;
  onFrequencyChange: (frequency: PayFrequency) => void;
  onAnchorDayChange: (anchorDay: number) => void;
}

export function PayCycleSection({
  frequency,
  anchorDay,
  onFrequencyChange,
  onAnchorDayChange,
}: PayCycleSectionProps) {
  const options = useMemo(() => payDayOptions(frequency), [frequency]);
  const preview = useMemo(
    () => describePeriod(frequency, anchorDay),
    [frequency, anchorDay],
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Pay cycle</h2>
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="income-frequency">Income frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) =>
                onFrequencyChange(value as PayFrequency)
              }
            >
              <SelectTrigger id="income-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-day">Pay day</Label>
            <Select
              value={String(anchorDay)}
              onValueChange={(value) => onAnchorDayChange(Number(value))}
            >
              <SelectTrigger id="pay-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">{preview}</p>
        </CardContent>
      </Card>
    </section>
  );
}
