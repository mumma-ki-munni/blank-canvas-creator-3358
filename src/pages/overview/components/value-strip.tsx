import { useDataProvider } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { useCurrency } from "@/lib/format";

interface Tile {
  label: string;
  value: number;
}

/** Four stat tiles: Income · Fulfilled · To pay · Disposable. */
export function ValueStrip() {
  const { rangeStart: periodStart, rangeEnd: periodEnd } = useFilters();
  const { useOverviewData } = useDataProvider();
  const { data } = useOverviewData({ periodStart, periodEnd });
  const format = useCurrency();

  // Income · Fulfilled · To pay as a light, borderless inline row (the hero
  // number above already carries Disposable).
  const tiles: Tile[] = [
    { label: "Income", value: data.totalIncome },
    { label: "Fulfilled", value: data.totalFulfilled },
    { label: "To pay", value: data.totalToPay },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">{tile.label}</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {format(tile.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
