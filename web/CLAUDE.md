# web/

Public website (landing + legal pages), server-rendered by the backend. See the root `CLAUDE.md` and PRD §7.

**Before designing or building any page, use the `web-ui` skill** (it runs the Taste skill).

## How it renders

- `src/entry-server.tsx` exports `render(url, data)` → `{ html, lang, dir, title, status }`. The backend (`backend/src/routes/landing.ts`) calls it and fills `dist/client/index.html`.
- `src/routes.ts` maps URLs to pages; `src/i18n/fa.ts` and `en.ts` hold all copy (same `Strings` type).
- Hydration (`src/entry-client.tsx`) is optional.

## Rules (Meta App Review depends on these)

- Every page's full text is in the server HTML. No client JS needed to read it; no cookie walls, pop-ups or interstitials.
- Legal pages (privacy, terms, data deletion) never hide text: no accordions, tabs or "read more".
- English pages are complete, not summaries; Persian pages carry the same content.
- Language switcher and footer legal links on every page. Forms are plain HTML (`method="get"`).
- `dir="rtl"` for Persian, mobile-first, contrast ≥ 4.5:1, animations respect `prefers-reduced-motion`.
- Tokens only (`bg-surface`, `text-ink`, ...), shared with admin; Vazirmatn font.

## Commands

`npm run dev:web`, `npm run build -w web` (client + SSR builds).

## graphify

Graph: `web/graphify-out/`. Rebuild after changes with `graphify update web` from the repo root.
