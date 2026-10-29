---
name: backend-module
description: Use when adding or changing anything in backend/ - a Mongoose model, Express route, BullMQ queue or worker, scheduler, bot logic, or admin JSON endpoint in the pagesanj project. For Instagram or AI calls, also use the boxapi skill.
---

# Backend module (pagesanj)

## Steps

1. **Read the spec section** (PRD §5 bot, §6 reviewer check, §7.3 legal pages, §8 data model, §9 admin, §10 BoxAPI, §11 stack, §12 security). Instagram and AI calls go through BoxAPI: follow the `boxapi` skill. If the code must differ from the PRD, update the PRD too.
2. **Put it in the right place:**
   - Model → `backend/src/models/<Name>.ts`, fields, enums and indexes exactly as PRD §8 (handles stored normalised; `timestamps: true`).
   - Bot logic → `backend/src/bot/`, pure functions with dependencies passed in (no Express/BullMQ/Graph imports).
   - Shared domain logic → `backend/src/services/`.
   - Queue → name in `src/queues/names.ts`, instance in `src/queues/queues.ts`, worker in `src/queues/workers/<name>.worker.ts`, started from `src/worker.ts`. Use `jobLogger(queue, job.id)`. Retries and rate limits as PRD §5.1.
   - Route → `src/routes/`, validate input with zod, admin writes check session + CSRF.
   - New env var → `src/config/env.ts` and `.env.example`.
3. **Safety checks:**
   - [ ] No secret or message text logged at info; tokens encrypted at rest (`encryptField`).
   - [ ] Webhook HMACs verified with constant-time compare.
   - [ ] Idempotent: DM jobs keyed by `mid`, reviews unique per (target, shortcode).
   - [ ] Background jobs that call BoxAPI write a `jobRuns` entry (no cost or budget tracking).
4. **Test** with vitest in `backend/tests/` (fixtures from real payloads in `tests/fixtures/`). `npm run typecheck` and `npm test` pass.
5. `graphify update backend`.
