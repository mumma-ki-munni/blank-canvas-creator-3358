import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The one card surface, as a class string — for non-div roots (e.g. a form). */
export const cardClass = (glass = false) =>
  cn(
    "rounded-xl border border-border p-6 shadow-xs",
    glass ? "bg-card/90 backdrop-blur-xl" : "bg-card",
  );

/**
 * The one card surface used across screens. `glass` is for cards that float on
 * the Overview gradient (translucent + blur); the default is a solid card.
 */
export function SectionCard({
  children,
  glass = false,
  className,
}: {
  children: ReactNode;
  glass?: boolean;
  className?: string;
}) {
  return <div className={cn(cardClass(glass), className)}>{children}</div>;
}
