import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataProvider } from "@/lib/data-provider";
import type { ExpenseCategory, Frequency, ItemType } from "@/lib/data-provider";
import { useRouteBase } from "./app-shell";

const CATEGORIES: ExpenseCategory[] = [
  "Housing",
  "Utilities",
  "Transport",
  "Health",
  "Subscriptions",
  "Insurance",
  "Groceries",
  "Other",
];

const FREQUENCIES: Frequency[] = [
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Yearly",
  "One-time",
];

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ItemType;
}

export function AddItemDialog({ open, onOpenChange, type }: AddItemDialogProps) {
  const isExpense = type === "expense";
  const navigate = useNavigate();
  const base = useRouteBase();
  const { useCreateRecurringItem } = useDataProvider();
  const createItem = useCreateRecurringItem();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Housing");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [startDate, setStartDate] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");

  const reset = () => {
    setName("");
    setAmount("");
    setCategory("Housing");
    setFrequency("Monthly");
    setStartDate("");
    setHasEndDate(false);
    setEndDate("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await createItem.mutateAsync({
      name: name.trim(),
      amount: Number(amount),
      type,
      category: isExpense ? category : null,
      frequency,
      start_date: startDate,
      end_date: hasEndDate && endDate ? endDate : null,
    });
    handleOpenChange(false);
    if (created) navigate(`${base}/items/${created.id}`);
  };

  const canSubmit =
    name.trim().length > 0 && Number(amount) > 0 && startDate.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isExpense ? "Add expense" : "Add income"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder={isExpense ? "Rent…" : "Salary…"}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-amount">Amount</Label>
            <Input
              id="item-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {isExpense && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger id="item-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as Frequency)}
            >
              <SelectTrigger id="item-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-start">Start date</Label>
            <Input
              id="item-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="item-has-end">End date (optional)</Label>
              <Switch
                id="item-has-end"
                checked={hasEndDate}
                onCheckedChange={setHasEndDate}
              />
            </div>
            {hasEndDate ? (
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No end date</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || createItem.isPending}>
              {createItem.isPending && (
                <IconLoader2 className="size-4 animate-spin" />
              )}
              {createItem.isPending
                ? "Saving…"
                : isExpense
                  ? "Save expense"
                  : "Save income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
