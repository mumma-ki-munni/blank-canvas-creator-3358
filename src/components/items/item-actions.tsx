import { Fragment, type ReactNode } from "react";
import { IconDots } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

/**
 * An item's actions, defined once and shown through two doors.
 *
 * Right-click and the ⋯ button are built from the same array, so they cannot
 * drift apart. Right-click is never the only door, because a phone has no
 * right-click.
 *
 * Actions are grouped by what the verb does to the thing, not alphabetically,
 * and the order of the groups never changes:
 *
 *   look at it  ·  get a copy out  ·  let others in  ·  change it  ·  take it away
 *
 * A group with nothing in it is skipped, so an empty group is a visible
 * question ("should you be able to export these?") rather than a silent
 * omission.
 */

export type ActionBand = "view" | "copy" | "share" | "edit" | "delete";

const BAND_ORDER: ActionBand[] = ["view", "copy", "share", "edit", "delete"];

export interface ItemAction {
  id: string;
  label: string;
  band: ActionBand;
  icon?: ReactNode;
  /** Red, and always last. Red means "this takes something away". */
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function toBands(actions: ItemAction[]): ItemAction[][] {
  return BAND_ORDER.map((band) =>
    actions.filter((action) => action.band === band),
  ).filter((group) => group.length > 0);
}

interface MenuParts {
  Item: typeof DropdownMenuItem | typeof ContextMenuItem;
  Separator: typeof DropdownMenuSeparator | typeof ContextMenuSeparator;
}

function renderBands(actions: ItemAction[], { Item, Separator }: MenuParts) {
  return toBands(actions).map((group, index) => (
    <Fragment key={group[0].id}>
      {index > 0 && <Separator />}
      {group.map((action) => (
        <Item
          key={action.id}
          disabled={action.disabled}
          onSelect={action.onSelect}
          className={cn(
            "gap-2",
            action.destructive && "text-destructive focus:text-destructive",
          )}
        >
          {action.icon}
          {action.label}
        </Item>
      ))}
    </Fragment>
  ));
}

/** Door one: the ⋯ button. Every item has one, at every width. */
export function ItemActionsButton({
  actions,
  label = "Actions",
  onOpenChange,
  className,
}: {
  actions: ItemAction[];
  label?: string;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(event) => {
            // The row itself opens the item; the button must not.
            event.stopPropagation();
          }}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <IconDots className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {renderBands(actions, {
          Item: DropdownMenuItem,
          Separator: DropdownMenuSeparator,
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Door two: right-click anywhere on the item. Same array, same order. */
export function ItemContextMenu({
  actions,
  onOpenChange,
  children,
}: {
  actions: ItemAction[];
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  if (actions.length === 0) return <>{children}</>;
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {renderBands(actions, {
          Item: ContextMenuItem,
          Separator: ContextMenuSeparator,
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
