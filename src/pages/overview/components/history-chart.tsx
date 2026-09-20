import { useId, useMemo } from "react";
import { format as formatDate, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDataProvider } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { useCurrency } from "@/lib/format";

interface Point {
  date: string;
  income: number;
  expenses: number;
  disposable: number;
  cumulative: number;
}

/**
 * Fit the Y domain to the *visible* disposable range. Tight padding so a
 * gently-varying line fills the height
 * instead of hugging an edge; a min span keeps a flat series from collapsing to
 * a single line. When values cross zero the domain includes 0 so the green/red
 * split lands in the right place.
 */
function fitDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const magnitude = Math.max(Math.abs(min), Math.abs(max), 1);
  const span = Math.max(range, magnitude * 0.12); // min visible span
  const lowerPad = span * 0.15;
  const upperPad = span * 0.08;
  let lower = min - lowerPad;
  let upper = max + upperPad;
  // Keep zero inside the domain only when the series actually crosses it.
  if (min < 0 && max > 0) {
    lower = Math.min(lower, 0);
    upper = Math.max(upper, 0);
  }
  return [lower, upper];
}

function ChartTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  format: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const positive = p.cumulative >= 0;
  return (
    <div
      className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"
      style={{ pointerEvents: "none" }}
    >
      <p className="font-medium text-foreground">
        {formatDate(parseISO(p.date), "MMMM d, yyyy")}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-0.5 w-3 rounded"
            style={{ backgroundColor: positive ? "var(--success)" : "var(--destructive)" }}
          />
          Running disposable
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {format(p.cumulative)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-6 text-muted-foreground">
        <span>Income this day</span>
        <span className="tabular-nums">{format(p.income)}</span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-6 text-muted-foreground">
        <span>Expenses this day</span>
        <span className="tabular-nums">{format(p.expenses)}</span>
      </div>
    </div>
  );
}

/**
 * Full-bleed disposable-over-time area chart. One primary series —
 * disposable per pay period —
 * with a fitted Y scale, a fill gradient that fades into the Zone 2 background,
 * and a stroke that turns red below zero. No axes, no grid: pure shape.
 */
export function HistoryChart() {
  const { rangeStart, rangeEnd } = useFilters();
  const { useChartHistory } = useDataProvider();
  const { data: raw } = useChartHistory({
    startDate: rangeStart,
    endDate: rangeEnd,
  });
  const format = useCurrency();
  const id = useId().replace(/:/g, "");
  const fillId = `disp-fill-${id}`;
  const strokeId = `disp-stroke-${id}`;

  const data = raw as Point[];

  const { domain, allPositive, allNegative, zeroPercent } = useMemo(() => {
    const values = data.map((d) => d.cumulative);
    const [lower, upper] = fitDomain(values);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    // Offset (from top) of the y=0 line within the domain, for the gradient split.
    const offset = upper === lower ? 1 : upper / (upper - lower);
    return {
      domain: [lower, upper] as [number, number],
      allPositive: min >= 0,
      allNegative: max <= 0,
      zeroPercent: `${(Math.min(Math.max(offset, 0), 1) * 100).toFixed(1)}%`,
    };
  }, [data]);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            {/* Fill stops kept subtle; the Zone 2 background gradient supplies
                the green mass. */}
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              {allNegative ? (
                <>
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.2} />
                  <stop offset="70%" stopColor="var(--destructive)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.06} />
                </>
              ) : allPositive ? (
                <>
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                  <stop offset="70%" stopColor="var(--success)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0.06} />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.2} />
                  <stop offset={zeroPercent} stopColor="var(--success)" stopOpacity={0.05} />
                  <stop offset={zeroPercent} stopColor="var(--destructive)" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.06} />
                </>
              )}

            </linearGradient>
            <linearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
              {allNegative ? (
                <stop offset="0%" stopColor="var(--destructive)" />
              ) : allPositive ? (
                <stop offset="0%" stopColor="var(--success)" />
              ) : (
                <>
                  <stop offset="0%" stopColor="var(--success)" />
                  <stop offset={zeroPercent} stopColor="var(--success)" />
                  <stop offset={zeroPercent} stopColor="var(--destructive)" />
                  <stop offset="100%" stopColor="var(--destructive)" />
                </>
              )}
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={domain} />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={<ChartTooltip format={format} />}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            baseValue={domain[0]}
            stroke={`url(#${strokeId})`}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
