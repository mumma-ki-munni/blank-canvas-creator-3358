import { useMemo, useState } from "react";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type {
  ExpenseCategory,
  Frequency,
  RecurringItem,
} from "@/lib/data-provider";
import { useDataProvider } from "@/lib/data-provider";
import { AppShell } from "@/pages/overview/components/app-shell";
import { PageHeader } from "@/components/base/page";
import { AddItemDialog } from "@/pages/overview/components/add-item-dialog";
import { ItemsTable } from "./components/items-table";
import { ItemsToolbar } from "./components/items-toolbar";
import { ExpensesBlankslate } from "./components/expenses-blankslate";
import { CsvImportDialog } from "@/components/csv-import-dialog";

// Most-frequent first — matches how people mentally sort recurring costs (screenboard).
const FREQUENCY_ORDER: Frequency[] = [
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Yearly",
  "One-time",
];

function groupByFrequency(
  items: RecurringItem[],
): { frequency: Frequency; items: RecurringItem[] }[] {
  return FREQUENCY_ORDER.map((frequency) => ({
    frequency,
    items: items
      .filter((item) => item.frequency === frequency)
      .sort((a, b) => b.amount - a.amount),
  })).filter((group) => group.items.length > 0);
}

export default function Page() {
  const { useRecurringItems } = useDataProvider();
  const { data: items, isLoading } = useRecurringItems({ type: "expense" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState<Frequency[]>([]);
  const [catFilter, setCatFilter] = useState<ExpenseCategory[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q)) return false;
      if (freqFilter.length > 0 && !freqFilter.includes(item.frequency))
        return false;
      if (
        catFilter.length > 0 &&
        (!item.category || !catFilter.includes(item.category))
      )
        return false;
      return true;
    });
  }, [items, search, freqFilter, catFilter]);

  const groups = useMemo(() => groupByFrequency(filtered), [filtered]);
  const hasItems = items.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <PageHeader
          title="Expenses"
          width="wide"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <IconUpload className="size-4" />
                Import CSV
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <IconPlus className="size-4" />
                Add expense
              </Button>
            </div>
          }
        />
        <div className="mx-auto flex w-full max-w-[1302px] flex-col gap-6 px-6 pb-16 pt-6">
          {isLoading ? (
            <ExpensesSkeleton />
          ) : (
            <>
              {/* Empty is not a mode (docs/design/empty-state.md): the toolbar
                  and its count stay ("0 / 0 items"), and the empty state sits
                  where the rows would — the same screen with zero items. */}
              <ItemsToolbar
                search={search}
                onSearchChange={setSearch}
                frequencyFilter={freqFilter}
                onFrequencyFilterChange={setFreqFilter}
                categoryFilter={catFilter}
                onCategoryFilterChange={setCatFilter}
                showCategoryFilter
                visibleCount={filtered.length}
                totalCount={items.length}
              />

              {!hasItems ? (
                <ExpensesBlankslate onAddExpense={() => setDialogOpen(true)} />
              ) : !hasResults ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No expenses match these filters.
                </p>
              ) : (
                <ItemsTable
                  sections={groups.map((group) => ({
                    label: group.frequency,
                    items: group.items,
                  }))}
                />
              )}
            </>
          )}
        </div>
      </div>

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type="expense"
      />

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} type="expense" />
    </AppShell>
  );
}

function ExpensesSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <div className="h-4 w-20 rounded bg-muted" />
      <div className="divide-y divide-border overflow-hidden rounded-lg border-solid">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3 px-4 py-3">
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
