import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { useDataProvider } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { formatPeriodLabel, previousRange } from "@/lib/periods";
import { useCurrency } from "@/lib/format";

/**
 * Large disposable number + a rich sub-row: absolute delta · percent delta ·
 * "vs {previous period label}". Colored by direction with a matching arrow icon.
 * Percent is guarded when the prior disposable is zero.
 */
export function DisposableHero() {
  const { rangeStart: periodStart, rangeEnd: periodEnd } = useFilters();
  const { useOverviewData } = useDataProvider();
  const { data } = useOverviewData({ periodStart, periodEnd });
  const format = useCurrency();

  // Compare against the previous equal-length range, not a single pay period.
  const prevLabel = formatPeriodLabel(
    previousRange({ start: periodStart, end: periodEnd }),
  );

  const delta = data.delta;
  const prevDisposable = data.disposable - delta;
  const hasDelta = delta !== 0;
  const positive = delta > 0;
  const pct =
    prevDisposable !== 0
      ? Math.round((delta / Math.abs(prevDisposable)) * 1000) / 10
      : null;

  const Arrow = positive ? IconTrendingUp : IconTrendingDown;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Disposable
      </p>
      <p className="font-heading text-5xl font-semibold tracking-tight tabular-nums text-foreground md:text-6xl">
        {format(data.disposable)}
      </p>
      {hasDelta ? (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
          style={{ color: positive ? "var(--success)" : "var(--destructive)" }}
        >
          <span className="inline-flex items-center gap-1 font-medium tabular-nums">
            <Arrow className="size-4" aria-hidden />
            {positive ? "+" : "−"}
            {format(Math.abs(delta))}
          </span>
          {pct !== null && (
            <span className="font-medium tabular-nums">
              {positive ? "+" : ""}
              {pct}%
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            vs {prevLabel}
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          — vs {prevLabel}
        </p>
      )}
    </div>
  );
}
