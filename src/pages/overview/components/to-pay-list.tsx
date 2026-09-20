import { Link } from "react-router-dom";
import { toast } from "sonner";
import { IconCheck, IconCircleCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/base/badge";
import { SectionCard } from "@/components/base/section-card";
import { MoneyRow } from "@/components/base/money-row";
import { useCurrency, shortDate } from "@/lib/format";
import { useDataProvider } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import type { Occurrence } from "@/lib/data-provider";
import { useRouteBase } from "./app-shell";

/**
 * The "To pay this period" list with inline mark-fulfilled, the "Cost fulfilled"
 * list, and the "Income this period" section. All rows use the shared MoneyRow.
 */
export function ToPayList() {
  const { rangeStart: periodStart, rangeEnd: periodEnd } = useFilters();
  const { useOverviewData, useCreateFulfillment } = useDataProvider();
  const { data } = useOverviewData({ periodStart, periodEnd });
  const createFulfillment = useCreateFulfillment();
  const format = useCurrency();
  const base = useRouteBase();

  const markFulfilled = async (occ: Occurrence, receivedCopy: boolean) => {
    // Both providers really write, so both return a record. The guard is for
    // the Supabase path, which can come back empty when the insert fails.
    const created = await createFulfillment.mutateAsync({
      recurring_item_id: occ.item_id,
      period_start: periodStart,
      occurrence_date: occ.occurrence_date,
    });
    if (created) {
      toast.success(
        receivedCopy
          ? `${occ.name} marked as received`
          : `${occ.name} marked as paid`,
      );
    }
  };

  const NameLink = ({ occ }: { occ: Occurrence }) => (
    <Link
      to={`${base}/items/${occ.item_id}`}
      className="truncate font-medium text-foreground hover:underline"
    >
      {occ.name}
    </Link>
  );

  const Amount = ({ occ }: { occ: Occurrence }) => (
    <span className="tabular-nums text-foreground">{format(occ.amount)}</span>
  );

  const SubHeading = ({ children }: { children: string }) => (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );

  return (
    <SectionCard>
      <h2 className="text-sm font-semibold text-foreground">To pay this period</h2>
      <ul className="mt-3 flex flex-col divide-y divide-border">
        {data.toPayItems.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">
            Nothing left to pay this period.
          </li>
        ) : (
          data.toPayItems.map((occ) => (
            <MoneyRow
              key={`${occ.item_id}-${occ.occurrence_date}`}
              left={<NameLink occ={occ} />}
              right={
                <>
                  <Amount occ={occ} />
                  <span className="w-14 text-right tabular-nums text-muted-foreground">
                    {shortDate(occ.occurrence_date)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markFulfilled(occ, false)}
                    disabled={createFulfillment.isPending}
                  >
                    <IconCheck className="size-4" />
                    Mark fulfilled
                  </Button>
                </>
              }
            />
          ))
        )}
      </ul>

      {data.fulfilledItems.length > 0 && (
        <>
          <div className="my-4 border-t border-border" />
          <SubHeading>Cost fulfilled</SubHeading>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {data.fulfilledItems.map((occ) => (
              <MoneyRow
                key={`${occ.item_id}-${occ.occurrence_date}`}
                left={<NameLink occ={occ} />}
                right={
                  <>
                    <Amount occ={occ} />
                    <span className="flex w-14 items-center justify-end gap-1 tabular-nums text-muted-foreground">
                      <IconCircleCheck className="size-3.5 text-[var(--success)]" />
                      {shortDate(occ.occurrence_date)}
                    </span>
                  </>
                }
              />
            ))}
          </ul>
        </>
      )}

      {data.incomeItems.length > 0 && (
        <>
          <div className="my-4 border-t border-border" />
          <SubHeading>Income this period</SubHeading>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {data.incomeItems.map((occ) => (
              <MoneyRow
                key={`${occ.item_id}-${occ.occurrence_date}`}
                left={<NameLink occ={occ} />}
                right={
                  <>
                    <Amount occ={occ} />
                    <span className="w-14 text-right tabular-nums text-muted-foreground">
                      {shortDate(occ.occurrence_date)}
                    </span>
                    {occ.fulfilled ? (
                      <Badge color="green" className="gap-1">
                        <IconCircleCheck className="size-3.5" />
                        Received
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markFulfilled(occ, true)}
                        disabled={createFulfillment.isPending}
                      >
                        <IconCheck className="size-4" />
                        Mark received
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}
