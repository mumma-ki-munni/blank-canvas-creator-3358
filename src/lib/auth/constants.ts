/**
 * The welcome line at the top of the auth screen — two lines, held by explicit
 * breaks so a third line cannot push the buttons off centre.
 *
 * It must be a welcome, not the bare word "Sign in", which tells a person
 * nothing they did not already know from clicking Sign in. See
 * docs/design/auth-screen.md rule 9.
 */
export const AUTH_WELCOME = {
  signIn: [ "Welcome back to", "your money map" ],
  signUp: [ "See where the money", "actually goes" ],
} as const;

/**
 * The words on every button that leads to the auth screen.
 *
 * The auth screen is one door, so the app must not describe it several ways on
 * the way in. This is the one place those words live; every surface imports
 * from here. This template had already drifted: the landing header said "See
 * demo" while the rule's word is "View demo".
 *
 * Two jobs, and the job is decided by what the person loses by not clicking —
 * never by where the button sits:
 *
 *   ENTER   a visitor on a marketing surface (header, hero, CTA band)
 *   SAVE    a guest already inside the product
 *
 * See docs/design/auth-screen.md §5.
 */
export const AUTH_CTA = {
  enter: "Get started",
  save: "Sign in to save",
  demo: "View demo",
} as const;

/**
 * Where a marketing "Get started" sends the visitor.
 *
 * `/sign-in`, the same as every other template — the two routes are one screen
 * in two modes, and each offers a link to the other, so a returning visitor is
 * never stranded on the wrong one. Pointing half the CTAs at /sign-up would
 * make the "one door" this rule is about into two.
 */
export const AUTH_CTA_ROUTE = "/sign-in";

/** Where the demo lives, for the secondary beside every `enter`. */
export const DEMO_ROUTE = "/demo/overview";
