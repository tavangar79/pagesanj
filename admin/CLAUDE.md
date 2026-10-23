# admin/

Admin panel, served by the backend at `/admin`; JSON API at `/admin/api/*`. See the root `CLAUDE.md` and PRD §9.

**Before designing or building any screen or component, use the `admin-ui` skill** (it runs ui-ux-pro-max).

## Rules

- Vite + React 19 + TypeScript, Tailwind v4, shadcn/ui components in `src/components/ui` (add them with the shadcn CLI, then theme through tokens only).
- Tokens live in `src/index.css` (values from `../design-system/trust-me/MASTER.md`). Use `bg-surface`, `text-ink`, etc.; never raw palette colours.
- Persian first: `dir="rtl"`, Persian labels; handles, URLs, emails and phones `dir="ltr"`. Use logical properties (`ms-`, `me-`, `border-e`), not `left`/`right`.
- All API calls go through `src/lib/api.ts` (sends the CSRF token on writes).
- Every list has empty, loading and error states; every action button shows a pending state; destructive actions confirm.
- Keyboard-usable, visible focus rings, labelled inputs, contrast ≥ 4.5:1 in light and dark.

## Commands

`npm run dev:admin` (proxies `/admin/api` to the backend on :3000), `npm run build -w admin`.

## graphify

Graph: `admin/graphify-out/`. Rebuild after changes with `graphify update admin` from the repo root.
