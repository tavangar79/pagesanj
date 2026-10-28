# Design System: Pagesanj (پیج‌سنج)

Public website for pagesanj: an Instagram DM assistant that tells people what reviewer pages have published about a shop before they buy. Generated with the Taste skill (`stitch-utilities:taste-design`) at its defaults: **Creativity 9 · Variance 8 · Motion 8 · Density 5** (Motion raised from the default 6 at the owner's request). This file is the source of truth for `web/`; `src/index.css` implements its tokens.

Hard constraints that override anything below (PRD §7): Persian RTL first and English LTR, every page server-rendered and readable without JavaScript, legal text never hidden, collapsed or moved behind interactions, contrast ≥ 4.5:1, all motion off under `prefers-reduced-motion`.

## 1. Visual Theme & Atmosphere

A confident, editorial interface with the calm authority of a well-edited magazine and the immediacy of a messaging app. Layouts are **offset and asymmetric**: big type anchored to the start edge, generous negative space on the other side, sections that alternate weight between columns rather than stacking centred blocks. Density is "daily app balanced": airy above the fold, tighter in the legal reading column.

The mood is *clear-eyed verification*: a verdict being stamped, a fact being underlined. It is not playful and not alarmist. One saturated green does all the talking; everything else is near-monochrome zinc. Motion is cinematic but quiet: the page is choreographed to the scroll, so reading it feels like turning the pages of a well-produced story. Things settle into place with a soft spring overshoot, and a few elements keep a slow, perpetual life (a typing indicator, a shimmer across the verdict stamp, a marquee of example handles).

## 2. Color Palette & Roles

Neutrals are one family (Zinc), never mixed with Slate or warm greys.

**Light**
- **Paper** (#FAFAF9): page canvas, a faint warm-neutral off-white
- **Sheet** (#FFFFFF): raised surfaces (phone mock-up, form)
- **Wash** (#F1F1EF): subtle fills, chips, table headers, skeletons
- **Hairline** (#E4E4E1): 1px structural dividers, card borders
- **Rule** (#C9C9C4): input borders, strong dividers
- **Ink** (#18181B): headings and primary text (Zinc-950 depth, never #000)
- **Graphite** (#3F3F46): body text
- **Pewter** (#63636B): metadata, captions (4.9:1 on Paper)
- **Verdict Green** (#127A66): the single accent: CTAs, links, active states, focus rings, the highlighted headline phrase (5.3:1 on white)
- **Verdict Green Deep** (#0D5E4F): hover/pressed accent
- **Verdict Mist** (#E3F2EE): accent tint for chips and callouts
- **On Accent** (#FFFFFF): text on Verdict Green

**Dark**
- **Paper** (#0C0C0E), **Sheet** (#151518), **Wash** (#1C1C20), **Hairline** (#26262B), **Rule** (#3A3A41)
- **Ink** (#F4F4F5), **Graphite** (#C8C8CE), **Pewter** (#9A9AA3)
- **Verdict Green** (#4FCDB0) for text and links; **solid fill** stays #127A66 with white text
- **Verdict Mist** (#10302A)

**Status (only on status elements, always with a text label):** Caution Amber (#92400E on #FFF7E6 / dark #FDE68A on #2E2309), Settled Green = Verdict Green.

Banned: purple or blue-neon glows, gradient text, any second accent, pure black.

## 3. Typography Rules

- **Display (Latin):** `Geist` variable, weight 700–800, tracking −0.035em on display sizes, tight leading (1.02–1.08). Self-hosted from `@fontsource-variable/geist`.
- **Display and body (Persian):** `Vazirmatn` variable (the only text face with full Persian coverage at this quality), weight 800 for display, 400/500 for body, **zero letter-spacing** (tracking breaks Persian joins), leading 1.35 for display and 2 for body.
- **Body (Latin):** `Geist` 400/500, 17–18px, leading 1.7, measure capped at 65ch.
- **Mono:** `Geist Mono` for handles inside mock-ups, confirmation codes and the small uppercase-free labels on stamps.
- **Scale:** display `clamp(2.75rem, 1.2rem + 6.5vw, 6.5rem)`; section title `clamp(2rem, 1.2rem + 3vw, 3.5rem)`; body never below 16px; meta never below 13px.
- Hierarchy comes from weight and colour (Ink vs Pewter), not only size. Headlines are never all-caps.
- **Banned:** Inter, Times/Georgia/Garamond, any serif in UI, letter-spacing on Persian.

## 4. Hero Section

- **Inline image typography (signature):** the headline carries small, type-height visuals between words: a rounded "DM bubble" capsule, an avatar-plus-`@handle` capsule, and a stamped "✓ verdict" capsule. They are CSS/SVG objects (no stock photos), rounded-full, sitting on the baseline like punctuation. On mobile they stay inline but shrink; they never overlap text.
- **Layout:** start-aligned, asymmetric split. Headline spans ~8 of 12 columns; the phone mock-up sits in the remaining columns, offset downward so its top aligns with the lede, not the headline.
- **One primary CTA** ("Message @pagesanj"), no secondary button. A one-line note beside it.
- No "scroll to explore", no chevrons, no centred hero.

## 5. Component Stylings

- **Buttons:** pill-shaped, Verdict Green fill, On Accent text, 52px tall. Hover deepens to Verdict Green Deep and nudges a trailing arrow 4px toward the reading end; active presses down 1px. No outer glow.
- **Chips / capsules:** rounded-full, Wash fill, Hairline border, Graphite text; accent variant uses Verdict Mist + Verdict Green.
- **Cards:** used only where elevation means something: the phone mock-up and the deletion-status result. Radius 2rem (32px), Hairline border, shadow tinted toward the canvas hue, never grey-black blobs. Everything else is separated by **border-top hairlines and whitespace**, not boxes.
- **Inputs:** label above, helper below, 52px tall, radius 14px, Rule border, focus ring 4px Verdict Green at 18% plus a solid Verdict Green border. No floating labels.
- **Verdict stamp:** a rounded-full capsule with a check glyph and text label, with a slow shimmer sweep (perpetual micro-interaction).
- **Empty / unknown states:** composed: icon in a Wash tile, one-line verdict, next action as a link.

## 6. Layout Principles

- 12-column CSS grid, max width 1280px, gutters 24px (16px mobile). No `calc()` percentage hacks.
- Sections alternate their visual weight: hero heavy at the start edge; "how it works" as a **numbered zig-zag** (step text on one side, its illustration on the other, flipping every row); "sources" as a **sticky-heading split** (title pinned on one side, two statements scroll on the other); privacy as a **full-bleed Ink band** with three facts in an asymmetric 5/4/3 split; closing CTA as one oversized line of type plus the button.
- **Banned:** three equal cards in a row, centred hero, overlapping elements, absolute-positioned text stacks.
- Full-height sections use `min-h-[100dvh]`, never `h-screen`.
- **Legal pages:** reading column at 68ch on the start side, a sticky contents rail on the end side at ≥ 1024px (it sits above the text on mobile). Every section is open and in full. Section numbers are large Pewter numerals in Geist Mono beside each heading.

## 7. Responsive Rules

- Below 768px everything is a single column, in reading order (hero text, then phone).
- No horizontal scroll at any width (marquee is clipped inside its own overflow-hidden track).
- Display type scales with `clamp()`; section gaps use `clamp(4rem, 10vw, 9rem)`.
- Touch targets ≥ 44px. The header keeps brand, language switch and a compact legal link row; no hamburger menu (no JavaScript).

## 8. Motion & Interaction

**Engine:** CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`, named view timelines with `timeline-scope`). Where a browser lacks them, a small progressive script (`src/motion.ts`) adds the same reveals with IntersectionObserver. Without JavaScript and without scroll timelines every element simply shows in place; motion never gates content.

- **Easing:** a spring-like overshoot `cubic-bezier(0.34, 1.36, 0.64, 1)` approximating stiffness 100, damping 20 for entrances; scroll-scrubbed motion is linear to the scroll position by nature.
- **Load cascade (hero):** headline words rise one by one (50ms steps), the inline capsules pop in between them, then the lede, the CTA and the phone. Chat bubbles arrive one after another.
- **Hero exit parallax:** as the hero scrolls away, the copy drifts up and dims slowly while the phone moves faster, so the two layers separate.
- **Reading progress:** a 2px Verdict Green bar at the top edge fills with the page scroll. The header gains a soft shadow and a firmer background after the first 120px.
- **Scroll-scrubbed headings:** section titles and intros reveal word by word, each word going from 15% to full ink as it crosses the viewport.
- **Pinned story ("How it works", ≥ 1024px):** the step texts scroll on the start side while a sticky stage on the end side holds the illustration. Each step's illustration swaps in (fade, rise, slight scale) while that step is in view; the inactive step texts dim to 30%. A three-segment progress rail on the stage fills step by step. Below 1024px, or without scroll timelines, the section falls back to the zig-zag rows with each row revealing on scroll.
- **Sources:** each statement slides in from the end side; its icon tile spins a quarter turn into place.
- **Privacy band:** opens from an inset rounded card to full bleed as it enters; the three facts scale up one after another.
- **Closing line:** the oversized "Have a page in mind?" slides along the reading direction with the scroll; the button pops in after it.
- **Footer wordmark:** rises out of its baseline as the page ends.
- **Hover:** buttons get a light sweep across the fill and the arrow nudges toward the reading end; links' underlines thicken.
- **Perpetual:** typing dots in the phone and the headline DM capsule, shimmer across the verdict stamp, the phone's slow float, a marquee of things you can send (paused on hover).
- Only `transform`, `opacity` and (for the band opening) `clip-path` animate. A subtle grain texture lives on a fixed `body::before` pseudo-element only.
- Under `prefers-reduced-motion: reduce` every animation, transition and scroll effect stops, the pinned story becomes the static zig-zag, and every element shows in its final state.

## 9. Anti-Patterns (Banned)

- No emojis anywhere; icons are inline SVG (Lucide geometry).
- No Inter, no generic serif, no pure black, no neon or outer glows, no gradient text, no second accent.
- No three equal cards, no centred hero, no overlapping elements, no custom cursors.
- No invented numbers or metrics ("10k pages checked", "99% accurate"). The only figures shown are real policy facts (90-day retention).
- No generic names; examples use clearly fictional handles (`@sample.shop`, `@reviewer.page`) and are labelled as examples.
- No AI copy clichés (Elevate, Seamless, Unleash, Next-Gen), no `LABEL // YEAR`, no "scroll to explore".
- No cookie walls, pop-ups, accordions, tabs or "read more" on legal text.
