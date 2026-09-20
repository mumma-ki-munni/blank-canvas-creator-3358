import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Top 6 currencies (screenboard). The selected code drives the symbol shown
// throughout the app.
const CURRENCIES: { code: string; label: string }[] = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
];

interface PreferencesSectionProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export function PreferencesSection({
  currency,
  onCurrencyChange,
}: PreferencesSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
