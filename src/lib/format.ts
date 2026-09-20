import { useMemo } from "react";
import { format as formatDateFns, parseISO } from "date-fns";
import { useDataProvider } from "@/lib/data-provider";

/**
 * Single currency formatter bound to the active profile's currency.
 * `format(amount)` → whole dollars (Overview waterfall/bars).
 * `format(amount, { cents: true })` → cents (list rows + item detail — the row
 * is the record of truth for the item).
 */
export function useCurrency() {
  const { useProfile } = useDataProvider();
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? "USD";

  return useMemo(() => {
    const whole = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    const cents = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (amount: number, opts?: { cents?: boolean }) =>
      (opts?.cents ? cents : whole).format(amount);
  }, [currency]);
}

// ── Shared date formatters (ISO string in) ───────────────────────────────────
/** "MMM d" — e.g. Sep 9 */
export const shortDate = (iso: string) => formatDateFns(parseISO(iso), "MMM d");
/** "MMM d, yyyy" — e.g. Sep 9, 2025 */
export const longDate = (iso: string) => formatDateFns(parseISO(iso), "MMM d, yyyy");
/** "EEE, MMM d" — e.g. Mon, Sep 9 */
export const weekdayDate = (iso: string) => formatDateFns(parseISO(iso), "EEE, MMM d");
/** "EEE, MMM d, yyyy" — e.g. Mon, Sep 9, 2025 */
export const fullDate = (iso: string) => formatDateFns(parseISO(iso), "EEE, MMM d, yyyy");
