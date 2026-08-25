---
name: design-system-freelancexchain
description: Implementation-ready design-system rules for FreelanceXchain — tokens, component states, and testable accessibility criteria. Use when creating or updating UI, component specifications, or design-system documentation.
---

# FreelanceXchain Design System

> Supersedes the generated `design-system-sprout` scan that previously occupied this file.
> That scan was captured from an unrelated product: its brand was wrong, its type
> scale was captured at the wrong magnification (`base=12px`, `xs=6px`), and its
> `color.text.primary=#535862` contradicted the palette actually shipped. Its
> **rules** were sound and are kept verbatim below; its **values** are replaced with
> the ones in `src/app/globals.css`, every one of which is contrast-verified.
>
> This file is hand-maintained. If typeui.sh regenerates it, restore from git.

## Context and goals

FreelanceXchain is a two-sided marketplace. Freelancers and employers move real
money through smart-contract escrow and milestone releases, and a third role
(admin) moderates it.

That shapes every rule here:

- **Status is the product.** A contract, milestone, proposal, dispute or KYC
  check is only ever understood through its state. State must read identically
  for both sides of a deal — an employer and a freelancer looking at the same
  contract must reach the same conclusion.
- **Money must be unambiguous.** Amounts are formatted in one place, never
  locale-dependent, never truncated.
- **Trust is earned through consistency.** A platform holding escrow cannot
  afford controls that look improvised.

Target: **WCAG 2.2 AA**. Keyboard-first. Focus always visible.

## Design tokens and foundations

All tokens live in `src/app/globals.css`. Components consume semantic tokens
only — never a raw hex, never a Tailwind palette class (`bg-green-500`).

### Colour

Two themes, light canonical. `defaultTheme="system"`, `enableSystem`.

| Group | Tokens |
|---|---|
| Surface | `background`, `card`, `popover`, `muted`, `secondary`, `accent`, `sidebar` |
| Text | `foreground`, `foreground-subtle`, `muted-foreground`, plus each surface's `-foreground` |
| Brand | `primary`, `primary-foreground`, `primary-hover`, `primary-active`, `primary-subtle` |
| Boundary | `border` (decorative), `border-strong`, `input` (UI boundary, ≥3:1), `ring` |
| Status | `success`, `warning`, `info`, `destructive`, `neutral` — each with `-foreground`, `-subtle`, `-border` |
| Brand ramp | `brand-1/2/3` — consumed only by the logo SVG |

`--border` and `--input` are deliberately different colours. Card edges and
dividers are decorative and may be soft; a form field boundary is a UI component
under WCAG 1.4.11 and must hold 3:1 on its own.

**Every pair is verified.** `pnpm verify:contrast` parses the real token blocks
out of `globals.css` and asserts 110 pairs at 4.5:1 (text) and 3:1 (UI) in both
themes. It must stay green.

### Typography

One family: **Nunito Sans**, loaded via `next/font/google` in `src/app/layout.tsx`.
Heading contrast comes from weight (800), negative tracking and balanced wrapping —
not a second typeface.

Scale re-anchored at `base = 1rem`. `sm` is the dense-UI default; `2xs`
(`0.6875rem`) is the smallest sanctioned step and the only home for what used to
be `text-[11px]` and `text-[10px]`. Every step ships a paired line-height and
letter-spacing. **Arbitrary font sizes are prohibited.**

### Spacing, radius, elevation, motion

- **Spacing** — Tailwind's scale, plus named layout tokens: `--space-page-x`,
  `--space-section-y`, `--space-card`, `--space-stack`, `--space-field`.
- **Radius** — four steps: `sm` chips/small inputs, `md` buttons/inputs, `lg`
  cards, `full` pills/avatars. `xl`–`4xl` exist for large surfaces only.
- **Elevation** — `shadow-xs` … `shadow-2xl`, resolving per theme. Dark mode
  trades drop shadows (invisible on `#0a0a0a`) for border contrast plus a hairline
  inset highlight.
- **Motion** — `--duration-fast|base|slow`, `--ease-out|in-out|spring`. All of it
  is neutralized under `prefers-reduced-motion`, including the marquees, entrance
  animations and hover-scale transforms.

## Component rules

### Required states

Every interactive component **must** define: `default`, `hover`, `focus-visible`,
`active`, `disabled`, `loading`, `error`.

- `disabled` **must not** be expressed with `opacity-50` — that drops text below
  AA. Use `bg-muted` / `text-muted-foreground`.
