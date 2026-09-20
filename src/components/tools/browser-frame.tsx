import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BrowserFrameProps {
  /** URL shown in the address pill. */
  url?: string;
  /** The "page" — a screenshot or live preview. Falls back to a soft placeholder. */
  children?: ReactNode;
  className?: string;
}

/**
 * Browser-chrome preview card — a product screenshot in a faux browser window,
 * for the landing paradigm (sits below the CTA). Styled as the
 * landing tile: 11px radius, soft offset shadow `17px 20px 40px rgba(0,0,0,.16)`,
 * white surface. Responsive width 315 → 478 → 650 caps via `max-width`; drop it
 * under the CTA with `mt-[calc(min(40px,8vw))]`.
 */
export function BrowserFrame({ url = "yourapp.com", children, className }: BrowserFrameProps) {
  return (
    <div
      className={cn("w-full overflow-hidden border border-border bg-card", className)}
      style={{
        borderRadius: 11,
        boxShadow: "17px 20px 40px rgba(0,0,0,0.16)",
      }}
    >
      {/* chrome bar */}
      <div className="flex h-11 items-center gap-4 border-b border-border px-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FEBC2E" }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#28C840" }} />
        </div>
        <div className="flex h-7 min-w-0 flex-1 items-center justify-center truncate rounded-full bg-muted px-3 text-[13px] text-muted-foreground">
          {url}
        </div>
      </div>

      {/* page content — 16:9 screen */}
      <div className="aspect-video w-full overflow-hidden bg-background">
        {children ?? (
          <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            Your product, right here
          </div>
        )}
      </div>
    </div>
  );
}
