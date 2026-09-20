import { useMemo } from "react";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import { IconCircleCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/base/badge";
import { SectionCard } from "@/components/base/section-card";
import { MoneyRow } from "@/components/base/money-row";
import { cn } from "@/lib/utils";
import { fullDate, weekdayDate } from "@/lib/format";
import { useDataProvider } from "@/lib/data-provider";
import type { Fulfillment, Occurrence, RecurringItem } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { getNextOccurrences, getPeriodForDate } from "@/lib/periods";

function isFulfilled(occ: Occurrence, fulfillments: Fulfillment[]): boolean {
  return fulfillments.some(
    (f) =>
      f.recurring_item_id === occ.item_id &&
      (f.occurrence_date === occ.occurrence_date ||
        f.occurrence_date === occ.original_date),
  );
}

/**
 * The next 3 occurrences of an item, each with its calculated (weekend-adjusted)
 * date. Only the next *unfulfilled* occurrence exposes "Mark as fulfilled" — you
 * can't fulfill a later occurrence before the one in front of it (sequential
 * fulfillment, screenboard). Occurrences are computed from start_date + frequency
 * via src/lib/periods.ts — they are never stored.
 */
export function OccurrenceList({ item }: { item: RecurringItem }) {
  const { periodStart } = useFilters();
  const { useProfile, useFulfillments, useCreateFulfillment } = useDataProvider();
  const { data: profile } = useProfile();
  const createFulfillment = useCreateFulfillment();

  const payFrequency = profile?.pay_frequency ?? "Monthly";
  const anchorDay = profile?.anchor_day ?? 25;

  // "Next 3" is measured from the start of the current pay period so an occurrence
  // that already fell earlier in this period is still shown (matches storyboard).
  const occurrences = useMemo(
    () => getNextOccurrences(item, 3, parseISO(periodStart)),
    [item, periodStart],
  );

  // Each of the three occurrences may belong to a different pay period; resolve the
  // period boundary per occurrence so fulfillments are matched (and written) against
  // the correct period_start.
  const periodStarts = occurrences.map(
    (occ) =>
      getPeriodForDate(payFrequency, anchorDay, parseISO(occ.occurrence_date))
        .start,
  );

  // Fixed number of hook calls (exactly 3) keeps hook order stable even when an
  // item ends before three occurrences exist. Absent slots query "" → [].
  const f0 = useFulfillments({ periodStart: periodStarts[0] ?? "" }).data;
  const f1 = useFulfillments({ periodStart: periodStarts[1] ?? "" }).data;
  const f2 = useFulfillments({ periodStart: periodStarts[2] ?? "" }).data;
  const fulfillmentsByIndex = [f0, f1, f2];

  const fulfilledFlags = occurrences.map((occ, i) =>
    isFulfilled(occ, fulfillmentsByIndex[i] ?? []),
  );
  const nextUnfulfilledIndex = fulfilledFlags.findIndex((flag) => !flag);

  const markFulfilled = async (occ: Occurrence, index: number) => {
    const created = await createFulfillment.mutateAsync({
      recurring_item_id: occ.item_id,
      period_start: periodStarts[index] ?? "",
      occurrence_date: occ.occurrence_date,
    });
    if (created) toast.success(`${occ.name} marked as paid`);
  };

  return (
    <SectionCard className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-foreground">
        Next 3 occurrences
      </h2>
      <ul className="-mt-1 divide-y divide-border">
        {occurrences.map((occ, index) => {
          const fulfilled = fulfilledFlags[index];
          return (
            <MoneyRow
              key={`${occ.item_id}-${occ.occurrence_date}`}
              className={cn(fulfilled && "text-muted-foreground")}
              left={
                <span className="tabular-nums">
                  {occ.adjusted ? (
                    <>
                      <span className="text-muted-foreground line-through">
                        {weekdayDate(occ.original_date)}
                      </span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className={cn(!fulfilled && "text-foreground")}>
                        {fullDate(occ.occurrence_date)}
                      </span>
                    </>
                  ) : (
                    <span className={cn(!fulfilled && "text-foreground")}>
                      {fullDate(occ.occurrence_date)}
                    </span>
                  )}
                </span>
              }
              right={
                fulfilled ? (
                  <Badge color="green" className="gap-1">
                    <IconCircleCheck className="size-3.5" />
                    Fulfilled
                  </Badge>
                ) : index === nextUnfulfilledIndex ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markFulfilled(occ, index)}
                    disabled={createFulfillment.isPending}
                  >
                    Mark as fulfilled
                  </Button>
                ) : null
              }
            />
          );
        })}
      </ul>
    </SectionCard>
  );
}
