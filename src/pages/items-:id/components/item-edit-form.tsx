import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
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
import type {
  ExpenseCategory,
  Frequency,
  RecurringItem,
} from "@/lib/data-provider";
import { cardClass } from "@/components/base/section-card";
import { useCurrency, longDate } from "@/lib/format";

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

const CARD = cardClass();

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

/**
 * The "Details" summary card for an item, and — on demand — its edit surface
 * View mode shows the
 * amount + a metadata list + an Edit button; clicking Edit swaps the card for
 * inline fields. Edits recalculate unfulfilled occurrences.
 */
export function ItemEditForm({ item }: { item: RecurringItem }) {
  const isExpense = item.type === "expense";
  const format = useCurrency();
  const { useUpdateRecurringItem } = useDataProvider();
  const updateItem = useUpdateRecurringItem();

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.amount));
  const [category, setCategory] = useState<ExpenseCategory>(
    item.category ?? "Housing",
  );
  const [frequency, setFrequency] = useState<Frequency>(item.frequency);
  const [startDate, setStartDate] = useState(item.start_date);
  const [hasEndDate, setHasEndDate] = useState(item.end_date !== null);
  const [endDate, setEndDate] = useState(item.end_date ?? "");

  const startEditing = () => {
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category ?? "Housing");
    setFrequency(item.frequency);
    setStartDate(item.start_date);
    setHasEndDate(item.end_date !== null);
    setEndDate(item.end_date ?? "");
    setEditing(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    await updateItem.mutateAsync({
      id: item.id,
      name: name.trim(),
      amount: Number(amount),
      category: isExpense ? category : null,
      frequency,
      start_date: startDate,
      end_date: hasEndDate && endDate ? endDate : null,
    });
    setEditing(false);
  };

  const canSave =
    name.trim().length > 0 && Number(amount) > 0 && startDate.length > 0;

  if (editing) {
    return (
      <form onSubmit={handleSave} className={`${CARD} flex flex-col gap-4`}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-amount">Amount</Label>
          <Input
            id="edit-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {isExpense && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
            >
              <SelectTrigger id="edit-category">
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
          <Label htmlFor="edit-frequency">Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as Frequency)}
          >
            <SelectTrigger id="edit-frequency">
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
          <Label htmlFor="edit-start">Start date</Label>
          <Input
            id="edit-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-has-end">End date</Label>
            <Switch
              id="edit-has-end"
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

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canSave || updateItem.isPending}>
            {updateItem.isPending && (
              <IconLoader2 className="size-4 animate-spin" />
            )}
            {updateItem.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={updateItem.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={CARD}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Details
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {format(item.amount, { cents: true })}
      </p>
      <dl className="mt-6 flex flex-col gap-3.5 border-t border-border pt-6">
        <DetailRow label="Frequency" value={item.frequency} />
        {isExpense && item.category && (
          <DetailRow label="Category" value={item.category} />
        )}
        <DetailRow label="Started" value={longDate(item.start_date)} />
        <DetailRow
          label="Ends"
          value={item.end_date ? longDate(item.end_date) : "No end date"}
        />
      </dl>
      <Button
        variant="outline"
        className="mt-6 w-full"
        onClick={startEditing}
      >
        Edit
      </Button>
    </div>
  );
}
