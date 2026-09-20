import { useState } from "react";
import type { ItemType } from "@/lib/data-provider";
import { useDataProvider } from "@/lib/data-provider";
import { useFilters } from "@/lib/filter-context";
import { AppShell } from "./components/app-shell";
import { DisposableHero } from "./components/disposable-hero";
import { ValueStrip } from "./components/value-strip";
import { HistoryChart } from "./components/history-chart";
import { IntervalSelector } from "./components/interval-selector";
import { ToPayList } from "./components/to-pay-list";
import { CategoryDonut } from "./components/category-donut";
import { AddItemDialog } from "./components/add-item-dialog";
import { Blankslate } from "./blankslate";

/** Zone 2 wash — one uniform tint across chart + content at the same 6% the chart
 *  fill bottoms out at, so the whole lower area reads as one surface with no seam. */
function gradientStyle(positive: boolean): React.CSSProperties {
  const token = positive ? "var(--success)" : "var(--destructive)";
  return {
    backgroundColor: `color-mix(in srgb, ${token} 6%, transparent)`,
  };
}

/**
 * Overview content (no app shell). Rendered inside AppShell by the page, and also
 * standalone in the landing hero preview — so the landing shows the REAL current
 * screen on seed data, never a hand-drawn mock that drifts out of sync.
 */
export function OverviewContent() {
  const { rangeStart: periodStart, rangeEnd: periodEnd, rangeLabel } = useFilters();
  const { useOverviewData } = useDataProvider();
  const { data } = useOverviewData({ periodStart, periodEnd });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<ItemType>("expense");

  const openDialog = (type: ItemType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const hasData =
    data.toPayItems.length > 0 ||
    data.fulfilledItems.length > 0 ||
    data.incomeItems.length > 0;

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Zone 1 — normal background, standard padding */}
        <div className="flex flex-col gap-4 p-6">
          <div className="mx-auto flex w-full max-w-[1302px] flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {rangeLabel}
              </span>
              <IntervalSelector />
            </div>
            <DisposableHero />
            <ValueStrip />
          </div>
        </div>

        {hasData ? (
          /* Zone 2 — chart bleeds edge-to-edge, like the wash below it. */
          <div className="flex grow flex-col">
            <div className="h-[280px] w-full">
              <HistoryChart />
            </div>

            {/* Wash bleeds edge-to-edge; the grid inside stays on the 1302 column. */}
            <div
              className="flex grow flex-col"
              style={gradientStyle(data.disposable >= 0)}
            >
              <div className="mx-auto grid w-full max-w-[1302px] grow gap-8 px-6 pb-24 pt-12 md:pb-8 lg:grid-cols-3 lg:gap-16">
                <div className="lg:col-span-2">
                  <ToPayList />
                </div>
                <div>
                  <CategoryDonut />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex grow flex-col px-6 pb-6">
            <Blankslate
              onAddExpense={() => openDialog("expense")}
              onAddIncome={() => openDialog("income")}
            />
          </div>
        )}
      </div>

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
      />
    </>
  );
}

export default function Page() {
  return (
    <AppShell>
      <OverviewContent />
    </AppShell>
  );
}
