import { useMemo } from "react";
import { IconCircleCheck } from "@tabler/icons-react";
import { SectionCard } from "@/components/base/section-card";
import { MoneyRow } from "@/components/base/money-row";
import { useCurrency, fullDate } from "@/lib/format";
import { useDataProvider } from "@/lib/data-provider";
import type { RecurringItem } from "@/lib/data-provider";

/**
 * The last 6 fulfillments for this item, most recent first. Renders an empty
 * state when the item has never been fulfilled.
 */
export function RecentFulfillments({ item }: { item: RecurringItem }) {
  const { useAllFulfillments } = useDataProvider();
  const { data: fulfillments } = useAllFulfillments();
  const currency = useCurrency();

  const recent = useMemo(
    () =>
      fulfillments
        .filter((f) => f.recurring_item_id === item.id)
        .slice()
        .sort((a, b) => b.occurrence_date.localeCompare(a.occurrence_date))
        .slice(0, 6),
    [fulfillments, item.id],
  );

  return (
    <SectionCard className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-foreground">
        Recent fulfillments
      </h2>
      {recent.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No fulfillments yet.
        </p>
      ) : (
        <ul className="-mt-1 divide-y divide-border">
          {recent.map((f) => (
            <MoneyRow
              key={f.id}
              left={
                <span className="inline-flex items-center gap-2 tabular-nums text-foreground">
                  <IconCircleCheck
                    className="size-3.5 text-[var(--success)]"
                    aria-hidden
                  />
                  {fullDate(f.occurrence_date)}
                </span>
              }
              right={
                <span className="tabular-nums text-muted-foreground">
                  {currency(item.amount, { cents: true })}
                </span>
              }
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
