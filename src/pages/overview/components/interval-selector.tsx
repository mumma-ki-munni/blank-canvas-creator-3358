import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFilters } from "@/lib/filter-context";
import type { IntervalKey } from "@/lib/periods";

const OPTIONS: IntervalKey[] = ["1M", "3M", "6M", "1Y", "ALL"];

/**
 * Chart time-range selector. Controls the chart only — does NOT change the
 * active period waterfall (plan D8). Selection persists via FilterContext.
 */
export function IntervalSelector() {
  const { intervalKey, setIntervalKey } = useFilters();

  return (
    <ToggleGroup
      type="single"
      value={intervalKey}
      onValueChange={(value) => {
        if (value) setIntervalKey(value as IntervalKey);
      }}
      className="justify-start"
    >
      {OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={`Show ${option}`}
          className="px-3 text-xs tabular-nums"
        >
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
