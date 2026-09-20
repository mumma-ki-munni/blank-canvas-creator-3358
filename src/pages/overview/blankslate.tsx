import { IconCirclePlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { BlankslateShell } from "@/components/base/blankslate-shell";

interface BlankslateProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

/** First-time empty state for the Overview — flat page content, no card. */
export function Blankslate({ onAddExpense, onAddIncome }: BlankslateProps) {
  return (
    <BlankslateShell>
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <IconCirclePlus className="size-6 text-primary" />
        </span>
        <h2 className="text-base font-semibold text-foreground">
          Add your first expense
        </h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Recurring bills and subscriptions appear here once you add them.
        </p>
        <Button size="lg" className="mt-1" onClick={onAddExpense}>
          <IconCirclePlus className="size-4" />
          Add expense
        </Button>
        <button
          type="button"
          onClick={onAddIncome}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          or Add income →
        </button>
      </div>
    </BlankslateShell>
  );
}
