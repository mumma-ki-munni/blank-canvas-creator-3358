// Generic CSV import core — adapted from atlas-classic's use-csv-handler /
// transform-data pattern (PapaParse + header auto-map + typed, validated build).
// Reusable for any RecurringItem screen; the screen supplies `type` + its fields.
import Papa from "papaparse";
import type {
  CreateItemInput,
  ExpenseCategory,
  Frequency,
  ItemType,
} from "@/lib/data-provider";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Housing",
  "Utilities",
  "Transport",
  "Health",
  "Subscriptions",
  "Insurance",
  "Groceries",
  "Other",
];

export const FREQUENCIES: Frequency[] = [
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Yearly",
  "One-time",
];

export interface CsvField {
  key: keyof CreateItemInput;
  label: string;
  required?: boolean;
}

// Fields the importer maps by header. `type` is supplied by the screen (fixed),
// and `category` only applies to expenses — income rows get category: null.
export const BASE_FIELDS: CsvField[] = [
  { key: "name", label: "Name", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "frequency", label: "Frequency" },
  { key: "start_date", label: "Start date", required: true },
  { key: "end_date", label: "End date" },
];

export const EXPENSE_FIELDS: CsvField[] = [
  { key: "name", label: "Name", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "category", label: "Category" },
  { key: "frequency", label: "Frequency" },
  { key: "start_date", label: "Start date", required: true },
  { key: "end_date", label: "End date" },
];

export function fieldsForType(type: ItemType): CsvField[] {
  return type === "expense" ? EXPENSE_FIELDS : BASE_FIELDS;
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => (typeof v === "string" ? v.trim() : v),
      complete: (res) =>
        resolve({
          headers: (res.meta.fields ?? []).map((h) => h.trim()),
          rows: res.data,
        }),
      error: reject,
    });
  });
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Auto-map each field to a CSV header by normalized name (exact, then contains).
export function autoMap(
  headers: string[],
  fields: CsvField[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    const target = norm(f.key);
    const exact = headers.find((h) => norm(h) === target);
    const partial = headers.find(
      (h) => norm(h).includes(target) || target.includes(norm(h)),
    );
    const hit = exact ?? partial;
    if (hit) map[f.key] = hit;
  }
  return map;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const negative = /^\(.*\)$/.test(raw.trim());
  const n = parseFloat(raw.replace(/[()]/g, "").replace(/[^0-9.-]/g, ""));
  if (!isFinite(n)) return null;
  return negative ? -n : n;
}

function isValidDate(raw: string): boolean {
  if (!raw) return false;
  return /^\d{4}-\d{2}-\d{2}/.test(raw) || !Number.isNaN(Date.parse(raw));
}

function toIso(raw: string): string {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

export interface SkippedRow {
  row: number;
  reason: string;
}
export interface BuildResult {
  valid: CreateItemInput[];
  skipped: SkippedRow[];
}

// Apply the mapping + fixed `type` to each row, validating and casting.
// Bad category -> "Other", bad/absent frequency -> "Monthly". Rows missing a
// name, a valid positive amount, or a valid start date are skipped with a reason.
export function buildRecords(
  parsed: ParsedCsv,
  mapping: Record<string, string>,
  opts: { type: ItemType },
): BuildResult {
  const valid: CreateItemInput[] = [];
  const skipped: SkippedRow[] = [];

  parsed.rows.forEach((row, i) => {
    const rowNo = i + 1;
    const get = (k: string) =>
      mapping[k] ? (row[mapping[k]] ?? "").trim() : "";

    const name = get("name");
    const amount = parseAmount(get("amount"));
    const startRaw = get("start_date");

    if (!name) {
      skipped.push({ row: rowNo, reason: "missing name" });
      return;
    }
    if (amount === null || amount <= 0) {
      skipped.push({ row: rowNo, reason: `invalid amount "${get("amount")}"` });
      return;
    }
    if (!startRaw || !isValidDate(startRaw)) {
      skipped.push({ row: rowNo, reason: `invalid start date "${startRaw}"` });
      return;
    }

    const freqRaw = get("frequency");
    const frequency: Frequency = (FREQUENCIES as string[]).includes(freqRaw)
      ? (freqRaw as Frequency)
      : "Monthly";

    let category: ExpenseCategory | null = null;
    if (opts.type === "expense") {
      const c = get("category");
      category = (EXPENSE_CATEGORIES as string[]).includes(c)
        ? (c as ExpenseCategory)
        : "Other";
    }

    const endRaw = get("end_date");
    valid.push({
      name,
      amount,
      type: opts.type,
      category,
      frequency,
      start_date: toIso(startRaw),
      end_date: endRaw && isValidDate(endRaw) ? toIso(endRaw) : null,
    });
  });

  return { valid, skipped };
}

// A realistic month for an average earner: fixed costs across most categories,
// one quarterly and one yearly bill, and a One-time purchase — so the sample
// exercises every frequency the app supports (and the donut has real variety).
export const SAMPLE_CSV: Record<ItemType, string> = {
  expense:
    "name,amount,category,frequency,start_date,end_date\n" +
    "Rent,1350,Housing,Monthly,2026-01-01,\n" +
    "Groceries,380,Groceries,Monthly,2026-01-01,\n" +
    "Health insurance,140,Insurance,Monthly,2026-01-01,\n" +
    "Internet,55,Utilities,Monthly,2026-01-18,\n" +
    "Mobile plan,30,Utilities,Monthly,2026-01-22,\n" +
    "Gym,35,Health,Monthly,2026-01-10,\n" +
    "Netflix,15.99,Subscriptions,Monthly,2026-01-15,\n" +
    "Car insurance,240,Insurance,Quarterly,2026-01-01,\n" +
    "Annual cloud plan,79,Subscriptions,Yearly,2026-03-01,\n" +
    "New laptop,1200,Other,One-time,2026-02-15,\n",
  income:
    "name,amount,frequency,start_date,end_date\n" +
    "Salary,4000,Monthly,2026-01-25,\n" +
    "Side projects,900,Quarterly,2026-01-15,\n",
};
