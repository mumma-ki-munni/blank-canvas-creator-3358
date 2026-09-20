import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight, IconPencil, IconTrash } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDataProvider, type RecurringItem } from "@/lib/data-provider";
import { useRouteBase } from "@/pages/overview/components/app-shell";
import type { ItemAction } from "./item-actions";

/**
 * Everything the app can do to one recurring item, in one list.
 *
 * The data provider is the list of operations the app supports on this thing:
 * update and delete. Both are reachable from here, and nothing here belongs to
 * a different thing — no "add a category", no "mark the whole period paid".
 */
export function useRecurringItemActions(item: RecurringItem) {
  const navigate = useNavigate();
  const base = useRouteBase();
  const isDemo = base === "/demo";
  const { useUpdateRecurringItem, useDeleteRecurringItem } = useDataProvider();
  const updateItem = useUpdateRecurringItem();
  const deleteItem = useDeleteRecurringItem();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState(item.name);

  const handleOpen = useCallback(
    () => navigate(`${base}/items/${item.id}`),
    [base, item.id, navigate],
  );

  const handleStartRename = useCallback(() => {
    setDraftName(item.name);
    setRenameOpen(true);
  }, [item.name]);

  const handleRename = useCallback(async () => {
    const next = draftName.trim();
    if (next && next !== item.name) {
      await updateItem.mutateAsync({ id: item.id, name: next });
    }
    setRenameOpen(false);
  }, [draftName, item.id, item.name, updateItem]);

  const handleDelete = useCallback(async () => {
    await deleteItem.mutateAsync(item.id);
    setDeleteOpen(false);
  }, [deleteItem, item.id]);

  const actions = useMemo<ItemAction[]>(
    () => [
      {
        id: "open",
        label: "Open",
        band: "view",
        icon: <IconArrowRight className="size-4" />,
        onSelect: handleOpen,
      },
      {
        id: "rename",
        label: "Rename…",
        band: "edit",
        icon: <IconPencil className="size-4" />,
        onSelect: handleStartRename,
      },
      {
        id: "delete",
        label: "Delete…",
        band: "delete",
        destructive: true,
        icon: <IconTrash className="size-4" />,
        onSelect: () => setDeleteOpen(true),
      },
    ],
    [handleOpen, handleStartRename],
  );

  const dialogs = (
    <>
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename {item.name}</DialogTitle>
          </DialogHeader>
          <Input
            value={draftName}
            autoFocus
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleRename()}
              disabled={!draftName.trim() || updateItem.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
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
              onClick={(event) => {
                event.preventDefault();
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
    </>
  );

  return { actions, dialogs };
}
