import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one FTUX empty-state shell: a flat centered region on the page surface
 * (docs/design/empty-state.md). No skeleton backdrop — a skeleton means
 * "content is on its way", and here none is. No floating card, no shadow —
 * floating + elevation are dialog signals, and a dialog promises Esc,
 * outside-click and an X, promises an empty state cannot keep.
 */
export function BlankslateShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-1 items-center justify-center",
        className,
      )}
    >
      <div className="flex w-full justify-center">{children}</div>
    </div>
  );
}
