import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TestimonialProps {
  quote: string;
  authorName: string;
  authorRole?: string;
  /** Optional avatar node (e.g. an image or a colored circle). */
  avatar?: ReactNode;
  /** Render on a colored/gradient page — transparent section, white text. */
  onColor?: boolean;
  className?: string;
}

/**
 * Testimonial — a large centered pull-quote with an author line. Built on the
 * landing tokens: semibold quote in labelPrimary, author name in
 * labelPrimary / role in labelSecondary. `onColor` flips to white-on-gradient.
 */
export function Testimonial({ quote, authorName, authorRole, avatar, onColor = false, className }: TestimonialProps) {
  const primary = onColor ? "text-white" : "text-foreground";
  const secondary = onColor ? "text-white/70" : "text-muted-foreground";
  return (
    <section className={cn("w-full px-6 py-24", !onColor && "bg-background", className)}>
      <figure className="mx-auto max-w-3xl text-center">
        <blockquote
          className={cn("font-semibold", primary)}
          style={{ fontSize: "clamp(32px, 4.2vw, 52px)", lineHeight: 1.14, letterSpacing: "-0.5px" }}
        >
          “{quote}”
        </blockquote>
        <figcaption className="mt-8 flex items-center justify-center gap-3">
          {avatar ? <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full">{avatar}</span> : null}
          <span className="text-[17px]">
            <span className={cn("font-semibold", primary)}>{authorName}</span>
            {authorRole ? <span className={secondary}> · {authorRole}</span> : null}
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
