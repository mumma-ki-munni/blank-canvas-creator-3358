// Demo seed data — used ONLY on `/demo/*` routes via SeedDataProvider.
// Not seeded into real user accounts (real users start with an empty workspace).
//
// Raw arrays with date fields so the SeedDataProvider can filter them exactly the
// way SupabaseDataProvider filters the database. Interfaces mirror the table schemas
// in docs/plans/00-cloudboard.md.

// ── Enums / unions (mirror table CHECK constraints) ──────────────────────────

export type ItemType = "expense" | "income";

export type ExpenseCategory =
  | "Housing"
  | "Utilities"
  | "Transport"
  | "Health"
  | "Subscriptions"
  | "Insurance"
  | "Groceries"
  | "Other";

export type Frequency =
  | "Weekly"
  | "Biweekly"
  | "Monthly"
  | "Quarterly"
  | "Yearly"
  | "One-time";

export type PayFrequency = "Weekly" | "Biweekly" | "Monthly";

// ── Table row interfaces ─────────────────────────────────────────────────────

/** `public.profiles` */
export interface Profile {
  id: string;
  currency: string;
  pay_frequency: PayFrequency;
  anchor_day: number;
  dark_mode: boolean;
  ftux_completed: boolean;
  /** Names the account, and makes the avatar's monogram. */
  full_name: string | null;
  /** Top rung of the avatar ladder. Null means fall to the monogram. */
  avatar_url: string | null;
}

/** `public.recurring_items` */
export interface RecurringItem {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: ItemType;
  /** null for income items (CHECK: category only set for expenses) */
  category: ExpenseCategory | null;
  frequency: Frequency;
  /** ISO date (YYYY-MM-DD) */
  start_date: string;
  /** ISO date (YYYY-MM-DD) or null when the item has no end date */
  end_date: string | null;
  created_at: string;
}

/** `public.fulfillments` */
export interface Fulfillment {
  id: string;
  user_id: string;
  recurring_item_id: string;
  /** ISO date of the period boundary this fulfillment belongs to */
  period_start: string;
  /** ISO date of the specific occurrence being fulfilled */
  occurrence_date: string;
  /** ISO timestamp */
  fulfilled_at: string;
}

/** One day in the full-bleed chart series (computed by the DataProvider). */
export interface ChartPoint {
  /** ISO date (YYYY-MM-DD) of this day. */
  date: string;
  /** Income scheduled on this day. */
  income: number;
  /** Expenses scheduled on this day. */
  expenses: number;
  /** income − expenses for this day alone. */
  disposable: number;
  /** Running disposable from the start of the selected range through this day. */
  cumulative: number;
}

// ── Derived shapes (computed by the DataProvider, not stored) ────────────────

/** A single computed occurrence of a recurring item within a period. */
export interface Occurrence {
  item_id: string;
  name: string;
  amount: number;
  type: ItemType;
  category: ExpenseCategory | null;
  frequency: Frequency;
  /** The scheduled (weekend-adjusted) date used for matching + display. */
  occurrence_date: string;
  /** The pre-adjustment date (differs from occurrence_date when shifted off a weekend). */
  original_date: string;
  /** True when the scheduled date landed on a weekend and was shifted to Monday. */
  adjusted: boolean;
  /** True when a matching fulfillment record exists for this occurrence. */
  fulfilled: boolean;
  /** The fulfillment id when fulfilled, else null. */
  fulfillment_id: string | null;
}

/** The composite payload behind the Overview waterfall + lists. */
export interface OverviewData {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalFulfilled: number;
  totalToPay: number;
  disposable: number;
  /** Disposable this period minus disposable last period. */
  delta: number;
  toPayItems: Occurrence[];
  fulfilledItems: Occurrence[];
  incomeItems: Occurrence[];
}

/** One slice of the category donut. */
export interface CategorySlice {
  category: string;
  amount: number;
  /** 0..1 */
  percentage: number;
}


// ── Seed rows ────────────────────────────────────────────────────────────────
//
// Every date below is worked out from today, never written down. A demo whose
// newest entry is dated last year looks abandoned, and a budget is about what is
// coming up — so the dates have to move with the calendar. See the demo-and-seed
// house rule, rule 13.

const DEMO_USER = "demo-user";

/** Today, at midnight, in the visitor's own timezone. */
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** `YYYY-MM-DD` for a date, read in local time — `toISOString` would use UTC and can slip a day. */
function isoDate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** The `day`th of the month, `months` months back from this one. */
function monthsAgo(months: number, day: number): string {
  const d = today();
  d.setDate(1);
  d.setMonth(d.getMonth() - months);
  const lastDayOfThatMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDayOfThatMonth));
  return isoDate(d);
}

