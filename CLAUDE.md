# pagesanj

Instagram DM lookup bot, daily reviewer-page check (Apify) and a bilingual (fa/en) public website, with a small admin panel. The spec is `PRD.md`; read the relevant section before building a feature and keep the PRD in sync when a decision changes.

## Layout

npm workspaces, three folders:

| Folder | What | Stack |
|---|---|---|
| `backend/` | Express web process + BullMQ worker process | Node 22+, TypeScript (NodeNext ESM), Mongoose, BullMQ/Redis, zod, pino, vitest |
| `admin/` | Admin panel at `/admin` (built files served by backend) | Vite, React 19, Tailwind v4, shadcn/ui, react-router |
| `web/` | Public website, server-rendered by backend | Vite (client + SSR build), React 19, Tailwind v4 |

`design-system/pagesanj/MASTER.md` holds the admin design tokens. The public website has its own design system in `web/DESIGN.md` (Taste skill).

Each folder has its own `CLAUDE.md` with folder-specific rules.

Each folder is a **git submodule** with its own repo: `backend/` → `tavangar79/payjoor-backend`, `admin/` → `tavangar79/payjoor-admin`, `web/` → `tavangar79/payjoor-web` (branch `main`). Clone with `git clone --recurse-submodules`, or run `git submodule update --init` after a plain clone. Commit and push inside the submodule first, then commit the updated submodule pointer in this repo.

## Commands (from the repo root)

- `npm install` installs all workspaces.
- `npm run dev` runs the backend, `npm run dev:worker` the worker, and `npm run dev:admin` / `npm run dev:web` the frontends.
- `npm run build` builds admin, web, then backend.
- `npm run typecheck` and `npm test` check the backend.
- `npm run admin:import -- <username>` / `npm run admin:create -- <username>`.

## Rules that apply everywhere

- **Never publish without an admin's approval**, never use unofficial Instagram APIs or password logins, and always reply about the post's *author*, not tagged accounts (PRD §3, §5.2).
- **Secrets** live in `backend/.env` (template: `backend/.env.example`) or encrypted in MongoDB. Never commit them or log them.
- **Persian first:** `dir="rtl"` and Persian copy by default. Handles, URLs, emails and phone numbers are shown `dir="ltr"`.
- **Design tokens only:** components use semantic token classes (`bg-surface`, `text-ink`, ...), never raw Tailwind palette colours.
- Match the surrounding code: short header comment naming the PRD section, small modules, `.js` import extensions in the backend.

## Skills and agents

- `admin-ui` skill: any admin screen or component. Uses the **ui-ux-pro-max** skill.
- `web-ui` skill: any public website page. Uses the **Taste** (`taste-design`) skill and the Meta legal-page rules.
- `backend-module` skill: adding a model, route, queue/worker or Apify/Meta integration.
- Agents: `frontend-developer` (admin/ and web/) and `backend-developer` (backend/).

## graphify

Each of `admin/`, `web/` and `backend/` has its own knowledge graph in `<folder>/graphify-out/` (`GRAPH_REPORT.md`, `graph.json`, `graph.html`).

- Before answering architecture or "where is X / what calls Y" questions, read the folder's `graphify-out/GRAPH_REPORT.md`, or run `graphify query "<question>" --graph <folder>/graphify-out/graph.json`.
- After changing code in a folder, rebuild its graph: `graphify update <folder>` (AST only, no LLM needed).
