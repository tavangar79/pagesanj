---
name: admin-ui
description: Use when designing, building or reviewing any screen, component or layout in admin/ (the pagesanj admin panel) - pending reviews, wishlist, shops, categories, reviewer sources, jobs, login. Runs the ui-ux-pro-max skill with this project's constraints.
---

# Admin UI (pagesanj)

## Steps

1. **Read the spec.** PRD §9 (layout, accessibility, login) and the §9.2 entry for the screen. Check the data fields in PRD §8.
2. **Run the `ui-ux-pro-max:ui-ux-pro-max` skill** (Skill tool) to plan the screen: layout, states, components, interaction. Give it these constraints:
   - Internal admin tool, Persian (RTL) first, data-dense tables for lists and cards for details.
   - Start from trust-me's design system: `design-system/trust-me/MASTER.md` (semantic tokens, Vazirmatn, light and dark). Do not invent a new palette.
   - Components come from shadcn/ui (Radix), themed only through tokens.
3. **Build** in `admin/src/pages/<Screen>.tsx`, shared pieces in `admin/src/components/`. Add shadcn components with `npx shadcn@latest add <name>` inside `admin/`.
4. **Check the screen against ui-ux-pro-max's review guidance** and this list before calling it done:
   - [ ] Token classes only (`bg-surface`, `text-ink`, `border-border`, ...); no raw palette colours.
   - [ ] `dir="rtl"`; handles, URLs, emails, phones in `dir="ltr"`; logical spacing (`ms-`/`me-`).
   - [ ] Empty, loading and error states for every list.
   - [ ] Every action shows a pending state; reject, dismiss and delete ask for confirmation.
   - [ ] Keyboard-usable, visible focus ring, label on every input, contrast ≥ 4.5:1 in both themes.
   - [ ] API calls via `admin/src/lib/api.ts`.
   - [ ] Paid-partnership posts are visibly flagged; outcome and direction are required before approve (PRD §6.3).
5. `npm run build -w admin` passes, then `graphify update admin`.