- `error` is driven by `aria-invalid`, so form wiring gets it for free.
- `loading` is a component prop, never a caller-assembled spinner, and **must**
  set `aria-busy`.
- A global `:focus-visible` fallback ring in `@layer base` guarantees nothing can
  be focus-invisible. Components may override it; they **must not** remove it.

### Primitives

`src/components/ui/` contains primitives **only**. Marketing sections live in
`src/components/marketing/`, app chrome in `src/components/layout/`.

`Button` is the reference implementation. `Table`, `Select`, `Checkbox`, `Radio`,
`Switch`, `Tooltip`, `Skeleton`, `Progress`, `EmptyState` and `Field` exist so
pages stop hand-rolling them — a hand-rolled control is how the two role
dashboards drifted apart.

`Field` wraps label + description + control + error and wires `id`,
`aria-describedby` and `aria-invalid` via `useField()`. **All new form fields must
use it.**

### Status

`src/lib/status-styles.ts` is the only source of status presentation.
`getStatusDescriptor(status, domain?)` returns tone, label and classes.
`<StatusBadge status={…} domain="contract" />` is the only way to render state.

Domain scoping exists for statuses whose meaning is context-dependent — an `open`
project is healthy, an `open` dispute needs attention. Everything else resolves
identically in every domain, which is the point.

Status is **never** conveyed by colour alone: the label always renders, and dots
are decorative (`aria-hidden`).

### Money and dates

`src/lib/format.ts` only. `formatAmount` renders whole values without cents and
fractional values with them. Every helper pins `en-US` so the server and the
browser cannot disagree and trigger a hydration mismatch.

### Icons

`lucide-react` only, at a consistent size (`size-4` inline, `size-5` standalone).

### Responsive and edge cases

- Wide content (tables, code) scrolls inside its own container; the page body
  **must not** scroll horizontally.
- Dashboard navigation is a sidebar at `lg` and above, and the same `SidebarNav`
  inside a drawer below it.
- Long content **must** truncate or wrap deliberately, never overflow.
- Every list **must** have an `EmptyState` that says what is missing and what to
  do about it — never a bare "No data".

## Accessibility acceptance criteria

Each is testable:

1. `pnpm verify:contrast` passes — all 110 token pairs at AA in both themes.
2. Every focusable element shows a visible ring; no `outline-none` without a
   replacement indicator.
3. Every dashboard route is reachable from the keyboard, and the first Tab stop
   is "Skip to main content".
4. Every form control has a programmatically associated label; errors carry
   `role="alert"` and are referenced by `aria-describedby`.
5. Current navigation state is exposed with `aria-current="page"`, not colour.
6. Icon-only controls have an `aria-label`; a tooltip is never the only label.
7. `prefers-reduced-motion: reduce` stops all marquees, entrance animations and
   hover-scale transforms.
8. No nested landmarks — exactly one `<main>` per page.
9. Interactive elements are never nested (no `<a><button>`).

## Content and tone

Concise, confident, implementation-focused. Sentence case.

| Do | Don't |
|---|---|
| "No proposals yet — share this project to attract freelancers." | "No data" |
| "Approved", "In progress", "Under review" | `approved`, `in_progress` |
| "Release payment" | "Submit" |
| "$1,200" · "$1,200.50" | "1200" |
| "We hit an unexpected error. Your contracts are unaffected." | Raw stack traces |

Never present illustrative copy as an attributed customer quote.

## Anti-patterns

Prohibited, all of which this codebase previously contained:

- Palette classes (`bg-green-500`, `text-red-500`) or raw hex in components.
- Arbitrary font sizes (`text-[11px]`).
- CSS classes referenced but never defined — `gradient-primary` was used in 26
  places while undefined, rendering primary CTAs as white text on no background.
- `--input` used as a background (it is a boundary colour).
- `opacity-50` as a disabled state.
- `text-white` on a themed surface; use the surface's `-foreground` token.
- Per-page `statusColors` maps.
- Bare `toLocaleString()` for money.
- Exact-match nav highlighting, which loses the parent on every detail route.
- Nested `<main>`, or `<a>` wrapping `<button>`.

## QA checklist

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`
- [ ] `pnpm test`, `pnpm test:e2e`
- [ ] `pnpm verify:contrast`
- [ ] No new palette classes, raw hex, or arbitrary font sizes
- [ ] New components define all seven required states
- [ ] Keyboard pass: shell, a form, a dialog, the command palette, the mobile drawer
- [ ] Both themes checked, including system preference
- [ ] 375 / 768 / 1280 / 1920 with no horizontal body scroll
- [ ] Both role dashboards render the same concepts the same way
