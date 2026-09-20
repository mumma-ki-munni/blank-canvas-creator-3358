import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FooterProps {
  name: string;
  /** Small logo glyph (~20px). */
  icon?: ReactNode;
  /** Footer nav links — the app supplies its real ones; none are invented. */
  links?: Array<{ label: string; href: string }>;
  /** Copyright year; defaults to none (caller passes the real one). */
  year?: number;
  className?: string;
}

/**
 * Footer — logo + product name, an optional nav row, and an optional copyright
 * line, on the theme background with a hairline top border. Renders only what's
 * passed in — no placeholder links. Follows light and dark via theme tokens.
 */
export function Footer({ name, icon, links, year, className }: FooterProps) {
  return (
    <footer className={cn("w-full border-t border-border bg-background px-6 py-12", className)}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          {icon ? <span className="flex h-5 w-5 items-center justify-center text-foreground">{icon}</span> : null}
          <span className="text-[15px] font-semibold text-foreground">{name}</span>
        </div>
        {links && links.length > 0 ? (
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[15px]">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
        ) : null}
        {year ? <span className="text-[13px] text-muted-foreground">© {year} {name}</span> : null}
      </div>
    </footer>
  );
}
