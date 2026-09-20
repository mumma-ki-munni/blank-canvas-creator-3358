import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency, shortDate } from "@/lib/format";
import type { Fulfillment, RecurringItem } from "@/lib/data-provider";
import { useDataProvider } from "@/lib/data-provider";
import { Badge } from "@/components/base/badge";
import { cn } from "@/lib/utils";
import { getNextOccurrences } from "@/lib/periods";
import { useRouteBase } from "@/pages/overview/components/app-shell";
import {
  ItemActionsButton,
  ItemContextMenu,
} from "@/components/items/item-actions";
import { useRecurringItemActions } from "@/components/items/recurring-item-actions";

export interface TableSection {
  /** Optional group label (e.g. a frequency). Omitted in flat list view. */
  label?: string;
  items: RecurringItem[];
}

// Shared column template — written as a literal so Tailwind's JIT picks it up.
const GRID =
  "md:grid-cols-[7rem_minmax(0,1fr)_8rem_7rem_7rem_7rem_8rem_2rem]";

function nextOccurrenceDate(item: RecurringItem): string | null {
  const next = getNextOccurrences(item, 1, new Date());
  return next[0]?.occurrence_date ?? null;
}

function lastPaidDate(itemId: string, fulfillments: Fulfillment[]): string | null {
  const matches = fulfillments
    .filter((f) => f.recurring_item_id === itemId)
    .map((f) => f.occurrence_date)
    .sort((a, b) => b.localeCompare(a));
  return matches[0] ?? null;
}

/**
 * One card-wrapped table for recurring items: a single column header
 * rendered once, group subheaders with
 * per-group count + subtotal (no repeated column headers), full-width clickable
 * rows with hover + a reveal-on-hover chevron. Collapses to two dense lines on
 * mobile.
 */
