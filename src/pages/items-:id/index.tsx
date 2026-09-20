import { useNavigate, useParams } from "react-router-dom";
import { useDataProvider } from "@/lib/data-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/base/badge";
import { AppShell } from "@/pages/overview/components/app-shell";
import { PageHeader } from "@/components/base/page";
import { ItemEditForm } from "./components/item-edit-form";
import { OccurrenceList } from "./components/occurrence-list";
import { RecentFulfillments } from "./components/recent-fulfillments";
import { DeleteItemDialog } from "./components/delete-item-dialog";

/**
 * Item Detail (`/items/:id`): a sticky back header with the item name, then
 * a two-column body — the primary
 * column (occurrences + fulfillment history) beside a Details summary card with
 * the edit surface and the delete zone.
 */
export default function Page_() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useRecurringItem } = useDataProvider();
  const { data: item, isLoading } = useRecurringItem(id ?? "");

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <PageHeader
          onBack={() => navigate(-1)}
          title={item ? item.name : "Item"}
          width="full"
        >
          {item && (
            <Badge
              color={item.type === "income" ? "green" : "gray"}
              className="ml-1 text-[10px] uppercase"
            >
              {item.type === "income" ? "Income" : "Expense"}
            </Badge>
          )}
        </PageHeader>

        <div className="px-6 pb-16 pt-6">
          {isLoading ? (
              <ItemSkeleton />
            ) : item ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Primary column — upcoming + history */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                  <OccurrenceList item={item} />
                  <RecentFulfillments item={item} />
                </div>

                {/* Summary column — details / edit + delete */}
                <div className="flex flex-col gap-6">
                  <ItemEditForm item={item} />
                  <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Danger zone
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Removes all future occurrences. Past fulfillments are kept.
                    </p>
                    <div className="mt-4">
                      <DeleteItemDialog item={item} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ItemNotFound onBack={() => navigate(-1)} />
            )}
        </div>
      </div>
    </AppShell>
  );
}

/** Static skeleton bars matching the two-column detail layout (no pulse). */
function ItemSkeleton() {
  return (
    <div aria-hidden className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="h-48 rounded-xl border border-border bg-card" />
        <div className="h-40 rounded-xl border border-border bg-card" />
      </div>
      <div className="h-64 rounded-xl border border-border bg-card" />
    </div>
  );
}

function ItemNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <p className="text-sm text-muted-foreground">
        This item no longer exists. It may have been deleted.
      </p>
      <Button variant="outline" onClick={onBack}>
        Go back
      </Button>
    </div>
  );
}
