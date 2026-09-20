import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  formatPeriodLabel,
  getCurrentPeriod,
  intervalPeriodCount,
  shiftPeriod,
  type IntervalKey,
  type Period,
} from "@/lib/periods";
import type { PayFrequency } from "@/data/seed";

// Shared Overview filter state (see docs/design/filters.md — quarter/cycle selector).
// Two independent controls (plan D8):
//   • the active pay period (period arrows) → drives the waterfall + lists
//   • the chart interval key                → drives chart zoom only
// Both live here so every Overview component reads the same values.

interface PayConfig {
  payFrequency: PayFrequency;
  anchorDay: number;
}

interface FilterContextValue {
  periodStart: string;
  periodEnd: string;
  /** Start of the selected interval range (N periods back, ending at the active period). */
  rangeStart: string;
  rangeEnd: string;
  rangeLabel: string;
  intervalKey: IntervalKey;
  setIntervalKey: (key: IntervalKey) => void;
  /** Recompute periods once the real profile's pay cycle is known. */
  setPayConfig: (config: PayConfig) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const INTERVAL_PARAM = "range";
const DEFAULT_INTERVAL: IntervalKey = "3M";

/**
 * The chart range lives in the address bar, as `?range=6M`.
 *
 * It used to live in this browser's local storage, which meant the range you
 * were looking at could not be reloaded back into, linked to, or sent to
 * anyone — and the next person to open the app on this machine inherited your
 * choice. What you explored should be what you would share.
 */
/**
 * The range, written out for a person.
 *
 * The year goes on both ends when the range crosses one. It used to go only on
 * the end, so a year-long range read "Sep 25 – Sep 24, 2025" — which looks like
 * it runs backwards, and made a working chart look broken.
 */
function formatRangeLabel(range: Period): string {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  return start.getFullYear() === end.getFullYear()
    ? `${formatPeriodLabel(range)}, ${format(end, "yyyy")}`
    : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

function isIntervalKey(value: string | null): value is IntervalKey {
  return (
    value === "1M" ||
    value === "3M" ||
    value === "6M" ||
    value === "1Y" ||
    value === "ALL"
  );
}

interface FilterProviderProps {
  children: ReactNode;
  /** ISO date the "current period" is anchored to. Demo passes the seed reference; real mode omits (uses now). */
  initialReferenceDate?: string;
  payFrequency?: PayFrequency;
  anchorDay?: number;
}

export function FilterProvider({
  children,
  initialReferenceDate,
  payFrequency = "Monthly",
  anchorDay = 25,
}: FilterProviderProps) {
  const reference = useMemo(
    () => (initialReferenceDate ? parseISO(initialReferenceDate) : new Date()),
    [initialReferenceDate],
  );

  const [payConfig, setPayConfigState] = useState<PayConfig>({
    payFrequency,
    anchorDay,
  });

  const [period, setPeriod] = useState<Period>(() =>
    getCurrentPeriod(payFrequency, anchorDay, reference),
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get(INTERVAL_PARAM);
  const intervalKey: IntervalKey = isIntervalKey(fromUrl)
    ? fromUrl
    : DEFAULT_INTERVAL;

  const setIntervalKey = useCallback(
    (key: IntervalKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          // The default stays out of the URL, so a plain /demo/overview link is
          // the plain default rather than one carrying invisible baggage.
          if (key === DEFAULT_INTERVAL) next.delete(INTERVAL_PARAM);
          else next.set(INTERVAL_PARAM, key);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPayConfig = useCallback(
    (config: PayConfig) => {
      setPayConfigState(config);
      setPeriod(getCurrentPeriod(config.payFrequency, config.anchorDay, reference));
    },
    [reference],
  );

  // The interval selector (1M/3M/6M/1Y/ALL) widens the *whole* screen's window:
  // numbers, date labels and chart all read the same range.
  const range = useMemo<Period>(() => {
    const count = intervalPeriodCount(intervalKey) ?? 12;
    let first = period;
    for (let i = 1; i < count; i += 1) {
      first = shiftPeriod(
        first,
        payConfig.payFrequency,
        payConfig.anchorDay,
        -1,
      );
    }
    return { start: first.start, end: period.end };
  }, [period, intervalKey, payConfig]);

  const value = useMemo<FilterContextValue>(
    () => ({
      periodStart: period.start,
      periodEnd: period.end,
      rangeStart: range.start,
      rangeEnd: range.end,
      rangeLabel: formatRangeLabel(range),
      intervalKey,
      setIntervalKey,
      setPayConfig,
    }),
    [period, range, intervalKey, setIntervalKey, setPayConfig],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
