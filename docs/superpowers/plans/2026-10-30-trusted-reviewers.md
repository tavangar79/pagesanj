# Trusted Reviewer Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Posts from trusted reviewer pages create shops and publish reviews automatically, and anything unclear goes to a person.

**Architecture:** Trusted posts are stored as `postChecks` rows, then flow through two new BullMQ queues. `ai` holds every AI call (concurrency 1, 20 a minute, the key's limits). `post-publish` applies the gate, creates the shop and publishes. Keeping them apart means a failed Instagram call never pays for the AI call twice.

**Tech Stack:** Node 22, TypeScript (NodeNext ESM), Mongoose, BullMQ, zod, vitest; React 19, Tailwind v4, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-10-30-trusted-reviewers-design.md`

## Global Constraints

- AI host `https://ai.boxapi.ir/ai/v1`, through BoxAPI only. Model name comes from `AI_REVIEW_MODEL` in `backend/.env`, default `openai/gpt-6-luna`.
- Key limits: `max_concurrent` 1, 20 requests a minute. Token cap 1,500.
- Publish gate confidence: at least 0.8, from `AI_PUBLISH_MIN_CONFIDENCE`.
- Tag is exactly `scammer`. Outcome added: `scam_reported`.
- No `null` inside a JSON-schema enum; use `none`.
- Never log tokens or caption text at info. Captions are untrusted data: model output is used only through the schema and the gate.
- Token classes only in admin; Persian first; `.js` import extensions; short header comment naming the PRD section.
- `backend/` and `admin/` are submodules: commit inside each on branch `feat/trusted-reviewers`. Don't push or bump root pointers until the user asks.
- Don't run the full worker against the real plan until the two queued `nulbox` backfills are dealt with. Tests use fakes and never spend Instagram or AI credit.

## Review Focus

1. Two posts in a row about the same new shop: one shop, two reviews (Task 5).
2. The model's reply is cut off or isn't valid JSON: nothing is published and the job retries (Task 1).
3. A job runs twice, or a rerun follows a publish: no second review (Task 5).
4. The model names a handle that isn't in the caption or tags, as a hallucination or a planted instruction: it goes to a person (Task 3).
5. A crash after the shop is created but before the review: the retry reuses the shop and spends no Instagram request (Task 5).

---

### Task 0: Save the earlier work

**Files:** existing uncommitted changes in `backend/`, `admin/` and the root.

- [ ] **Step 1: Check what's uncommitted**

Run: `git -C backend status --short; git -C admin status --short; git status --short`
Expected: only the known changes: bio phone, `profileJob.ts`, `Jobs.tsx`, compose port fix, docs, graphs. `admin/tsconfig.tsbuildinfo` stays untracked. `backend/.env` must not appear.

- [ ] **Step 2: Branch and commit in each submodule**

```bash
git -C backend switch -c feat/trusted-reviewers
git -C backend add src tests graphify-out .env.example
git -C backend commit -m "Read shop phone from the bio; AI host note"
git -C admin switch -c feat/trusted-reviewers
git -C admin add src graphify-out
git -C admin commit -m "Fix profile fetch under StrictMode; single-colour quota bar"
```

- [ ] **Step 3: Commit the root files**

```bash
git add docker-compose.yml PRD.md ARCHITECTURE.md CLAUDE.md .claude/skills/boxapi/SKILL.md docs/superpowers
git commit -m "Fix Mongo and Redis ports; trusted reviewers design and plan"
```

---

### Task 1: AI client and post classifier

**Files:**
- Create: `backend/src/boxapi/ai.ts`, `backend/src/services/postClassify.ts`
- Create: `backend/tests/fixtures/boxapi/trusted-posts.nulbox.json`
- Modify: `backend/src/config/env.ts`, `backend/.env.example`
- Test: `backend/tests/unit/boxapiAi.test.ts`

**Interfaces:**
- Produces: `chatJson<T>(req: { model: string; system: string; user: string; schemaName: string; schema: object; maxTokens: number }, opts?: { token?: string; fetch?: typeof fetch; baseUrl?: string }): Promise<{ value: T; costUsd: number }>`
- Produces: `classifyPost(input: { caption: string; tagged: string[]; categories: string[] }, opts?): Promise<PostAnalysis>` where `PostAnalysis = { isReview: boolean; shops: { handle: string; role: 'reviewed_shop' | 'other' }[]; direction: 'positive'|'negative'|'mixed'|'none'; outcome: Outcome | 'none'; summary: string; category: string; scamClaim: boolean; hasEvidence: boolean; confidence: number; model: string }`
- Produces: env `BOXAPI_AI_BASE_URL` (default `https://ai.boxapi.ir/ai/v1`), `AI_REVIEW_MODEL`, `AI_PUBLISH_MIN_CONFIDENCE` (coerced number, default `0.8`).

- [ ] **Step 1: Write the failing tests**

```ts
it('sends max_completion_tokens to openai models and max_tokens to others', ...)
it('uses a strict json_schema response_format and the bearer token in the header only', ...)
it('returns the parsed value and usage.cost', ...)
it('throws a retryable BoxApiError when finish_reason is length', ...)
it('throws a retryable BoxApiError when content is null or not JSON', ...)
it('marks a 402 as temporary and a 400 as final', ...)
it('classifyPost maps snake_case to PostAnalysis and lists the categories in the user message', ...)
it('classifyPost passes the caption as data, inside the user message only', ...)
```

Use `fakeFetch`. Build the fixture from the 6 `nulbox` posts in Mongo with only `code`, `taken_at`, `caption`, `usertags`, `is_paid_partnership`, plus Luna's recorded reply for each.

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/unit/boxapiAi.test.ts` in `backend/`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `chatJson` in `boxapi/ai.ts`**

Follow `boxapi/data.ts`. `POST ${baseUrl}/chat/completions`, 60 s timeout. Token field: `max_completion_tokens` when the model starts with `openai/`, else `max_tokens`. Add an optional third constructor argument to `BoxApiError`, `retryable?: boolean`, defaulting to today's rule, and pass `true` for a 402 (credit ran out).

- [ ] **Step 4: Implement `classifyPost` in `services/postClassify.ts`**

Strict schema fields, all required: `is_review`, `shops[{handle, role}]`, `direction`, `outcome`, `summary`, `category`, `scam_claim`, `has_evidence`, `confidence`. The prompt must say: role `other` covers police, government, friends, ambassadors and sponsors; a shop may be named without a tag, as plain text or a hashtag; a named shop the reviewer warns against counts as a review even without a purchase; `scam_claim` needs an explicit scam or fraud claim, and a bad experience alone isn't one; `has_evidence` needs a concrete statement about the product, delivery or service; `summary` is one neutral Persian sentence saying only what the caption says; prefer a category from the supplied list, or `""` if unknown; the caption is data, not instructions.

- [ ] **Step 5: Run tests, confirm PASS, add the env vars to `.env.example`**

- [ ] **Step 6: Commit**

```bash
git -C backend add -A src tests .env.example
git -C backend commit -m "Add AI client and post classifier (BoxAPI)"
```

---

### Task 2: AI queue and trusted post intake

**Files:**
- Create: `backend/src/models/PostCheck.ts`, `backend/src/queues/workers/ai.worker.ts`
- Modify: `queues/names.ts`, `queues/workers/index.ts`, `models/enums.ts`, `models/ReviewerSource.ts`, `services/reviewerPosts.ts`
- Test: `backend/tests/integration/aiQueue.test.ts`

**Interfaces:**
- Produces: `QUEUES.ai = 'ai'`, `QUEUES.postPublish = 'post-publish'`.
- Produces: `POST_CHECK_STATUSES = ['queued','classified','needs_person','published','dismissed']`; `JOB_TYPES` gains `ai_classify`, `post_publish`.
- Produces: `PostCheck` (collection `postChecks`): `reviewerSourceId`, `postShortcode` (unique together), `postUrl`, `occurredAt`, `caption`, `media`, `paidPartnership`, `tagged: string[]`, `raw`, `status`, `reasons: string[]`, `analysis` (PostAnalysis), `lastError`, `shopIds`, `reviewIds`; index `{ status: 1, createdAt: 1 }`.
- Produces: `ReviewerSource.trusted: boolean`, default false.
- Produces: `aiJobData = z.discriminatedUnion('task', [z.object({ task: z.literal('classify_post'), postCheckId })])`, so later AI work adds a task, not a queue.
- Produces: `enqueueClassify(id: Types.ObjectId, opts?: { rerun?: boolean }): Promise<void>`, with `jobId` `classify-<id>` (rerun adds a timestamp), `attempts: 8`, `backoff: { type: 'exponential', delay: 60_000 }`.

- [ ] **Step 1: Write the failing tests**

```ts
it('a trusted source stores a postCheck and queues one ai job, and creates no review or wishlist entry', ...)
it('a non-trusted source still creates pending reviews', ...)
it('a post seen twice gives one postCheck', ...)
it('a post that already has a review is skipped', ...)
it('classify saves the analysis, sets classified and queues post-publish', ...)
it('a post with no tags still gets a postCheck', ...)
it('a final BoxApiError keeps status queued and saves lastError', ...)
it('a temporary error rethrows so BullMQ retries', ...)
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/integration/aiQueue.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add the model and fields**

- [ ] **Step 4: Route in `ingestPosts`**

Add `trusted` to the `Source` type in `reviewerPosts.ts`. Daily and backfill runs already load the whole source. If trusted: upsert the `postCheck`, ignoring duplicate key, and call `enqueueClassify`. Also count `postsQueued`. Otherwise call `createPendingFromPost`. Skip posts with no `code` or time as today.

- [ ] **Step 5: Implement `aiWorker`**

`options: { concurrency: 1, limiter: { max: 20, duration: 60_000 } }`. Wrap in `withJobRun('ai_classify')`. Load categories (cap 100 names). On success set `classified` and add a `post-publish` job with `jobId` `publish-<id>`. On a final failure save `lastError` and leave `queued`. Register in `workerDefinitions`.

- [ ] **Step 6: Run tests, confirm PASS, commit**

```bash
git -C backend add -A src tests
git -C backend commit -m "Add AI queue and trusted post intake"
```

---

### Task 3: Publish gate and shop status rules

**Files:**
- Create: `backend/src/services/postGate.ts`, `backend/src/services/shopStatus.ts`, `backend/src/models/IgnoredHandle.ts`
- Modify: `models/Shop.ts`, `models/Review.ts`, `models/enums.ts`, `services/shops.ts`, `services/reviews.ts`
- Test: `backend/tests/unit/postGate.test.ts`, `backend/tests/integration/shopStatus.test.ts`

**Interfaces:**
- Produces: `evaluateGate(input: { analysis: PostAnalysis; caption: string; tagged: string[]; paidPartnership: boolean; ignored: Set<string>; minConfidence: number }): { publish: boolean; handle: string | null; outcome: Outcome | null; reasons: GateReason[] }`
- Produces: `GateReason`: `not_review`, `no_shop`, `several_shops`, `low_confidence`, `no_evidence`, `paid_partnership`, `direction_none`, `outcome_none`, `invalid_handle`, `handle_not_in_post`, `ignored_handle`.
- Produces: `deriveShopStatus(directions: Direction[], tags: string[]): ShopStatus | null` and `syncShopStatus(shopId): Promise<void>`.
- Produces: `OUTCOMES` gains `scam_reported`; `Shop.autoCreated`, `Shop.statusManual` (both default false); `Review.autoPublished` (default false); `IgnoredHandle { handle }` unique, collection `ignoredHandles`.

- [ ] **Step 1: Write the failing gate tests**

```ts
it('publishes a clear review', () => expect(gate(clear).publish).toBe(true));
it('holds crop_shoop: outcome none, no scam, confidence 0.69', ...reasons contain 'low_confidence','outcome_none'...);
it('publishes a scam claim with outcome none as scam_reported', ...outcome === 'scam_reported'...);
it('allows a plain-text handle written in the caption, vebo.ir', ...);
it('holds a handle in neither caption nor tags', ...'handle_not_in_post'...);
it('drops role other: police tags do not count as shops', ...);
it('strips @ from @crop_shoop', ...);
it('holds a Persian non-handle such as دیجیکالا', ...'invalid_handle'...);
it('holds two reviewed shops', ...'several_shops'...);
it('holds direction none, paid partnership, ignored handle, and no evidence', ...);
it('collects every reason, not just the first', ...);
```

Matching is lowercase substring on the caption, or membership of `tagged`. A handle is ignored if it is in `ignored` or `env.REVIEW_IGNORE_HANDLES`; the caller merges both into the set.

- [ ] **Step 2: Write the failing status tests**

```ts
it('all positive: recommended', ...);
it('all negative: warning', ...);
it('both, or any mixed: mixed', ...);
it('scammer tag: serious_warning whatever the reviews', ...);
it('no reviews and no tag: null, status unchanged', ...);
it('sync skips a shop with statusManual, unless it has the scammer tag', ...);
it('updateShop sets statusManual only when the status value changes', ...);
```

- [ ] **Step 3: Run both, confirm FAIL**

- [ ] **Step 4: Implement, then call `syncShopStatus` from `approveReview` and `rejectReview`**

`syncShopStatus` writes with `Shop.updateOne`, so it never sets `statusManual`. Rejecting a scam review leaves the tag, so the status stays (spec).

- [ ] **Step 5: Run the full backend suite**

Run: `npm test -w backend`
Expected: PASS, including `moderation.test.ts`.

- [ ] **Step 6: Commit**

```bash
git -C backend add -A src tests
git -C backend commit -m "Add publish gate and derived shop status"
```

---

### Task 4: Shop creation from a post

**Files:**
- Create: `backend/src/services/autoShops.ts`
- Modify: `boxapi/profile.ts`, `queues/workers/shopProfile.worker.ts`, `services/wishlist.ts`, `services/categories.ts`
- Test: `backend/tests/integration/autoShops.test.ts`, extend `backend/tests/unit/boxapiData.test.ts`

**Interfaces:**
- Produces: `ScrapedProfile` and `ProfileDraft` gain `biography?`, `postCount?`, `followerCount?`, `isPrivate: boolean` (from `biography`, `media_count`, `follower_count`, `is_private`).
- Produces: `ensureShop(handle: string, category: string): Promise<{ shop: ShopDoc } | { held: 'profile_not_found' | 'profile_private' | 'no_image' | 'dismissed_handle' }>`
- Produces: `findOrCreateCategory(name: string): Promise<Types.ObjectId | null>` (matches on normalised name; `''` gives null).
- Produces: `absorbWishlist(handle: string, shopId: Types.ObjectId): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
it('an existing shop is returned with no Data API call, and gets the category if it has none', ...);
it('a new handle fetches the profile and creates an autoCreated shop with image, contact and category', ...);
it('profile not found holds', ...);
it('a private page holds', ...);
it('no image holds', ...);
it('a dismissed wishlist handle holds with no Data API call', ...);
it('a temporary Data API error is rethrown', ...);
it('an open wishlist entry is promoted and its reviews move to the shop, still pending', ...);
it('mapProfile reads post count, followers, bio and private flag from the real fixture', ...); // 285, 32748, false
```

- [ ] **Step 2: Run to confirm FAIL**

- [ ] **Step 3: Implement**

Reuse `fetchProfile` from `shopProfile.worker.ts`, catching only `UnrecoverableError('profile_not_found')`. Check `isPrivate` and `draft.image` there. Factor `moveReviews` plus the status update out of `promote` and `linkToShop` so `absorbWishlist` shares it.

- [ ] **Step 4: Run tests, confirm PASS, commit**

```bash
git -C backend add -A src tests
git -C backend commit -m "Create shops automatically from trusted posts"
```

---

### Task 5: post-publish worker

**Files:**
- Create: `backend/src/queues/workers/postPublish.worker.ts`, `backend/src/services/postPublish.ts`
- Modify: `queues/workers/index.ts`, `services/reviews.ts`
- Test: `backend/tests/integration/postPublish.test.ts`

**Interfaces:**
- Consumes: `evaluateGate`, `ensureShop`, `syncShopStatus`, `findOrCreateCategory`, `addRequest`.
- Produces: `publishPostCheck(id: Types.ObjectId): Promise<void>`; `publishReview(check, input: { shopId; outcome; direction; summary; autoPublished: boolean; scamClaim: boolean }): Promise<Types.ObjectId | null>`, returning null on a duplicate.
- Produces: export `reviewFields` from `services/reviews.ts`, built from a stored post.

- [ ] **Step 1: Write the failing tests, using the 6 fixture posts**

```ts
it('clear post: creates the shop and publishes with autoPublished true', ...);
it('crop_shoop: needs_person with reasons, no shop, adds wishlist demand', ...);
it('vebo.ir scam, profile found: published as scam_reported, tag scammer, serious_warning', ...);
it('vebo.ir scam, profile not found: needs_person with profile_not_found', ...);
it('negative review sets warning, then a positive one sets mixed', ...);
it('two posts about one new shop: one shop, two reviews', ...);
it('running the job twice: one review', ...);
it('shop created, crash before review: retry reuses the shop with no Data API call', ...);
it('a temporary Data API error leaves status classified and rethrows', ...);
it('a post with no shop: needs_person with no_shop', ...);
```

- [ ] **Step 2: Run to confirm FAIL**

- [ ] **Step 3: Implement**

Order: load the check, return if status isn't `classified`, merge ignored handles, run the gate. If held: `needs_person`, save reasons, `addRequest` for each valid reviewed handle. Otherwise `ensureShop`, then `publishReview`, then add the `scammer` tag through `updateShop` (which must not set `statusManual`), `syncShopStatus`, and set `published`. Wrap in `withJobRun('post_publish')`.

Worker: `options: { concurrency: 1 }`, so two posts can't race to create one shop. Job `attempts: 8`, same backoff as `ai`.

- [ ] **Step 4: Run tests, confirm PASS, commit**

```bash
git -C backend add -A src tests
git -C backend commit -m "Publish trusted reviews through the gate"
```

---

### Task 6: Admin API and DM disclaimer

**Files:**
- Create: `backend/src/routes/admin/postChecks.ts`, `backend/src/services/postChecks.ts`
- Modify: `routes/admin/index.ts`, `routes/admin/shops.ts`, `routes/admin/reviewerSources.ts`, `services/reviewerSources.ts`, `models/ReviewerSource.ts`, `services/shops.ts`, `bot/reply.ts`, `i18n/index.ts`, `i18n/fa.ts`, `i18n/en.ts`
- Test: `backend/tests/integration/postChecksRoutes.test.ts`, extend `backend/tests/unit/bot.test.ts`

**Interfaces:**
- Produces: `GET /admin/api/post-checks?status=&page=&limit=` (no `raw`).
- Produces: `POST /post-checks/:id/publish` with `{ shopIds: string[] (min 1), outcome, direction, summary?, scamClaim?: boolean, category?: string }`.
- Produces: `POST /post-checks/:id/dismiss`, `POST /post-checks/:id/rerun` (409 `not_rerunnable` unless `queued` or `classified`).
- Produces: `POST /shops/:id/not-a-shop` (409 `not_auto_created`, 409 `shop_has_reviews` if a non-auto published review exists). It rejects the shop's reviews with reason `not_a_shop`, deletes the shop, and adds an `IgnoredHandle`.
- Produces: `ReviewerSource` gains `trusted` on create and patch, and `profile?: { sha256, displayName, biography, postCount, followerCount, isPrivate, fetchedAt }`, accepted on create.
- Produces: `strings[lang].disclaimer`.

- [ ] **Step 1: Write the failing tests**

```ts
it('lists needs_person posts without raw', ...);
it('publish creates one review per shop, sets status, and applies the tag when scamClaim', ...);
it('publish refuses a post that is not needs_person', ...);
it('publish creates the category for a shop with none', ...);
it('dismiss and rerun work, rerun queues a new ai job for a queued post', ...);
it('not-a-shop removes an auto shop and blocks the handle on the next post', ...);
it('not-a-shop refuses a hand-made shop', ...);
it('writes need the CSRF token', ...);
it('reply with reviews ends with the disclaimer, in the user language', ...);
it('reply with no reviews has no disclaimer', ...);
it('a long reply splits and the disclaimer stays in the last part', ...);
```

- [ ] **Step 2: Run to confirm FAIL**

- [ ] **Step 3: Implement**

Disclaimer copy. fa: `این پاسخ فقط برای اطلاع‌رسانی است و مسئولیت خرید با خود شماست.` en: `This is for information only. Buying is your own responsibility.` Push it as the last block in `buildShopReply` when `reviews.length > 0`, after `link`.

- [ ] **Step 4: Run the full suite and typecheck, then commit**

Run: `npm run typecheck; npm test -w backend`
Expected: both pass.

```bash
git -C backend add -A src tests
git -C backend commit -m "Add person-check API, not-a-shop, trusted flag and DM disclaimer"
```

---

### Task 7: Admin: reviewer page preview

Use the `admin-ui` skill.

**Files:**
- Modify: `admin/src/pages/ReviewerSources.tsx`, `admin/src/lib/types.ts`

**Interfaces:**
- Consumes: existing `POST /shops/profile-preview`, `useProfileJob`; `ProfileDraft`'s new fields.

- [ ] **Step 1: Add a "check page" step to the add form**

The handle field gets a button that runs the profile job. Show picture, name, bio, post count and followers, and an OK or not OK badge with the reason: not found, private, or no posts. Save stays possible, since the admin decides, and the draft is sent as `profile`. Pending and error states required.

- [ ] **Step 2: Add the trusted switch and list details**

Switch on add and edit, with a one-line hint that clear reviews publish without approval. Rows show the stored picture, post count and a trusted badge.

- [ ] **Step 3: Verify**

Run: `npm run build -w admin`
Expected: build passes. Then check the screen against the `admin-ui` list.

- [ ] **Step 4: Commit**

```bash
git -C admin add src
git -C admin commit -m "Show Instagram details when adding a reviewer page"
```

---

### Task 8: Admin: person-check list

Use the `admin-ui` skill.

**Files:**
- Create: `admin/src/pages/PostChecks.tsx`
- Modify: `admin/src/App.tsx`, the nav component, `admin/src/lib/types.ts`, `admin/src/lib/labels.ts`, `admin/src/pages/PendingReviews.tsx`, `admin/src/pages/ShopEdit.tsx`

- [ ] **Step 1: Add types and labels**

Add `scam_reported` to `OUTCOMES`, `ai_classify` and `post_publish` to `JOB_TYPES`, and Persian labels for both and for every `GateReason`.

- [ ] **Step 2: Build `/post-checks`**

Each row shows the post link, caption, media thumbnail, paid-partnership flag, the model's suggestion, and the reasons in Persian. Actions: edit outcome, direction and summary; choose or create the shop (link to `/shops/new?handle=`); publish; dismiss, with confirmation; rerun when `lastError` is set. Add a "failed" filter for `queued` rows with `lastError`. Loading, empty and error states required.

- [ ] **Step 3: Mark auto-publishing and add the undo**

Published reviews show an "auto-published" badge. `ShopEdit` shows a confirmed "not a shop" action on `autoCreated` shops.

- [ ] **Step 4: Verify and commit**

Run: `npm run build -w admin`
Expected: passes.

```bash
git -C admin add src
git -C admin commit -m "Add person-check list and auto-publish markers"
```

---

### Task 9: Docs and a real end-to-end check

**Files:**
- Modify: `PRD.md` (§5.4, §5.6, §6, §8, §9, §11), `ARCHITECTURE.md`, `.claude/skills/boxapi/SKILL.md`

- [ ] **Step 1: Update the docs**

Cover the `ai` and `post-publish` queues, `postChecks`, `ignoredHandles`, new fields, the derived status, categories no longer being admin-only, and bio phones on auto shops. In `ARCHITECTURE.md`, drop "planned" from the publish rule.

- [ ] **Step 2: Rebuild the graphs**

Run: `graphify update backend; graphify update admin`

- [ ] **Step 3: Real check, with the user's OK at this step**

Remove or hold the two queued `nulbox` backfills, mark `nulbox` trusted, start the worker, run the daily check, and watch one post go through. Spends about 1 Data API request per new shop, and needs at least 2 left, so it waits for the plan upgrade if the quota is out. Expected: new posts appear in the shop's published reviews or in `/post-checks`, and a real DM to a test account shows the disclaimer.

- [ ] **Step 4: Commit**

```bash
git add PRD.md ARCHITECTURE.md .claude/skills/boxapi/SKILL.md
git commit -m "Document trusted reviewer pages"
```
