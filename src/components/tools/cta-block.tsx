import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const TILE_SHADOW = "17px 20px 40px rgba(0,0,0,0.16)";
const CTA_GRADIENT = "var(--tint-gradient)";

export interface CtaBlockProps {
  heading: string;
  subheading?: string;
  /** Primary (auth) CTA label. */
  primaryLabel: string;
  /** Route the primary CTA links to (e.g. "/sign-up"). */
  primaryHref: string;
  /** Secondary (demo) link label. */
  secondaryLabel?: string;
  /** Route the secondary link goes to (e.g. "/demo/overview"). */
  secondaryHref?: string;
  /** Gradient background of the wide tile. */
  background?: string;
  /** Text color for the white pill (match the hero hue). */
  pillTextColor?: string;
  className?: string;
}

/**
 * Closing CTA — a wide, gradient-filled tile (rounded, soft shadow) on a white
 * section, holding a centered heading + the two actions (white pill auth +
 * white demo link). Built on the landing tile shape.
 */
export function CtaBlock({
  heading,
  subheading,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  background = CTA_GRADIENT,
  pillTextColor = "var(--tint-pill-text)",
  className,
}: CtaBlockProps) {
  return (
    <section className={cn("w-full bg-background px-6 py-24", className)}>
      <div
        className="mx-auto max-w-5xl rounded-[24px] px-8 py-20 text-center"
        style={{ backgroundImage: background, boxShadow: TILE_SHADOW }}
      >
        <h2 className="mx-auto max-w-2xl font-semibold tracking-tight text-white" style={{ fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.08 }}>
          {heading}
        </h2>
        {subheading ? (
          <p className="mx-auto mt-4 max-w-md text-xl leading-relaxed text-white/70">{subheading}</p>
        ) : null}
        {/* Vertical on mobile: side-by-side CTAs squeeze until the pill's
            label wraps inside it. Stacked, each keeps its 44px tap height. */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            to={primaryHref}
            className="flex h-11 w-full max-w-[320px] items-center justify-center whitespace-nowrap rounded-full bg-white px-[30px] text-[19px] font-semibold sm:w-auto"
            style={{ color: pillTextColor }}
          >
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref ? (
            <Link
              to={secondaryHref}
              className="flex h-11 items-center whitespace-nowrap text-[17px] font-medium text-white/85"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
