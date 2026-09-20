import { useMemo } from "react";
import { IconSearch, IconPlus, IconX } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ExpenseCategory, Frequency } from "@/lib/data-provider";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  frequencyFilter: Frequency[];
  onFrequencyFilterChange: (next: Frequency[]) => void;
  categoryFilter?: ExpenseCategory[];
  onCategoryFilterChange?: (next: ExpenseCategory[]) => void;
  visibleCount: number;
  totalCount: number;
  showCategoryFilter?: boolean;
}

const FREQUENCIES: Frequency[] = [
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Yearly",
  "One-time",
];

const CATEGORIES: ExpenseCategory[] = [
  "Housing",
  "Utilities",
  "Transport",
  "Health",
  "Subscriptions",
  "Insurance",
  "Groceries",
  "Other",
];

/**
 * Filter chip that opens a popover of checkboxes. Selected values render
 * a filled pill; the trailing X clears the whole facet inline.
 */
function FilterChip<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const active = selected.length > 0;
  const toggle = (opt: T) =>
    onChange(
      selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt],
    );

  return (
    <div className="inline-flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-transparent bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {!active && <IconPlus className="size-3.5" aria-hidden />}
            <span>
              {label}
              {active && ` · ${selected.length}`}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1">
          <ul className="flex flex-col">
            {options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => toggle(opt)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                      checked && "text-primary",
                    )}
                  >
                    <span>{opt}</span>
                    {checked && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
      {active && (
        <button
          type="button"
          onClick={() => onChange([])}
          aria-label={`Clear ${label} filter`}
          className="ml-1 inline-flex size-6 shrink-0 items-center justify-center self-center rounded-full leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <IconX className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function ItemsToolbar({
  search,
  onSearchChange,
  frequencyFilter,
  onFrequencyFilterChange,
  categoryFilter = [],
  onCategoryFilterChange,
  visibleCount,
  totalCount,
  showCategoryFilter = false,
}: Props) {
  const hasAnyFilter = useMemo(
    () =>
      search.length > 0 ||
      frequencyFilter.length > 0 ||
      categoryFilter.length > 0,
    [search, frequencyFilter, categoryFilter],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            aria-label="Search items by name"
            className="h-9 rounded-full pl-9"
          />
        </div>

        <FilterChip
          label="Frequency"
          options={FREQUENCIES}
          selected={frequencyFilter}
          onChange={onFrequencyFilterChange}
        />

        {showCategoryFilter && onCategoryFilterChange && (
          <FilterChip
            label="Category"
            options={CATEGORIES}
            selected={categoryFilter}
            onChange={onCategoryFilterChange}
          />
        )}

        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full text-xs"
            onClick={() => {
              onSearchChange("");
              onFrequencyFilterChange([]);
              onCategoryFilterChange?.([]);
            }}
          >
            Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted-foreground">
            {visibleCount} / {totalCount} items
          </span>
        </div>
      </div>
    </div>
  );
}
