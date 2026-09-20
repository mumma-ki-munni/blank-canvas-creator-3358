// Period math — pure, deterministic functions shared by both data providers.
//
// Occurrences are NOT stored in the database; they are computed here from an item's
// start_date + frequency. Period boundaries are derived from the user's pay_frequency
// + anchor_day. Storing this as pure functions keeps demo and real paths identical
// (plan D5, R2).

import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  getDay,
  getDaysInMonth,
  parseISO,
} from "date-fns";
import type {
  Frequency,
  Occurrence,
  PayFrequency,
  RecurringItem,
} from "@/data/seed";

export interface Period {
  /** ISO date (YYYY-MM-DD) of the period's first day. */
  start: string;
  /** ISO date (YYYY-MM-DD) of the period's last day (inclusive). */
  end: string;
}

const ISO = "yyyy-MM-dd";

/** Format a Date as an ISO date string (no time component). */
function toISO(d: Date): string {
  return format(d, ISO);
}

/** Parse an ISO date string to a Date at local midnight. */
function fromISO(s: string): Date {
  return parseISO(s);
}

/**
 * Shift a date off the weekend onto the following Monday.
 * Saturday (+2) and Sunday (+1); weekdays are unchanged.
 */
export function adjustWeekend(date: Date): Date {
  const day = getDay(date); // 0 = Sun, 6 = Sat
  if (day === 6) return addDays(date, 2);
  if (day === 0) return addDays(date, 1);
  return date;
}

/** Clamp a day-of-month to the number of days in the given month. */
function clampDayToMonth(year: number, monthIndex: number, day: number): Date {
  const first = new Date(year, monthIndex, 1);
  const maxDay = getDaysInMonth(first);
  return new Date(year, monthIndex, Math.min(day, maxDay));
}

/**
 * Return the pay period that contains `reference`, anchored by the profile's
 * pay_frequency + anchor_day.
 *
 * - Monthly:  [anchor_day of this/prev month, day before anchor_day next month]
 * - Weekly:   7-day window whose first day is anchor weekday (1=Mon..7=Sun)
 * - Biweekly: 14-day window aligned to anchor_day-of-month as the epoch
 */
export function getPeriodForDate(
  payFrequency: PayFrequency,
  anchorDay: number,
  reference: Date,
): Period {
  if (payFrequency === "Monthly") {
    const anchorThisMonth = clampDayToMonth(
      reference.getFullYear(),
      reference.getMonth(),
      anchorDay,
    );
    let start: Date;
    if (reference >= anchorThisMonth) {
      start = anchorThisMonth;
    } else {
      const prev = addMonths(reference, -1);
      start = clampDayToMonth(prev.getFullYear(), prev.getMonth(), anchorDay);
    }
    const end = addDays(addMonths(start, 1), -1);
    return { start: toISO(start), end: toISO(end) };
  }

  if (payFrequency === "Weekly") {
    // anchorDay: 1 = Monday .. 7 = Sunday. Map to JS getDay (0 = Sun).
    const anchorDow = anchorDay % 7; // 7 -> 0 (Sun), 1..6 stay
    let start = reference;
    // walk back to the most recent anchor weekday
    while (getDay(start) !== anchorDow) {
      start = addDays(start, -1);
    }
    const end = addDays(start, 6);
    return { start: toISO(start), end: toISO(end) };
  }

  // Biweekly — 14-day windows aligned to the anchor-day-of-month epoch.
  const epoch = clampDayToMonth(
    reference.getFullYear(),
    reference.getMonth(),
    anchorDay,
  );
  let start = epoch > reference ? addWeeks(epoch, -2) : epoch;
  // advance in 14-day steps until we straddle the reference
  while (addWeeks(start, 2) <= reference) {
    start = addWeeks(start, 2);
  }
  const end = addDays(addWeeks(start, 2), -1);
  return { start: toISO(start), end: toISO(end) };
}

/** The current pay period (relative to `today`, default: now). */
export function getCurrentPeriod(
  payFrequency: PayFrequency,
  anchorDay: number,
  today: Date = new Date(),
): Period {
  return getPeriodForDate(payFrequency, anchorDay, today);
}

/** The period immediately before/after the given one. */
export function shiftPeriod(
  period: Period,
  payFrequency: PayFrequency,
  anchorDay: number,
  direction: -1 | 1,
): Period {
  const start = fromISO(period.start);
  const step =
    direction === 1
      ? nextPeriodStart(start, payFrequency)
      : prevPeriodStart(start, payFrequency);
  return getPeriodForDate(payFrequency, anchorDay, step);
}

function nextPeriodStart(start: Date, freq: PayFrequency): Date {
  if (freq === "Monthly") return addDays(addMonths(start, 1), 0);
  if (freq === "Weekly") return addWeeks(start, 1);
  return addWeeks(start, 2);
}

function prevPeriodStart(start: Date, freq: PayFrequency): Date {
  if (freq === "Monthly") return addDays(addMonths(start, -1), 0);
  if (freq === "Weekly") return addWeeks(start, -1);
  return addWeeks(start, -2);
}

/** A human-readable label for a period, e.g. "Aug 25 – Sep 24". */
export function formatPeriodLabel(period: Period): string {
  return `${format(fromISO(period.start), "MMM d")} – ${format(
    fromISO(period.end),
    "MMM d",
  )}`;
}

