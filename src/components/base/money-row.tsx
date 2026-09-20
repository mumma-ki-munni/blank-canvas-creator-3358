import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The shared row for the simple two-sided lists (Overview to-pay/fulfilled/
 * income, item-detail occurrences + recent fulfillments). Standardizes padding,
 * alignment, and the left/right split so every list reads identically. Screens
 * still supply their own content + actions per the entity they render.
 */
export function MoneyRow({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 py-3 text-sm",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-3">{right}</div>
    </li>
  );
}
