import { useEffect, useRef, useState } from "react";

/** The iframe's fixed layout width — the frame's own max width, so the app
 *  always renders its DESKTOP layout and scale is exactly 1 at full size. */
const DESKTOP_WIDTH = 1006;

/**
 * Live hero preview — embeds the REAL `/demo/overview` via an iframe, so the browser
 * frame shows the actual running app (sidebar + dashboard) and can never drift from
 * a hand-drawn mock. Same-origin, so the iframe shares the page's localStorage theme
 * and matches light/dark on load. Non-interactive (pointer-events-none, tabIndex -1,
 * aria-hidden) and scroll-locked so it reads as a static screenshot.
 *
 * The iframe always renders at DESKTOP_WIDTH and is scaled down to fit the frame
 * (docs/design/mobile-menu.md's sibling rule for landings): a width-tracking iframe
 * would reflow the app into its MOBILE layout inside desktop browser chrome —
 * a phone tab bar under a desktop address bar, clipped mid-content. A mockup is
 * either a scaled-down desktop or a real mobile design, never a hybrid.
 */
export function HeroPreview() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScale(el.clientWidth / DESKTOP_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="h-full w-full overflow-hidden">
      <iframe
        src="/demo/overview"
        title="Budget & Expense Tracker — live preview"
        aria-hidden
        tabIndex={-1}
        loading="lazy"
        scrolling="no"
        className="pointer-events-none origin-top-left border-0"
        style={{
          width: DESKTOP_WIDTH,
          height: (DESKTOP_WIDTH * 9) / 16,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
