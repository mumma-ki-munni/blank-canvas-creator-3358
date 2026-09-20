import { IconWallet, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { BlankslateShell } from "@/components/base/blankslate-shell";

interface IncomeBlankslateProps {
  onAddIncome: () => void;
}

/** First-time empty state for the Income list — flat page content, no card. */
export function IncomeBlankslate({ onAddIncome }: IncomeBlankslateProps) {
  return (
    <BlankslateShell>
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <IconWallet className="size-6 text-primary" />
        </span>
        <h2 className="text-base font-semibold text-foreground">
          No income sources yet
        </h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Add your salary, freelance work, or other recurring income to see your
          disposable.
        </p>
        <Button size="lg" className="mt-1" onClick={onAddIncome}>
          <IconPlus className="size-4" />
          Add income
        </Button>
      </div>
    </BlankslateShell>
  );
}