function daysAgo(days: number): string {
  const d = today();
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

/** An ISO timestamp `days` ago — for `created_at`, which is a moment, not a date. */
function createdDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const profile: Profile = {
  id: DEMO_USER,
  currency: "USD",
  pay_frequency: "Monthly",
  anchor_day: 25,
  dark_mode: false,
  ftux_completed: true,
  full_name: "Marta Ruiz",
  avatar_url: null,
};

/**
 * The bills and the pay.
 *
 * Between them these cover every frequency the app can draw (weekly through
 * one-time) and every category, because a demo that only shows monthly expenses
 * in three categories is showing a fraction of the product. Rule 14.
 *
 * The amounts are deliberately uneven — no two the same, no neat run — because
 * a tidy sequence reads as a fixture.
 */
export const recurringItems: RecurringItem[] = [
  // ── Expenses ──────────────────────────────────────────────────────────────
  { id: "1",  user_id: DEMO_USER, name: "Rent",              amount: 1450, type: "expense", category: "Housing",       frequency: "Monthly",   start_date: monthsAgo(14, 1),  end_date: null, created_at: createdDaysAgo(420) },
  { id: "2",  user_id: DEMO_USER, name: "Electricity",       amount: 62,   type: "expense", category: "Utilities",     frequency: "Monthly",   start_date: monthsAgo(14, 17), end_date: null, created_at: createdDaysAgo(419) },
  { id: "3",  user_id: DEMO_USER, name: "Internet",          amount: 45,   type: "expense", category: "Utilities",     frequency: "Monthly",   start_date: monthsAgo(14, 20), end_date: null, created_at: createdDaysAgo(418) },
  { id: "4",  user_id: DEMO_USER, name: "Spotify",           amount: 12,   type: "expense", category: "Subscriptions", frequency: "Monthly",   start_date: monthsAgo(13, 27), end_date: null, created_at: createdDaysAgo(400) },
  { id: "5",  user_id: DEMO_USER, name: "Gym",               amount: 35,   type: "expense", category: "Health",        frequency: "Monthly",   start_date: monthsAgo(11, 9),  end_date: null, created_at: createdDaysAgo(340) },
  { id: "6",  user_id: DEMO_USER, name: "Phone",             amount: 30,   type: "expense", category: "Utilities",     frequency: "Monthly",   start_date: monthsAgo(14, 28), end_date: null, created_at: createdDaysAgo(417) },
  { id: "7",  user_id: DEMO_USER, name: "Train pass",        amount: 78,   type: "expense", category: "Transport",     frequency: "Monthly",   start_date: monthsAgo(9, 3),   end_date: null, created_at: createdDaysAgo(280) },
  { id: "8",  user_id: DEMO_USER, name: "Weekly shop",       amount: 96,   type: "expense", category: "Groceries",     frequency: "Weekly",    start_date: monthsAgo(8, 6),   end_date: null, created_at: createdDaysAgo(250) },
  { id: "9",  user_id: DEMO_USER, name: "Cleaner",           amount: 55,   type: "expense", category: "Other",         frequency: "Biweekly",  start_date: monthsAgo(6, 12),  end_date: null, created_at: createdDaysAgo(190) },
  { id: "10", user_id: DEMO_USER, name: "Car insurance",     amount: 240,  type: "expense", category: "Insurance",     frequency: "Quarterly", start_date: monthsAgo(12, 1),  end_date: null, created_at: createdDaysAgo(365) },
  { id: "11", user_id: DEMO_USER, name: "Contents cover",    amount: 186,  type: "expense", category: "Insurance",     frequency: "Yearly",    start_date: monthsAgo(11, 14), end_date: null, created_at: createdDaysAgo(350) },
  // A one-off, this period. It is what makes this period cost more than the last
  // one, so the headline renders a fall as well as a rise — rule 14 again.
  { id: "12", user_id: DEMO_USER, name: "Boiler repair",     amount: 890,  type: "expense", category: "Housing",       frequency: "One-time",  start_date: daysAgo(4),        end_date: null, created_at: createdDaysAgo(4) },

  // ── Income ────────────────────────────────────────────────────────────────
  { id: "13", user_id: DEMO_USER, name: "Salary",            amount: 3100, type: "income",  category: null,            frequency: "Monthly",   start_date: monthsAgo(14, 25), end_date: null, created_at: createdDaysAgo(421) },
  { id: "14", user_id: DEMO_USER, name: "Freelance — Ives",  amount: 640,  type: "income",  category: null,            frequency: "Quarterly", start_date: monthsAgo(9, 6),   end_date: null, created_at: createdDaysAgo(275) },
];

/**
 * Which bills have already been paid in the period the visitor lands on.
 *
 * Item ids, not dates. The dates are worked out at runtime from these items'
 * own recurrence, so "already paid" stays true whatever day the demo is opened
 * — including the weekend-shifting the app does. See `seedFulfillments` in
 * `src/lib/data-provider.tsx`.
 */
export const paidThisPeriod: string[] = ["4", "6", "3", "8", "13"];
