import { cn } from "@/lib/utils";

const TILE_SHADOW = "17px 20px 40px rgba(0,0,0,0.16)";
const NUMBER_GRADIENT = "var(--tint-gradient)";

export interface FeatureStep {
  title: string;
  description: string;
}

export interface FeatureStepsProps {
  heading: string;
  subheading?: string;
  /** Steps, auto-numbered 01, 02, … */
  steps: FeatureStep[];
  /** Gradient used to fill the big step numerals. */
  numberGradient?: string;
  className?: string;
}

/**
 * "How it works" — a centered heading + subheading over surface tiles, one per
 * step. Each tile has a large gradient-filled numeral, a semibold title, and a
 * muted description. Uses theme tokens (background/card/foreground) so it follows
 * light and dark.
 */
export function FeatureSteps({ heading, subheading, steps, numberGradient = NUMBER_GRADIENT, className }: FeatureStepsProps) {
  return (
    <section className={cn("w-full bg-background px-6 py-24", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-[48px]" style={{ lineHeight: 1.08 }}>
          {heading}
        </h2>
        {subheading ? (
          <p className="mx-auto mt-4 max-w-md text-xl leading-relaxed text-muted-foreground">
            {subheading}
          </p>
        ) : null}
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="rounded-[11px] border border-border bg-card p-8 text-left"
            style={{ boxShadow: TILE_SHADOW }}
          >
            <span
              className="inline-block font-bold leading-none"
              style={{
                fontSize: "clamp(56px, 6vw, 76px)",
                backgroundImage: numberGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-xl font-semibold text-foreground">
              {s.title}
            </h3>
            <p className="mt-2 text-muted-foreground" style={{ fontSize: 17, lineHeight: "25px", letterSpacing: "-0.37px" }}>
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
