---
name: web-ui
description: Use when designing, building or reviewing any page or component in web/ (the pagesanj public website) - home, privacy, terms, data deletion, deletion status, layout, header, footer. Runs the Taste skill and enforces Meta's legal-page rules.
---

# Website UI (pagesanj)

## Steps

1. **Read the spec.** PRD §7 (design rules, pages, Meta checklist §7.3). For legal pages, list every item the checklist requires the page to say.
2. **Run the `stitch-utilities:taste-design` skill** (Skill tool) for the look, layout, typography and copy rhythm, so the site reads as a real, trustworthy product and not a template. Give it these constraints:
   - Keep trust-me's brand: tokens from `design-system/trust-me/MASTER.md`, Vazirmatn, light and dark.
   - Persian (RTL) and English versions of every page, mobile-first.
   - Taste may shape legal pages (typography, spacing, header, footer) but **must not hide, collapse, shorten or move legal text behind interactions**.
3. **Build** pages in `web/src/pages/`, shared pieces in `web/src/components/`, all copy in `web/src/i18n/fa.ts` and `en.ts` (never hard-coded in components).
4. **Check before calling it done:**
   - [ ] `npm run build -w web` passes, then render the page from `web/dist/server/entry-server.js` and confirm the full text is in the HTML.
   - [ ] Works with JavaScript off: links and `method="get"` forms only; no cookie walls, pop-ups or interstitials.
   - [ ] No accordions, tabs or "read more" on legal text; English is complete, Persian carries the same content.
   - [ ] Language switcher and footer links to privacy, terms and data deletion.
   - [ ] `dir="rtl"` for fa, contrast ≥ 4.5:1, animations respect `prefers-reduced-motion`, token classes only.
5. `graphify update web`.
