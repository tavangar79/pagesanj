# Pagesanj («پیج‌سنج») — Design System (Master)

Source of truth for the public site and the admin panel. Generated with ui-ux-pro-max
(pattern "Trust & Authority", style "Minimalism & Swiss", variance 4 / motion 3 / density 5),
then adapted: Vazirmatn instead of Inter (Persian glyphs), RTL, no GSAP (no new dependencies),
neutral surfaces instead of a tinted sky background so status colors stay unambiguous.

## Principles

- Calm, factual, editorial. The product reports evidence; the UI must never look alarmist or
  promotional. Status color appears only on status elements.
- One brand color (trust blue). Everything else is neutral ink on neutral surfaces.
- RTL first: use logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`,
  `text-start`, `border-s`, `border-e`). Handles, URLs, domains and codes get `dir="ltr"`.
- Light and dark mode come from tokens in `admin/src/index.css` (values below; the bot's admin panel). **Never** use raw palette
  classes (`zinc-*`, `emerald-*`, `red-*`, `white`, ...) or `dark:` variants in components.

## Tokens (Tailwind classes)

| Role | Class suffix | Use |
| --- | --- | --- |
| Page background | `canvas` | `bg-canvas` (body already has it) |
| Card / panel | `surface` | `bg-surface` |
| Subtle fill | `subtle` | table headers, hover rows, chips, skeletons |
| Hairline | `line` | default borders, dividers (`divide-line`) |
| Strong line | `line-strong` | input borders, secondary-button borders |
| Text | `ink` / `ink-2` / `ink-3` | headings / body / meta (all ≥ 4.5:1 on surface) |
| Brand text & links | `brand` | `text-brand`, focus rings `ring-brand/20` |
| Brand fill | `brand-solid`, `brand-solid-hover`, `on-brand` | primary buttons |
| Brand tint | `brand-soft`, `brand-line` | callouts, active nav item, info notes |
| Status | `danger`, `warn`, `caution`, `success` (+ `-soft`, `-line`, `-solid`) | status pills, alerts |
| Neutral dot | `neutral-solid` | "no known issues" dot |
| Elevation | `shadow-card`, `shadow-raised` | cards; hover lift |

Status mapping: `serious_warning` → danger, `warning` → warn, `mixed` → caution,
`recommended` → success, `no_known_issues` → neutral (`bg-subtle text-ink-2 border-line`).

## Typography

Vazirmatn variable (self-hosted). Body 16px, `leading-7`/`leading-8` for Persian prose.
Page title `text-2xl sm:text-3xl font-bold text-ink`; section title `text-lg font-bold text-ink`;
meta `text-sm text-ink-3`; never below `text-xs` (12px). Numbers with Persian digits.

## Spacing & shape

4px grid. Cards `rounded-2xl p-5`; controls `rounded-xl`; pills `rounded-full`.
Page container: public `mx-auto w-full max-w-5xl px-4`; article `max-w-3xl`.
Vertical rhythm: page sections `gap-10 sm:gap-14`, card internals `gap-3`.

## Component recipes

```
card            rounded-2xl border border-line bg-surface shadow-card
card (link)     + transition hover:border-brand-line hover:shadow-raised
button primary  inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-solid px-4
                text-sm font-semibold text-on-brand transition-colors hover:bg-brand-solid-hover
                disabled:opacity-60
button secondary  same shape, border border-line-strong bg-surface text-ink-2 hover:bg-subtle
button small    inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface
                px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-subtle
button danger   same as primary with bg-danger-solid text-white hover:opacity-90
input           w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink
                placeholder:text-ink-3 transition-colors focus:border-brand focus:outline-none
                focus:ring-4 focus:ring-brand/15
label           flex flex-col gap-1.5 text-sm font-medium text-ink-2
alert error     rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger
alert note      rounded-xl border border-caution-line bg-caution-soft px-4 py-3 text-sm text-caution
callout/info    rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-ink
inline link     font-medium text-brand underline-offset-4 hover:underline
table wrapper   overflow-x-auto rounded-2xl border border-line bg-surface shadow-card
  th            bg-subtle px-4 py-2.5 text-start text-xs font-semibold text-ink-3
  td            border-t border-line px-4 py-3 text-sm text-ink-2
list rows       divide-y divide-line; row hover:bg-subtle
eyebrow         text-xs font-semibold tracking-wide text-brand
```

In this repo the recipes are built into the shadcn primitives (`admin/src/components/ui`: `Button`
variants, `Badge` tones `danger|warn|caution|success|neutral`) and the shared pieces in
`admin/src/components/common.tsx` (`PageHeader`, `Panel`, `Field`, `Alert`, list states, `Handle`).
Reuse them; do not re-type the strings.

## shadcn/ui

Primitives live in `src/components/ui` (new-york style, Radix, `components.json`), with `cn()` in
`src/lib/utils.ts`. Their theme variables (`--primary`, `--background`, `--border`, ...) are
aliased to the tokens above in `index.css`, so they need no `dark:` handling of their own.
Button/Input/Card/Textarea were tuned to this system (h-10 controls, `rounded-xl`,
`rounded-2xl` cards, soft brand focus ring). Prefer `<Button>` (or `buttonVariants()` on a
`<Link>` / `asChild`), `<Input>`, `<Label>`, `<Card>` for new UI; the admin `buttonClass` family is
`buttonVariants()` output. Add more with `npx shadcn@latest add <name>` and re-check that the CLI
imports `cn` from `@/lib/utils`.

## Icons

Inline SVG, Lucide geometry (24 viewBox, stroke 2, round caps), `aria-hidden="true"`,
`size-4`/`size-5`. No emoji as icons. Icon-only buttons need an `aria-label`.

## Motion

Only `transition-colors`/`transition-shadow` at the Tailwind default (150ms). Skeletons use
`animate-pulse bg-subtle`. `prefers-reduced-motion` is handled globally.

## Accessibility checklist

- Text contrast ≥ 4.5:1 (tokens guarantee it; do not use `ink-3` on `subtle` for body text).
- Global `:focus-visible` outline; never remove it.
- Touch targets ≥ 40px tall for primary controls (h-10), 44px on the public search.
- Every input has a visible label; errors use `role="alert"`.
- Status is never color-only: pills always carry their text label.
