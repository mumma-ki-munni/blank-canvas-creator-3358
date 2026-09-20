import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
// Raw Radix content: the vendored SheetContent bakes in its own overlay and X
// button, so the sheet composes from the lower-level exports instead — same
// lesson as PopoverAnchor: when the ui/ wrapper doesn't export the piece,
// import it from the Radix package directly.
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Sheet, SheetClose, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface LandingMenuRoute {
  label: string;
  to: string;
}

export interface LandingMenuAction {
  label: string;
  to: string;
  variant: "primary" | "outline";
}

/**
 * The mobile menu: routes (where you can go) and actions (doors — demo, auth),
 * never mixed. Passed as data, not nodes, so the sheet owns its own layout.
 */
export interface LandingMenu {
  routes: LandingMenuRoute[];
  actions: LandingMenuAction[];
}

export interface LandingHeaderProps {
  /** Small logo glyph (white, ~24px) — same visual size as the name. */
  icon: ReactNode;
  /** Product name, shown as text beside the logo. */
  name: string;
  /** Right-aligned actions (desktop bar; hidden on mobile when `menu` is set). */
  actions?: ReactNode;
  /** Mobile menu content. When set, mobile shows a ☰ that opens the sheet. */
  menu?: LandingMenu;
  /** Scroll offset (px) after which the background + shadow fade in. */
  threshold?: number;
  /** The faded-in background — match the hero (e.g. its top gradient stop). */
  background?: string;
  className?: string;
}

/**
 * Sticky landing header — logo + product name (same size) on the left, actions
 * on the right. Transparent over the hero; after `threshold` px of scroll it
 * fades in a frosted background (`background` + backdrop-blur) and a drop
 * shadow. Header dimensions are a compact bar (44px, 16px padding).
 */
export function LandingHeader({
  icon,
  name,
  actions,
  menu,
  threshold = 24,
  background = "color-mix(in srgb, var(--tint-from) 72%, transparent)",
  className,
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  // A boolean threshold — React bails out on same-value setState, so no throttle needed.
  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <header
      className={cn(
        // fixed, not sticky: sticky can never leave its parent's box, and this
        // header lives inside the hero section — sticky died at the hero's
        // bottom edge. fixed pins to the viewport for the whole page.
        "fixed inset-x-0 top-0 z-50 flex h-11 w-full items-center justify-between px-4 text-white",
        "transition-shadow duration-300 ease-out",
        className,
      )}
      style={{
        boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.18)" : "none",
      }}
    >
      {/* The frosted background lives on a CHILD layer, never on the header
          itself: backdrop-filter on an ancestor makes it the containing block
          for fixed descendants, which re-anchors the menu sheet to the bar —
          the off-screen sheet then widens the page and the document scrolls
          sideways (docs/design/mobile-menu.md build note). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 transition-[background-color,backdrop-filter] duration-300 ease-out"
        style={{
          backgroundColor: scrolled ? background : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        }}
      />
      {/* The wordmark is a link home. On the auth screen it is the only way
          back to the marketing page, so it cannot be inert text. */}
      <Link
        to="/"
        className="flex min-w-0 flex-1 items-center gap-2"
        aria-label={`${ name } — home`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
        {/* One line, always: template names are long and unpredictable, so the
            name truncates rather than wrapping into (and out of) the 44px bar. */}
        <span className="min-w-0 truncate text-[20px] font-semibold leading-none">{name}</span>
      </Link>
      {actions ? (
        <div className={cn("items-center gap-4", menu ? "hidden sm:flex" : "flex")}>
          {actions}
        </div>
      ) : null}
      {menu ? <MobileMenu menu={menu} /> : null}
    </header>
  );
}

/** The measured motion (docs/design/mobile-menu.md). Inline style, not a
 *  Tailwind class: inline always wins, and Tailwind silently drops ambiguous
 *  ease-[cubic-bezier(...)] classes. */
