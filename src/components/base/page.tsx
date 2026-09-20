import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared sticky page header: a blurred, scroll-fixed bar whose title +
 * actions align with the page content. Pages own
 * their own body wrapper (a plain `px-6` block) — a shared flex body wrapper was
 * removed after it caused a flexbox height feedback loop with tall table content.
 *
 * Width tokens keep the inner container aligned with each screen's body:
 *   - "narrow"  → forms (max-w-2xl)
 *   - "default" → lists (max-w-5xl)
 *   - "full"    → edge-to-edge (max-w-none)
 */
type PageWidth = "narrow" | "default" | "wide" | "full";

const WIDTH: Record<PageWidth, string> = {
  narrow: "max-w-2xl",
  default: "max-w-5xl",
  wide: "max-w-[1302px]",
  full: "max-w-none",
};

export function PageHeader({
  title,
  actions,
  onBack,
  width = "default",
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  onBack?: () => void;
  width?: PageWidth;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between gap-3 px-6 py-4",
          WIDTH[width],
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="-ml-2 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            </button>
          )}
          {title && (
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {children}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
