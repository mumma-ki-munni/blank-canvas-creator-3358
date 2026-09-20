# Consistent pill radius for buttons and inputs

Right now the app mixes two shapes: auth buttons, landing CTAs and the search field are pills, while most app buttons, inputs and dropdowns use a soft ~11px radius. Everything becomes a pill.

## What changes

- **All buttons** — pill shaped everywhere, including icon buttons (perfect circles), dialog actions (Cancel / Save), toolbar buttons, blankslate CTAs, and the Google/Apple sign-in buttons.
- **All inputs** — text, number and date fields, textareas, and dropdown triggers become pills. Dropdown/select menu panels stay soft-cornered (a pill panel looks broken).
- **Left alone** — badges, filter chips, avatars and progress bars stay fully round as they already are. Cards, tables and panels keep their current radius.

## Technical notes

- `src/components/ui/button.tsx`: base variant class `rounded-md` → `rounded-full`. This is the one place that fixes almost every button in the app, and it makes the `base/button.tsx` wrapper's own `rounded-full` redundant (wrapper stays as-is, harmless).
- `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx` (trigger only): `rounded-md` → `rounded-full`. Textarea gets `rounded-2xl` instead, since a multi-line box with fully round ends is unusable — closest consistent read.
- `src/components/base/social-auth-buttons.tsx`: `rounded-lg` → `rounded-full`.
- Hand-rolled button-like elements get the same treatment: the back button in `src/components/base/page.tsx`, sidebar nav items and mobile tab items in `src/pages/overview/components/app-shell.tsx`, and the landing/CTA anchors in `src/pages/landing/index.tsx` + `src/components/tools/cta-block.tsx` (already pills — verified only).
- Any `rounded-md`/`rounded-lg` override passed via `className` on a Button or Input is removed so it can't fight the new base.
- Sacred folders `components/ai-elements/` are untouched; `components/ui/` edits are limited to the radius tokens above.

## Verification

Run `npm run build`, then a Playwright pass over `/sign-in`, `/demo/overview`, `/demo/expenses`, an item detail page and `/demo/settings` (including the add-item dialog) to confirm no clipped or lopsided controls in light and dark mode.