const SHEET_MOTION = {
  animationDuration: "320ms",
  animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;
const ICON_MOTION = {
  animationDuration: "200ms",
  animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;

/**
 * ☰ → full-height sheet sliding in from the right, leaving a 64px finger strip
 * of light scrim that closes it (as do ✕, the scrim anywhere, and Esc).
 *
 *                        tap ☰
 *       ┌────────────┐ ─────────────► ┌────────────┐
 *       │   CLOSED   │                │    OPEN    │
 *       └────────────┘ ◄───────────── └────────────┘
 *                 tap ✕ · scrim · Esc
 *
 *   ☰ trigger   rotate 0     opacity 1   →  rotate -180°  opacity 0
 *   ✕ (on top)  rotate 180°  opacity 0   →  rotate 0      opacity 1
 *   scrim       opacity 0, no pointer    →  opacity 1, light
 *   sheet       translateX(100%)         →  translateX(0)
 *   motion: 320ms cubic-bezier(0.4, 0, 0.6, 1) — Apple developer, measured
 *
 * Built on the vendored Sheet primitive (Radix dialog): the portal renders the
 * sheet at the body root, so no ancestor filter/transform/sticky can re-anchor
 * it; Esc, scrim-close, scroll lock, and the focus trap come from Radix.
 * The morph is two halves of one visual button: ☰ lives in the bar and spins
 * out on open; ✕ lives INSIDE the portal (Radix blocks clicks outside the open
 * dialog) positioned exactly over the trigger's spot, and spins in.
 */
function MobileMenu({ menu }: { menu: LandingMenu }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // The portal renders at the body root, OUTSIDE the landing's [data-tint]
  // scope — every var(--tint-*) would resolve to nothing there. Read the
  // page's tint once and stamp it on the sheet so the vars work inside it.
  const rootRef = useRef<HTMLDivElement>(null);
  const [tint, setTint] = useState<string | undefined>(undefined);
  useEffect(() => {
    setTint(rootRef.current?.closest("[data-tint]")?.getAttribute("data-tint") ?? undefined);
  }, []);

  return (
    <div ref={rootRef} className="sm:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        {/* The ☰ half of the morphing trigger — in the bar's icon spot. */}
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className="relative -mr-2 flex h-11 w-11 items-center justify-center text-white"
          >
            <span
              aria-hidden
              className={cn(
                "grid place-items-center transition-all [transition-duration:200ms] [transition-timing-function:cubic-bezier(0.4,0,0.6,1)] motion-reduce:transition-none",
                open ? "-rotate-180 opacity-0" : "rotate-0 opacity-100",
              )}
            >
              <IconMenu2 size={24} />
            </span>
          </button>
        </SheetTrigger>

        <SheetPortal>
          {/* Scrim — light, full viewport. Radix closes on click. */}
          <SheetOverlay
            className="z-[55] bg-white/50 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
            style={SHEET_MOTION}
          />

          {/* The sheet: full height, right-anchored, 64px finger strip left. */}
          {/* The sheet wears the hero: same tint gradient, white type — the
              open menu reads as the navigation bar unfolding, not a separate
              white panel. */}
          <SheetPrimitive.Content
            aria-describedby={undefined}
            data-tint={tint}
            className={cn(
              "group fixed inset-y-0 right-0 z-[55] flex w-[calc(100%-64px)] flex-col text-white shadow-xl outline-none",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right motion-reduce:animate-none",
            )}
            style={{ ...SHEET_MOTION, backgroundImage: "var(--tint-gradient)" }}
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>

            {/* The ✕ half of the morph — fixed over the bar trigger's spot. */}
            <SheetClose
              aria-label="Close menu"
              className="fixed right-2 top-0 flex h-11 w-11 items-center justify-center text-white outline-none"
            >
              <span
                aria-hidden
                className={cn(
                  "grid place-items-center motion-reduce:animate-none",
                  "group-data-[state=open]:animate-in group-data-[state=open]:[--tw-enter-rotate:180deg] group-data-[state=open]:[--tw-enter-opacity:0]",
                  "group-data-[state=closed]:animate-out group-data-[state=closed]:[--tw-exit-rotate:180deg] group-data-[state=closed]:[--tw-exit-opacity:0]",
                )}
                style={ICON_MOTION}
              >
                <IconX size={24} />
              </span>
            </SheetClose>

            {/* Top zone: 2× the header bar, the ✕ floats in its first 44px. */}
            <div className="h-[88px] shrink-0" />

        {/* Routes — where you can go. Right-aligned, one row each.
            Type and rhythm are Apple developer's mobile menu, measured off
            the real row box: the ROW is full-bleed, 54px tall, -3px margin
            between rows (51px net pitch); the 48px inset is padding INSIDE
            it, so the whole row width is tappable. Text: 28px / 600 / 32px. */}
        <div className="flex flex-col space-y-[-3px]">
          {menu.routes.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              onClick={close}
              className="flex h-[54px] w-full items-center justify-end px-12 text-[28px] font-semibold leading-8 tracking-tight"
            >
              {r.label}
            </Link>
          ))}
        </div>

        {/* Actions — the doors. Fluid pills, pinned to the bottom. */}
        <div className="mt-auto flex flex-col gap-3 px-12 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {menu.actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              onClick={close}
              className={cn(
                "flex h-11 items-center justify-center rounded-full text-base font-semibold",
                a.variant === "primary"
                  ? "bg-white"
                  : "text-white ring-1 ring-inset ring-white/40",
              )}
              style={a.variant === "primary" ? { color: "var(--tint-pill-text)" } : undefined}
            >
              {a.label}
            </Link>
          ))}
        </div>
          </SheetPrimitive.Content>
        </SheetPortal>
      </Sheet>
    </div>
  );
}
