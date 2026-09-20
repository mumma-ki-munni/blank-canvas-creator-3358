import { IconReceipt, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { BlankslateShell } from "@/components/base/blankslate-shell";

interface ExpensesBlankslateProps {
  onAddExpense: () => void;
}

/** First-time empty state for the Expenses list — flat page content, no card. */
export function ExpensesBlankslate({ onAddExpense }: ExpensesBlankslateProps) {
  return (
    <BlankslateShell>
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <IconReceipt className="size-6 text-primary" />
        </span>
        <h2 className="text-base font-semibold text-foreground">
          No expenses yet
        </h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Add your recurring bills, subscriptions, and other fixed costs to get
          started.
        </p>
        <Button size="lg" className="mt-1" onClick={onAddExpense}>
          <IconPlus className="size-4" />
          Add expense
        </Button>
      </div>
    </BlankslateShell>
  );
}
