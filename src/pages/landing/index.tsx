import { Link } from "react-router-dom";
import { IconWallet } from "@tabler/icons-react";
import { AUTH_CTA, AUTH_CTA_ROUTE, DEMO_ROUTE } from "@/lib/auth/constants";
import { LandingHeader } from "@/components/tools/landing-header";
import { AppIcon } from "@/components/tools/app-icon";
import { BrowserFrame } from "@/components/tools/browser-frame";
import { FeatureSteps } from "@/components/tools/feature-steps";
import { Testimonial } from "@/components/tools/testimonial";
import { CtaBlock } from "@/components/tools/cta-block";
import { Footer } from "@/components/tools/footer";
import { HeroPreview } from "./components/hero-preview";

/**
 * Landing — the fixed tool-app landing paradigm (ported from lovable-tool-starter):
 * sticky header → hero (app-icon chiclet + name + tagline + CTAs + browser-chrome
 * preview) → how-it-works steps → testimonial → CTA block → footer. Identity tint
 * is green (`data-tint`), matching the app's brand + data viz. All CTAs route to
 * real pages — no `#` placeholders.
 */
export default function Landing() {
  return (
    <div data-tint="teal">
      <section
        className="relative flex min-h-screen w-full flex-col items-center pb-24"
        style={{ backgroundImage: "var(--tint-gradient)" }}
      >
        <LandingHeader
          icon={<IconWallet size={24} strokeWidth={2} />}
          name="Budget & Expense Tracker"
          menu={{
            routes: [{ label: "Home", to: "/" }],
            actions: [
              { label: AUTH_CTA.demo, to: DEMO_ROUTE, variant: "outline" },
              { label: AUTH_CTA.enter, to: AUTH_CTA_ROUTE, variant: "primary" },
            ],
          }}
          actions={
            <>
              <Link to={DEMO_ROUTE} className="text-[15px] font-medium text-white/80">
                {AUTH_CTA.demo}
              </Link>
              <Link
                to={AUTH_CTA_ROUTE}
                className="flex h-9 items-center rounded-full bg-white px-4 text-sm font-semibold"
                style={{ color: "var(--tint-pill-text)" }}
              >
                {AUTH_CTA.enter}
              </Link>
            </>
          }
        />

        <div className="flex w-full flex-col items-center px-6 pt-[10vh] text-center">
          <AppIcon bare className="mb-6" icon={<IconWallet size={78} strokeWidth={1.75} />} />
          <h1
            className="mx-auto max-w-[15ch] text-balance font-bold tracking-tight text-white"
            style={{ fontSize: "clamp(48px, 9vw, 86px)", lineHeight: 1.05 }}
          >
            Budget Expense Tracker
          </h1>
          <p className="mt-3 max-w-[520px] text-2xl font-semibold text-white">
            Track income by pay cycle
          </p>
          {/* Vertical on mobile: side-by-side CTAs squeeze until the pill's
              label wraps inside it. Stacked, each keeps its 44px tap height. */}
          <div className="mt-8 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
            <Link
              to={AUTH_CTA_ROUTE}
              className="flex h-11 w-full max-w-[320px] items-center justify-center whitespace-nowrap rounded-full bg-white px-[30px] text-[19px] font-semibold sm:w-auto"
              style={{ color: "var(--tint-pill-text)" }}
            >
              {AUTH_CTA.enter}
            </Link>
            <Link
              to={DEMO_ROUTE}
              className="flex h-11 items-center whitespace-nowrap text-[17px] font-medium text-white/80"
            >
              {AUTH_CTA.demo}
            </Link>
          </div>
          <BrowserFrame className="mt-[calc(min(56px,10vw))] max-w-[1006px]" url="budget-tracker.app">
            <HeroPreview />
          </BrowserFrame>
        </div>
      </section>

      <FeatureSteps
        heading="Know exactly what's yours."
        subheading="Three things that make paycheck-to-paycheck budgeting effortless."
        steps={[
          { title: "See what's disposable.", description: "One number per pay period — income in, recurring costs out, what's left to spend." },
          { title: "Track recurring items.", description: "Add income and expenses once; the app schedules every occurrence and marks them paid." },
          { title: "Set your pay cycle.", description: "Weekly, biweekly, or monthly with any anchor day — periods recalculate to match." },
        ]}
      />

      <Testimonial
        quote="For the first time I can see exactly what's safe to spend before my next paycheck. It replaced three spreadsheets."
        authorName="Priya Nair"
        authorRole="Freelance designer"
        avatar={<span className="flex h-full w-full items-center justify-center bg-[#14532d] text-sm font-semibold text-white">PN</span>}
      />

      <CtaBlock
        heading="Start tracking in minutes."
        subheading="Free to try. No credit card, no setup."
        primaryLabel={AUTH_CTA.enter}
        primaryHref={AUTH_CTA_ROUTE}
        secondaryLabel={AUTH_CTA.demo}
        secondaryHref={DEMO_ROUTE}
      />

      <Footer
        name="Budget & Expense Tracker"
        icon={<IconWallet size={20} strokeWidth={2} />}
        // One door into auth, described one way — the footer used to offer
        // "Sign in" and "Sign up" side by side, which is two names for the same
        // screen. See docs/design/auth-screen.md §5.
        links={[
          { label: AUTH_CTA.demo, href: DEMO_ROUTE },
          { label: AUTH_CTA.enter, href: AUTH_CTA_ROUTE },
        ]}
        year={2026}
      />
    </div>
  );
}