/** Step a date forward by one interval of the given item frequency. */
function stepByFrequency(date: Date, frequency: Frequency): Date {
  switch (frequency) {
    case "Weekly":
      return addWeeks(date, 1);
    case "Biweekly":
      return addWeeks(date, 2);
    case "Monthly":
      return addMonths(date, 1);
    case "Quarterly":
      return addQuarters(date, 1);
    case "Yearly":
      return addYears(date, 1);
    case "One-time":
      return addYears(date, 1000);
    default:
      return addMonths(date, 1);
  }
}

/** Build an Occurrence for a scheduled (pre-adjustment) date. */
function buildOccurrence(item: RecurringItem, scheduled: Date): Occurrence {
  const adjusted = adjustWeekend(scheduled);
  const wasAdjusted = differenceInCalendarDays(adjusted, scheduled) !== 0;
  return {
    item_id: item.id,
    name: item.name,
    amount: item.amount,
    type: item.type,
    category: item.category,
    frequency: item.frequency,
    occurrence_date: toISO(adjusted),
    original_date: toISO(scheduled),
    adjusted: wasAdjusted,
    fulfilled: false,
    fulfillment_id: null,
  };
}

/**
 * All occurrences of `items` that fall within [periodStart, periodEnd] (inclusive),
 * respecting each item's start_date / end_date. Weekend dates shift to Monday.
 * Sorted by occurrence_date ascending.
 */
export function generateOccurrences(
  items: RecurringItem[],
  periodStart: string,
  periodEnd: string,
): Occurrence[] {
  const start = fromISO(periodStart);
  const end = fromISO(periodEnd);
  const out: Occurrence[] = [];

  for (const item of items) {
    const itemStart = fromISO(item.start_date);
    const itemEnd = item.end_date ? fromISO(item.end_date) : null;

    // A one-time item occurs exactly once, on its start date — never projected.
    if (item.frequency === "One-time") {
      if (itemStart >= start && itemStart <= end) {
        out.push(buildOccurrence(item, itemStart));
      }
      continue;
    }

    // Fast-forward to the first scheduled date on or after itemStart that could
    // land in/after the period, then walk until we pass the period end.
    let cursor = itemStart;
    // guard against pathological loops
    let guard = 0;
    while (cursor < start && guard < 10000) {
      cursor = stepByFrequency(cursor, item.frequency);
      guard += 1;
    }
    while (cursor <= end && guard < 10000) {
      if (cursor >= itemStart && (!itemEnd || cursor <= itemEnd)) {
        out.push(buildOccurrence(item, cursor));
      }
      cursor = stepByFrequency(cursor, item.frequency);
      guard += 1;
    }
  }

  out.sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
  return out;
}

/**
 * The next `count` occurrences of a single item on/after `from` (default: today).
 * Used by the item detail "Next 3 occurrences" section.
 */
export function getNextOccurrences(
  item: RecurringItem,
  count: number,
  from: Date = new Date(),
): Occurrence[] {
  const itemEnd = item.end_date ? fromISO(item.end_date) : null;
  let cursor = fromISO(item.start_date);
  const out: Occurrence[] = [];

  // A one-time item has at most one upcoming occurrence (its start date).
  if (item.frequency === "One-time") {
    return cursor >= from && (!itemEnd || cursor <= itemEnd)
      ? [buildOccurrence(item, cursor)]
      : [];
  }

  let guard = 0;
  while (out.length < count && guard < 10000) {
    if (cursor >= from && (!itemEnd || cursor <= itemEnd)) {
      out.push(buildOccurrence(item, cursor));
    }
    if (itemEnd && cursor > itemEnd) break;
    cursor = stepByFrequency(cursor, item.frequency);
    guard += 1;
  }
  return out;
}

/**
 * Contiguous list of periods from the period containing `from` up to and including
 * the period containing `to`. Used to build chart history in real (Supabase) mode.
 */
export function generatePeriodsInRange(
  from: Date,
  to: Date,
  payFrequency: PayFrequency,
  anchorDay: number,
): Period[] {
  const periods: Period[] = [];
  let current = getPeriodForDate(payFrequency, anchorDay, from);
  let guard = 0;
  while (fromISO(current.start) <= to && guard < 1000) {
    periods.push(current);
    current = shiftPeriod(current, payFrequency, anchorDay, 1);
    guard += 1;
  }
  return periods;
}

/**
 * The equal-length window immediately before `range`. Used as the comparison
 * baseline for the Overview delta — a 3-month range compares against the prior
 * 3 months, not against a single pay period.
 */
export function previousRange(range: Period): Period {
  const start = fromISO(range.start);
  const end = fromISO(range.end);
  const days = differenceInCalendarDays(end, start) + 1;
  return {
    start: toISO(addDays(start, -days)),
    end: toISO(addDays(start, -1)),
  };
}

/** Every day (inclusive) between two ISO dates, as ISO date strings. */
export function eachDayISO(startISO: string, endISO: string): string[] {
  const start = fromISO(startISO);
  const end = fromISO(endISO);
  const total = differenceInCalendarDays(end, start);
  if (total < 0) return [];
  const out: string[] = [];
  for (let i = 0; i <= Math.min(total, 2000); i += 1) {
    out.push(toISO(addDays(start, i)));
  }
  return out;
}

export type IntervalKey = "1M" | "3M" | "6M" | "1Y" | "ALL";

/** Number of periods each interval key shows (ALL is unbounded → null). */
export function intervalPeriodCount(key: IntervalKey): number | null {
  switch (key) {
    case "1M":
      return 1;
    case "3M":
      return 3;
    case "6M":
      return 6;
    case "1Y":
      return 12;
    case "ALL":
      return null;
  }
}