export function ItemsTable({ sections }: { sections: TableSection[] }) {
  const currency = useCurrency();
  const { useAllFulfillments } = useDataProvider();
  const { data: allFulfillments } = useAllFulfillments();

  const total = useMemo(
    () => sections.reduce((s, sec) => s + sec.items.length, 0),
    [sections],
  );
  if (total === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* Column header — desktop only, rendered ONCE */}
      <div
        className={cn(
          "hidden items-center gap-4 border-b border-border px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid",
          GRID,
        )}
      >
        <span>Type</span>
        <span>Name</span>
        <span>Category</span>
        <span>Frequency</span>
        <span>Next due</span>
        <span>Last paid</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {sections.map((section, si) => {
        const subtotal = section.items.reduce((s, i) => s + i.amount, 0);
        const isLastSection = si === sections.length - 1;
        return (
          <div key={section.label ?? si}>
            {section.label && (
              /* Bucket header, Finder-shaped (docs/plans/
                 03-bucket-group-headers.md v2): ONE left-anchored phrase of
                 exactly two pieces — the group and its total — no fill, no
                 border, 20px air above / 18px below. The total living IN the
                 title dissolves the alignment problem boards 01–03 fought:
                 with no right-aligned figure up here, there is nothing to
                 misalign, so the header needs none of the row-grid
                 machinery. No count either: our groups are 1–7 visible,
                 never-collapsed rows — a count would restate the screen.
                 19px is a deliberate absolute (client call, matching the
                 measured reference's title) — the one size outside the
                 repo scale, so it is written literally. */
              <div className="flex min-w-0 items-baseline gap-x-2.5 px-6 pb-[18px] pt-5">
                {/* Labels arrive Title-Case from data ("Monthly", "One-time")
                    and render as-is. */}
                <span className="min-w-0 truncate text-[19px] font-semibold leading-tight text-foreground">
                  {section.label}
                </span>
                <span className="whitespace-nowrap text-[19px] font-semibold leading-tight tabular-nums text-foreground">
                  <span className="sr-only">total </span>
                  {currency(subtotal, { cents: true })}
                </span>
              </div>
            )}

            {section.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                fulfillments={allFulfillments}
                isLastSection={isLastSection}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * One row. A single click opens it — not a double-click, which is a desktop
 * file-manager convention that does not carry to the web or to a touchscreen.
 *
 * While its menu is open the row looks different, because the menu opens beside
 * the pointer and attaches to nothing: in a list of similar rows you can lose
 * track of which one you hit, and then Delete is a guess.
 */
function ItemRow({
  item,
  fulfillments,
  isLastSection,
}: {
  item: RecurringItem;
  fulfillments: Fulfillment[];
  isLastSection: boolean;
}) {
  const navigate = useNavigate();
  const base = useRouteBase();
  const currency = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const { actions, dialogs } = useRecurringItemActions(item);

  const isIncome = item.type === "income";
  const nextDue = nextOccurrenceDate(item);
  const lastPaid = lastPaidDate(item.id, fulfillments);

  const open = useCallback(
    () => navigate(`${base}/items/${item.id}`),
    [base, item.id, navigate],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    },
    [open],
  );

  return (
    <>
      <ItemContextMenu actions={actions} onOpenChange={setMenuOpen}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open ${item.name}`}
          data-menu-open={menuOpen ? "true" : undefined}
          onClick={open}
          onKeyDown={handleKeyDown}
          className={cn(
            // Desktop rows are the reference's fixed 41px box (measured:
            // its density comes from a fixed height with content centered,
            // not from paddings around the tallest child). Our tallest
            // child is the 28px ⋯ button → 6px air each side inside 41.
            // Mobile keeps padded two-line stacking.
            "group grid w-full cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1 border-b border-border px-6 py-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:h-[41px] md:py-0",
            menuOpen && "bg-accent ring-2 ring-inset ring-ring",
            isLastSection && "last:border-b-0",
            GRID,
          )}
        >
                  {/* Desktop: Type */}
                  <span className="hidden md:block">
                    <Badge
                      color={isIncome ? "green" : "gray"}
                      className="text-[10px] uppercase"
                    >
                      {isIncome ? "Income" : "Expense"}
                    </Badge>
                  </span>

                  {/* Name — mobile shows badge + name inline */}
                  <span className="col-span-1 flex min-w-0 items-center gap-2 md:col-auto">
                    <Badge
                      color={isIncome ? "green" : "gray"}
                      className="shrink-0 text-[10px] uppercase md:hidden"
                    >
                      {isIncome ? "Income" : "Expense"}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </span>

                  {/* Amount — mobile only, right of the first row */}
                  <span className="text-right text-sm tabular-nums text-foreground md:hidden">
                    {currency(item.amount, { cents: true })}
                  </span>

                  {/* Desktop-only columns */}
                  <span className="hidden text-sm text-muted-foreground md:block">
                    {item.category ?? "—"}
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    {item.frequency}
                  </span>
                  <span className="hidden text-sm tabular-nums text-muted-foreground md:block">
                    {nextDue ? shortDate(nextDue) : "—"}
                  </span>
                  <span className="hidden text-sm tabular-nums text-muted-foreground md:block">
                    {lastPaid ? shortDate(lastPaid) : "—"}
                  </span>
                  <span className="hidden text-right text-sm font-medium tabular-nums text-foreground md:block">
                    {currency(item.amount, { cents: true })}
                  </span>
                  {/* The ⋯ button — on every row, at every width, because a
                      phone has no right-click. */}
                  <span className="justify-self-end">
                    <ItemActionsButton
                      actions={actions}
                      label={`Actions for ${item.name}`}
                      onOpenChange={setMenuOpen}
                    />
                  </span>

                  {/* Mobile line 2 */}
                  <span className="col-span-3 flex flex-wrap gap-x-2 text-xs text-muted-foreground md:hidden">
                    {item.category && <span>{item.category}</span>}
                    <span aria-hidden>·</span>
                    <span>{item.frequency}</span>
                    {nextDue && <span>· due {shortDate(nextDue)}</span>}
                  </span>
        </div>
      </ItemContextMenu>
      {dialogs}
    </>
  );
}
