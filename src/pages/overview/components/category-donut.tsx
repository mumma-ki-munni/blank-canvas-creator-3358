import { useDataProvider } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { SectionCard } from "@/components/base/section-card";
import { useCurrency } from "@/lib/format";

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

/**
 * Spending breakdown — a horizontal category bar list. Replaces the old pie:
 * bars read faster and stay in the app's
 * green family so the card doesn't clash with the chart. Largest category first.
 */
export function CategoryDonut() {
  const { rangeStart: periodStart, rangeEnd: periodEnd } = useFilters();
  const { useCategoryDonut } = useDataProvider();
  const { data } = useCategoryDonut({ periodStart, periodEnd });
  const format = useCurrency();

  const total = data.reduce((sum, slice) => sum + slice.amount, 0);
  const max = data.reduce((m, slice) => Math.max(m, slice.amount), 0);

  return (
    <SectionCard>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Spending</h2>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {format(total)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">this period</p>

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No expenses this period.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {data.map((slice, index) => (
            <li key={slice.category} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-foreground">{slice.category}</span>
                <span className="flex items-baseline gap-2">
                  <span className="tabular-nums text-foreground">
                    {format(slice.amount)}
                  </span>
                  <span className="w-8 text-right tabular-nums text-xs text-muted-foreground">
                    {pct(slice.percentage)}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: max > 0 ? `${(slice.amount / max) * 100}%` : "0%",
                    // Largest = full-strength success; smaller categories fade back.
                    backgroundColor: `color-mix(in srgb, var(--success) ${Math.max(
                      100 - index * 18,
                      40,
                    )}%, transparent)`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
