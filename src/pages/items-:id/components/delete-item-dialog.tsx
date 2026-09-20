import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDataProvider } from "@/lib/data-provider";
import type { RecurringItem } from "@/lib/data-provider";
import { useRouteBase } from "@/pages/overview/components/app-shell";

/**
 * The delete zone: a low-weight ghost trigger that opens a confirmation dialog.
 * The dialog spells out the consequence (future occurrences removed, past
 * fulfillment records kept). On confirm, navigate back to the item's list.
 */
export function DeleteItemDialog({ item }: { item: RecurringItem }) {
  const navigate = useNavigate();
  const base = useRouteBase();
  const isDemo = base === "/demo";
  const { useDeleteRecurringItem } = useDataProvider();
  const deleteItem = useDeleteRecurringItem();
  const [open, setOpen] = useState(false);

  const destination =
    item.type === "expense" ? `${base}/expenses` : `${base}/income`;

  const handleDelete = async () => {
    await deleteItem.mutateAsync(item.id);
    setOpen(false);
    // The demo deletes for real too, so it goes back to the list like the
    // paying app. Staying put would leave you looking at a page for an item
    // that no longer exists.
    navigate(destination);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
        >
          Delete {item.name}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes all future occurrences of {item.name}. Fulfillment
            records from past periods are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteItem.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={deleteItem.isPending}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            Delete {item.name}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
