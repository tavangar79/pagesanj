# PRD: pagesanj Instagram Bot (v1)

- **Status:** Draft for build
- **Date:** 2026-10-22
- **Owner:** Mohamad Tavangar
- **Repo:** new, standalone repo (not this one)

---

## 1. Summary

A standalone backend service, built with Node.js, Express and MongoDB, that does three things:

1. **DM lookup bot.** Someone DMs pagesanj's Instagram account a shop's profile or post. The bot replies with what we know about that shop: its review posts, its tags and a link. If we know nothing, the shop goes on a review wishlist.
2. **Daily reviewer-page check.** Once a day, BoxAPI's Instagram Data API pulls new posts from reviewer pages we follow (e.g. `@sadegh.delicious`). Each new post becomes a **pending review** on the shop the post tags.
3. **Bilingual landing page (EN/FA).** A public site with the pages Meta needs to approve the app (privacy policy, terms, data deletion).

Admins approve the pending reviews (clear reviews from trusted reviewer pages publish on their own) and work through the wishlist in a small, password-protected admin panel with its own JSON API on the backend.

The full public website (shop pages, search) is **out of scope**. It comes a few months later and will read the same data.

## 2. Why

- People already ask on Instagram, in DMs, whether a page can be trusted. Answering inside Instagram meets them where they are.
- Reviewer pages such as `@sadegh.delicious` post reviews of businesses every day. Copying them in by hand doesn't scale.
- Starting with the bot alone keeps the first build small and gets Meta's approval process started early. The website can follow once the data has grown.

## 3. Goals, non-goals, anti-goals

**Goals**
- Reply automatically to a DM about a profile or post, in seconds.
- Never lose a request for a page we don't know. Every one of them ends up on the wishlist, with a count of how many times it was asked for.
- Turn every new post from followed reviewer pages into a pending review without anyone typing it in.
- Reach Instagram only through **BoxAPI** (boxapi.ir, §10): its official DM & Comment API for DMs, its Instagram Data API for public posts and profiles.

**Non-goals (v1)**
- The public website, search, and shop pages.
- User accounts, or reviews submitted by users.
- Messaging people first (outbound DMs), broadcasts or marketing messages.
- Automatically deciding whether a review is positive or negative, except for trusted reviewer pages (§6.4). For every other page an admin decides.
- Comments and story mentions, even though Meta's webhooks offer them.

**Anti-goals (a failure even if it technically works)**
- Publishing anything without an admin's approval, except clear reviews from a reviewer page an admin has marked as trusted. Unclear posts from those pages still go to a person.
- Logging into Instagram with pagesanj's username and password, or calling Instagram from pagesanj's account any way other than BoxAPI's official DM API, which risks a ban on pagesanj's account. (BoxAPI's Data API reads public data without touching our account, so it's allowed.)
- Replying with a wrong shop, for example the shop tagged in a post instead of the post's author (see §5.2).
- Leaking secrets such as tokens, or storing more personal data about the people who DM us than the bot needs.

## 4. Users

| User | Needs |
|---|---|
| **Person asking** (Instagram user, mostly Persian-speaking) | Shares a page or post in a DM and gets a quick, clear answer in Persian. |
| **Admin** (founder or team) | Chooses which reviewer pages to follow, approves pending reviews, works the wishlist, manages shops and tags. |
| **Meta reviewer** | Sees a real business with a landing page, privacy policy and data-deletion process, and a demo of the bot replying. |

## 5. Feature 1: DM lookup bot

### 5.1 Flow

1. A user sends pagesanj's Instagram Business account a DM.
2. BoxAPI forwards the DM to `POST /webhooks/boxapi`. We check the `X-BoxApi-Signature` HMAC over `{X-BoxApi-Timestamp}.{raw body}` (using `BOXAPI_WEBHOOK_SECRET`, timestamp within 300 s), add one job per message to the **BullMQ** queue `dm-inbound` with `jobId = mid` (so BoxAPI's retries, 3 × 60 s, don't create duplicate jobs), and return `200` right away. A worker processes steps 3–8.
   - **Retries:** 3 attempts with exponential backoff for temporary failures (BoxAPI 5xx or timeouts). After the last attempt, the job stays in the failed set and is logged in `dmEvents.error`.
   - **Slow step on its own queue:** the post-owner lookup (§5.3) runs on a separate `post-owner` queue with low concurrency (e.g. 2), so a slow lookup doesn't hold up profile lookups. When it finishes, it re-enqueues the DM job to finish the reply.
   - **Sending:** replies go out through BoxAPI's `send_message` via a `dm-send` queue with a BullMQ rate limiter.
3. We extract a **target** from the message (§5.2).
4. We resolve the target to an **Instagram handle** (§5.3).
5. We look the handle up in `shops`, checking both `handle` and `previousHandles`.
6. **Found:** we reply with the shop answer (§5.4).
7. **Not found:** we add the handle to the wishlist, or increment its count if it's already there, and reply with the "not reviewed yet" message (§5.4).
8. **Nothing usable in the message:** we reply with a short help message explaining how to share a page or post.

### 5.2 Which page we look up (decided)

**We always look up the account the DM points to:**
- **Shared profile, or a link to one** (`instagram.com/<handle>`, or text like `@handle`): that handle.
- **Shared post or reel, or a link to one** (`/p/<code>`, `/reel/<code>`): **the account that posted it.** Never the businesses tagged or mentioned in the post. If someone wants to know about `@maashmamad`, they share `@maashmamad`'s profile.

### 5.3 Extracting and resolving the target

- **Text messages:** parse Instagram URLs and `@handle` patterns. Normalise handles: lowercase, strip `@`, the trailing `/` and query strings such as `?igsh=`.
- **Attachments:** BoxAPI passes Meta's message `attachments` through; seen types include `share`, `ig_reel` and `ig_post`, each with a `payload.url` or similar (BoxAPI documents `ig_reel` only). **Build step zero (spike):** once the page is connected to BoxAPI, send it a shared profile, post, reel and plain link, log the raw webhook bodies, and lock the parser down from real samples. Do not guess the payload shape.
- **Post to author:** a post URL only gives us the shortcode, so we look up its owner.
  - **Default:** BoxAPI Data API `media/get_info_by_shortcode`, reading `items[0].user.username`.
  - Cache `shortcode → ownerUsername` in `postOwners` forever, so the same post is never looked up twice.
  - Also check our own `reviews` first: if the shortcode is a post we already stored, we know the owner for free.
  - While the lookup runs, the bot may send a short "checking…" message.
- If the target can't be resolved, for example a private account or a deleted post, reply with "couldn't read this, please share the profile instead."

### 5.4 Reply content

**Default language:** Persian. Reply in English if the incoming message is mostly Latin script (*builder's call on the exact rule*).

**Shop found.** One text message (multiple messages if it's too long) containing:
- The display name and handle.
- **Categories:** the shop's category names (in the reply's language).
- **Contact details:** only the ones the shop has on its own page (email, website, phone), one per line. Leave the line out when a field is empty; never fill one in from anywhere else.
- **Tags:** the shop's status label, in human words (§8 statuses), plus its admin-assigned tags.
- **Review posts:** up to 3–5 **published** reviews, newest first. Each one shows the reviewer handle, date, a one-line summary and the Instagram post link. Add "+N more" if there are more.
- **Link: not in v1 (decided).** There's no website yet, so the reply has no link to our site. It will be added once the website exists. Keep the reply builder ready to take an optional link later, but don't add the setting now.
- If the shop exists but has **no published reviews yet**, say "on our list, not reviewed yet" and don't show any tags.
- **Disclaimer:** every reply that lists reviews ends with a closing line in the reply's language saying the answer is for information only and buying is the user's own responsibility (`disclaimer` in `src/i18n`). It goes after the last part's content, so it is always the end of the reply, and the 950-character split still holds.

**Not found:** "We haven't reviewed this page yet. We've added it to our review list." The wording follows the existing pagesanj copy: «اگر تجربه‌ای از خرید از این پیج دارید یا می‌خواهید بررسی شود…»

**Formatting:** plain text with line breaks. Instagram DMs don't render markdown. Quick replies or a generic template card are allowed later.

### 5.5 Meta rules the bot must respect

- Reply only within the **24-hour window** after the user's last message. The bot replies within seconds, so this is fine.
- No outbound or promotional messages.
- Handle webhook retries without double-replying: deduplicate by the message ID (`mid`).
- Ignore `is_echo` events (our own sent messages) and messages from our own account.
- Rate-limit replies per sender, for example 10 per minute per sender, to stop abuse.

### 5.6 Shop profile: image and contact details

Every shop has a profile image, and has the contact details its own Instagram page shows.

- **When:** when a shop is created (by an admin, by promoting a wishlist entry, or automatically from a trusted reviewer post, §6.4), and when an admin presses **refresh profile**. Not on every DM and not daily.
- **How:** one BoxAPI Data API `user/get_info_by_username` call for the shop's handle. Fields (checked against a real response): `body.user` with `hd_profile_pic_url_info.url` (else `profile_pic_url`), `external_url` / `bio_links[].url`, `public_email` and `contact_phone_number` (else `public_phone_country_code` + `public_phone_number`, else the first full number written in `biography`).
- **Image:** download it straight away (the Instagram link expires), check that it's a real JPEG, PNG or WebP of at most 2 MB, and store it in `shopImages`. If the fetch fails, the admin must upload an image before the shop can be saved.
- **Contact details:** copy only what the page itself publishes. Normalise the email (lowercase), the website (full `https://` URL) and the phone (international form). The admin can correct or clear a field, and can add one the page shows but the scrape missed. A phone read from the bio is a best guess, so the admin checks it before saving. Nothing is taken from other sources, such as reviewer posts or DMs.
- **Refresh:** a refresh replaces the image (if it changed) and the contact fields, and sets `profileFetchedAt`. A field the page no longer shows is cleared.
- **Auto-created shops** (§6.4) keep a phone read from the bio too. There is no admin check before saving, but it is the shop's own published number. A shop is never created without an image: the post goes to a person instead.
- **Not the same as pagesanj's sensitive identifiers.** pagesanj keeps phone numbers it collects as evidence encrypted and never public. The `contact.phone` here is different: it's the number the shop itself advertises on its page, so it's public by nature. Never copy a phone number into `contact` from anywhere but the shop's own page.

## 6. Feature 2: Daily reviewer-page check (BoxAPI Data API)

### 6.1 Flow

1. An admin adds a **reviewer source** (`handle`, `name`, `follow: true`).
2. **First run for a new source (backfill):** fetch up to `backfillLimit` recent posts (default **50**, set per source; one Data API call per 12 posts), then mark `backfillDone`.
3. **Daily:** a BullMQ scheduled job on the `reviewer-daily` queue, by default **09:00 Asia/Tehran**, fetches the newest page (12 posts) of each followed source, paging with `max_id` (at most 3 pages) only while every non-pinned post on the page is newer than `lastSeenPostAt`. One call per source; a failing source (e.g. a renamed page) is counted in `sourceErrors` and doesn't stop the others. There's no "only newer than" filter, so **deduplicate by shortcode** on our side.
4. For each post we haven't stored yet:
   - Find the **tagged businesses**: the union of caption `mentions` and `taggedUsers`, minus the reviewer's own handle, minus a configurable ignore list (e.g. sponsors that aren't shops).
   - **No tagged business:** store it as `skipped` (for audit), and don't create a review.
   - **One or more:** create **one pending review per tagged business** (§6.3).
5. Update the source's `lastSeenShortcode` and `lastSeenPostAt`. **Ignore pinned posts (`isPinned`) when computing "newest"**, because pinned posts appear first regardless of date.
6. Save a `jobRuns` record: posts fetched, reviews created, errors.

**Trusted sources** (`trusted: true`) take a different path for step 4: every post is stored as a `postChecks` row, tagged or not, and goes to the AI queue (§6.4). Sources that aren't trusted keep the flow above unchanged.

### 6.2 BoxAPI Data API details

- **Endpoint:** `POST https://instagram.boxpi.ir/api/instagram/user/get_media_by_username` (host for servers outside Iran) with `Authorization: Bearer <BOXAPI_INSTAGRAM_TOKEN>` and body `{"username": "sadegh.delicious", "count": 12, "max_id"?: "<next_max_id>"}`. One call per source; at most 12 posts per call.
- **Response:** wrapped as `{ status, response: { status_code, body } }`. **Fields used** (from `body.items[]`, checked against a real response): `code` (shortcode), `taken_at` (unix seconds), `caption.text` (caption `@mentions` are parsed from it), `usertags.in[].user.username` (also on `carousel_media[]`), `user.username` / `user.pk`, `image_versions2.candidates[0].url`, `video_versions[0].url`, `is_paid_partnership`, and `timeline_pinned_user_ids` (pinned when it holds the author's `pk`). Paging: `next_max_id`, `more_available`. Also store the **full raw item**.
- The token goes in `BOXAPI_INSTAGRAM_TOKEN` in `backend/.env`, never in the repo. Full endpoint notes: the `boxapi` skill (`.claude/skills/boxapi/SKILL.md`).

### 6.3 Pending review creation

- **The tagged shop exists** (by `handle` or `previousHandles`): create a review with `status: pending`, `sourceType: reviewer_post`, `reviewerSourceId`, `postShortcode`, `postUrl` (canonical `https://www.instagram.com/p/<code>/`), `occurredAt = post timestamp`, `caption`, media URLs, `paidPartnership` and `raw`.
- **The tagged shop doesn't exist:** *(builder's call, revisit if wrong)* create or increment a **wishlist** entry with `source: reviewer_post` and attach the pending review to that entry. When an admin promotes the entry to a shop, its pending reviews move to the new shop.
- **Uniqueness:** only one live (pending or published) review per (shop or wishlist entry, `postShortcode`). Enforce it with a unique partial index, as pagesanj does.
- **Outcome and direction aren't guessed.** A scraped post doesn't reliably say whether the experience was good. Pending reviews leave `outcome` and `direction` empty, and **the admin must set both before approving.** `paidPartnership: true` is shown to the admin as a warning.

### 6.4 Trusted reviewer pages: AI check and auto-publish

An admin can mark a reviewer source as **trusted** (§8 `reviewerSources.trusted`). Only these sources use this flow; spec: `docs/superpowers/specs/2026-10-30-trusted-reviewers-design.md`.

1. **Intake.** The daily check and backfill store each post as a `postChecks` row (status `queued`, unique per source and shortcode) and add a job to the `ai` queue. No post is dropped: each ends up published, `needs_person`, `dismissed`, or a duplicate.
2. **AI step (`ai` queue).** One request reads the caption text only (no images or video) and returns strict JSON: `is_review`, `shops[{handle, role}]` (role `reviewed_shop` or `other`), `direction`, `outcome`, `summary`, `category`, `scam_claim`, `has_evidence`, `confidence`. The model is `AI_REVIEW_MODEL`; the reply is validated with zod. Captions are untrusted data: the output is only used through the schema and the gate. The row becomes `classified` and a job goes to the `post-publish` queue.
3. **Gate (`post-publish` queue).** A post is published only if all of these hold, and every failed rule is stored in `postChecks.reasons`:
   - `is_review` is true, and exactly one shop has role `reviewed_shop` (`not_review`, `no_shop`, `several_shops`);
   - the handle is valid, appears in the caption or tags, and isn't on the ignore list (`invalid_handle`, `handle_not_in_post`, `ignored_handle`). The ignore list is `REVIEW_IGNORE_HANDLES`, the `ignoredHandles` collection and the reviewer's own handle. A handle written only as text in the caption is allowed, because a shop may have blocked the reviewer from tagging it;
   - confidence is at least `AI_PUBLISH_MIN_CONFIDENCE` (default 0.8) (`low_confidence`);
   - `has_evidence`: the caption makes at least one concrete statement about the product, delivery or service (`no_evidence`);
   - not a paid partnership (`paid_partnership`);
   - `direction` isn't `none` (`direction_none`); `outcome` isn't `none`, unless `scam_claim` is true, which stores `scam_reported` (`outcome_none`);
   - a scam claim must have `direction: negative` (`scam_contradiction`);
   - the source is still trusted when the gate runs (`source_not_trusted`).
   Two more reasons come from the later steps: `review_rejected` (an admin already took down a review of this post, so it stays down) and `review_pending` (a pending review of the post already exists, which is the admin's to decide).
4. **Shop.** The shop is found by handle or `previousHandles`, else created from the Data API profile (image, contact, phone from the bio), with a category: the model picks from the admin's list, or proposes a short name that is created on the spot. An open wishlist entry for the handle is promoted and its reviews move to the shop (they stay pending). A profile that isn't found, is private, or has no usable image, and a handle an admin dismissed, hold the post for a person.
5. **Publish.** The review is created `published` with `autoPublished: true`, and a scam claim gives the shop the tag `scammer`. Rejecting a scam review later keeps the tag and status until an admin changes them on the shop.
6. **Held posts.** Everything else becomes `needs_person` with the model's suggestion and the reasons, and counts towards wishlist demand for the handle. In the admin the person can edit outcome, direction and summary and publish (which also creates the category and applies a scam claim), dismiss it, or send it through the AI step again.
7. **Failures.** 429, 5xx, quota and network errors retry and the row stays queued; a final failure leaves `lastError` for the admin (the "failed" filter). Only a real not-found, private or no-image result goes to a person. A 4xx from BoxAPI is not retried.
8. **Queues.** `ai` runs one job at a time and at most 20 a minute, which are the AI key's limits. `post-publish` runs one job at a time, so two posts about a new shop can't both create it. Both use 8 attempts with an exponential backoff starting at 60,000 ms.
9. **Shop status** follows the published reviews (§8). An auto-created page that turns out not to be a business is removed with the admin action **not a shop** (§9.2). It works only on auto-created shops with no hand-approved published review. It rejects the shop's pending and auto-published reviews (`rejectReason: not_a_shop`), dismisses the wishlist entry, and adds the handle to `ignoredHandles` so the next post can't create it again.

## 7. Feature 3: Landing page (EN/FA)

Meta's review needs a real public presence. The landing page is its own React app in `web/` (Vite, React, TypeScript, Tailwind CSS v4, set up like `admin/`), and its own small Node server (`web/server.js`) renders it on the server (§11). It runs without the backend, which it asks only for a data-deletion request's status.

### 7.1 Design (Taste skill)

- **Design with the Taste skill (`taste-design`):** use it for the landing page's look, layout, typography and copy rhythm, so it reads as a real, trustworthy product and not a template. The design system is `web/DESIGN.md` (Taste defaults, its own palette with one green accent, Geist for Latin and Vazirmatn for Persian, light and dark mode).
- **The legal pages are Meta requirements first and design second.** The Taste styling may shape them (typography, spacing, header and footer), but must never hide, collapse, shorten or move their text behind interactions. No accordions, tabs or "read more" on legal text.
- **The content is in the HTML.** Every page is server-rendered (React `renderToString` from `web/`'s SSR build), with the full text in the first response. No client JavaScript is needed: the language switcher is plain links, and the deletion-status check is a plain `GET` form. Hydration is optional and must not change the text. It must not need JavaScript to show text, and must not show cookie walls, login walls, pop-ups or interstitials. Meta's reviewers and crawler must be able to read every page as plain HTML. Animations are optional and respect `prefers-reduced-motion`.
- **Persian pages:** `dir="rtl"`, a language switcher on every page, a mobile-first layout, and contrast of at least 4.5:1.

### 7.2 Pages

| Route | Content |
|---|---|
| `/fa`, `/en` (root `/` redirects by `Accept-Language`, default `fa`) | What pagesanj is and how to use the bot ("share a page or post with @pagesanj in a DM"), plus a link to the Instagram account. |
| `/fa/privacy`, `/en/privacy` | Privacy policy (§7.3). |
| `/fa/terms`, `/en/terms` | Terms of use, and a disclaimer that answers are informational. |
| `/fa/data-deletion`, `/en/data-deletion` | Deletion instructions (§7.3), plus a form to check a confirmation code's status. |
| `/fa/data-deletion/status?code=…`, `/en/…` | The status (`pending` or `done`) for a confirmation code. This is the `url` returned to Meta's callback. |

### 7.3 Legal pages checklist (originally for Meta App Review; kept for users and BoxAPI, §10)

- [ ] **Public URLs, HTTPS, status 200.** The privacy, terms and data-deletion pages load without login, cookies or JavaScript, and without redirects. Give Meta the direct `/en/...` URLs, not `/`. Don't block or challenge Meta's crawler (`facebookexternalhit`), e.g. with a bot check or a geo-block.
- [ ] **The privacy policy names the app and the company**, and says in plain words:
  - what we collect: the Instagram-scoped user ID, the message and what was shared in it, and timestamps;
  - why: only to answer the user's question;
  - how long we keep it: DM logs are deleted after 90 days (`dmEvents`, §8);
  - that we don't sell or share it, and don't use it for ads;
  - how to ask for deletion, linking to the data-deletion page;
  - a contact email (`CONTACT_EMAIL`).
- [ ] **Data-deletion instructions page:** the steps (remove the app in Instagram's settings under *Apps and websites*, or DM us, or email `CONTACT_EMAIL`), what gets deleted, and how long it takes. We have no Meta app, so there is no Meta deletion or deauthorize callback. A deletion deletes the user's `dmEvents`, stores a `deletionRequests` record and gives a confirmation code. The status page (`/en/data-deletion/status?code=<code>`) shows that code's state.
- [ ] **Terms of use** page exists at a public URL (entered as the **Terms of Service URL**).
- [ ] **Both languages:** the English pages are complete, not summaries, because Meta's reviewers read English. Persian pages carry the same content.
- [ ] **App dashboard basics:** app icon (1024×1024), category, privacy policy URL, terms URL, and the contact email all match what the site shows.
- [ ] The footer of every page links to privacy, terms and data deletion.

- The landing page needs no database beyond the deletion status.

## 8. Data model (MongoDB, Mongoose)

The model stays close to pagesanj's, so the future website (or a merge back into pagesanj) is a straightforward move.

In the tables below, `?` marks an optional field. Unless a table says otherwise, every collection also has `createdAt` and `updatedAt` (Mongoose `timestamps`). Handles are always stored normalised: lowercase, with no `@`.

### `shops`: businesses we know about (the answer source for the DM bot)

| Field | Type | Description |
|---|---|---|
| `slug` | string, unique | URL-safe ID for the future website's shop page (`/shop/{slug}`). |
| `displayName` | string | Shop name shown in replies and in the admin panel. |
| `handle` | string, unique | The shop's current Instagram handle; the main lookup key for DMs. |
| `previousHandles` | string[] | Old handles after a rename. Lookups check these too, so an old handle still finds the shop. |
| `status` | enum: `serious_warning \| warning \| mixed \| recommended \| no_known_issues` | Overall trust verdict (same values as pagesanj). Shown as the status label in replies. **Derived** from the shop's published reviews unless `statusManual` is set: all positive `recommended`, all negative `warning`, a mix `mixed`, and the tag `scammer` always `serious_warning` (it wins even over a manual status). A shop with no published review and no `scammer` tag goes back to `no_known_issues`, unless `statusManual` is true. |
| `statusManual` | boolean, default false | Set when an admin sets a status by hand: when a shop is created with a status other than `no_known_issues`, or when an edit changes the status. While set, reviews no longer change the status (the `scammer` tag still does). |
| `autoCreated` | boolean, default false | The shop was created from a trusted reviewer post (§6.4). Only these can be removed with **not a shop**. |
| `tags` | string[] | Admin-defined labels, e.g. "slow delivery" or "good packaging", shown in replies. The tag `scammer` is added automatically when a trusted page's published review claims a scam (§6.4). |
| `categoryIds` | ObjectId[] → `categories` | What the shop sells. An admin picks from the category list. For a shop created from a trusted post the model picks one, or proposes a short name and the category is created automatically (§6.4), so the list is no longer admin-only. |
| `bio?` | string | Short admin-written description, for the future website. |
| `profileImage` | `{ imageId: ObjectId → shopImages, sha256, mime }`, required | The shop's profile picture. **Every shop has one.** We keep our own copy, because Instagram image links expire (§5.6). |
| `contact` | `{ email?, website?, phone? }` | Contact details, **only the ones the shop shows on its own Instagram page** (business email, the link in its bio, a call button or a number in its bio). Each field is empty when the shop doesn't publish it. `email` is lowercased, `website` is a full `https://` URL, `phone` is stored in international form (`+98…`). |
| `profileFetchedAt?` | date | When we last read the shop's profile (image and contact details) from Instagram. |

### `categories`: the list of product categories

| Field | Type | Description |
|---|---|---|
| `name` | string | Persian name, e.g. «پوشاک». |
| `nameEn?` | string | English name, for English replies. Falls back to `name`. |
| `nameNormalized` | string, unique | `name` with Persian/Arabic letters and digits normalised (as pagesanj's `normalizeFa`), so the same category can't be added twice with different spellings. |
| `slug` | string, unique | URL-safe ID for the future website's category pages. |

A category in use by any shop can't be deleted; the admin must move those shops first. Categories can also be created by the AI step (§6.4), matched on `nameNormalized` so a spelling variant reuses the existing one.

### `shopImages`: our copies of shop profile pictures

| Field | Type | Description |
|---|---|---|
| `data` | binary | The image bytes. JPEG, PNG or WebP only, checked from the bytes themselves; at most 2 MB. |
| `mime` | string | The checked image type. |
| `sha256` | string, unique | Hash of the bytes. The image is served at `/media/shop/{sha256}`, so a new image gets a new URL and can be cached forever. |

*Builder's call:* keeping the bytes in MongoDB is enough at this size; move them to disk or object storage later if needed.

### `reviewerSources`: reviewer pages we follow (e.g. `@sadegh.delicious`)

| Field | Type | Description |
|---|---|---|
| `handle` | string, unique | The reviewer page's Instagram handle, sent to the Data API. |
| `name` | string | Display name of the reviewer. |
| `follow` | boolean | When true, the page is included in the daily check. |
| `backfillLimit` | number, default 50 | Maximum number of past posts to fetch the first time the page is followed. |
| `backfillDone` | boolean | Whether the first-time history fetch has finished. |
| `lastSeenShortcode?` | string | Shortcode of the newest (non-pinned) post we stored; the daily check's starting point. |
| `lastSeenPostAt?` | date | Publish time of that post. |
| `permission` | enum: `link_only \| screenshot \| embed`, default `link_only` | What the reviewer allows us to show: only a link, a screenshot, or an embedded post (as in pagesanj). |
| `trusted` | boolean, default false | Posts of this page go through the AI check and can publish without an admin (§6.4). |
| `profile?` | `{ sha256?, displayName?, biography?, postCount?, followerCount?, isPrivate?, fetchedAt? }` | The page's Instagram profile as the admin saw it when adding the source (§9.2). |

### `reviews`: one reviewer post about one shop

| Field | Type | Description |
|---|---|---|
| `shopId?` | ObjectId → `shops` | The shop this review is about. Exactly one of `shopId` and `wishlistId` is set. |
| `wishlistId?` | ObjectId → `wishlist` | Set instead of `shopId` when the tagged business isn't a shop yet; moved to `shopId` when the wishlist entry is promoted. |
| `sourceType` | enum: `reviewer_post` | Where the review came from. Only reviewer posts in v1; kept for compatibility with pagesanj. |
| `reviewerSourceId` | ObjectId → `reviewerSources` | The reviewer page that published the post. |
| `postShortcode` | string | Instagram post code (the `Deyc1w9hwTI` in `/p/Deyc1w9hwTI/`). Unique per shop or wishlist entry among live reviews. |
| `postUrl` | string | Canonical post link (`https://www.instagram.com/p/<code>/`), shown in replies. |
| `occurredAt` | date | When the reviewer published the post. |
| `caption` | string | The post's caption text, for the admin to read when moderating. |
| `media` | `{ displayUrl?, videoUrl? }` | Thumbnail and video links from the Data API, for the admin panel only. Instagram links expire, so they aren't permanent. |
| `paidPartnership` | boolean | Instagram's "paid partnership" flag; shown to the admin as a warning that the post is sponsored. |
| `raw` | object | The full Data API item, kept so we can re-parse later without fetching it again. |
| `status` | enum: `pending \| published \| rejected` | Moderation state. Only `published` reviews appear in DM replies. |
| `outcome?` | enum (pagesanj's `OUTCOMES`) | What happened to the buyer, e.g. `delivered_ok` or `not_delivered`. Set by the admin; required to publish. |
| `direction?` | enum: `positive \| negative \| mixed` | Overall tone of the review. Set by the admin; required to publish. |
| `summary?` | string | One-line admin-written summary, shown in DM replies. |
| `rejectReason?` | string | Why the admin rejected it, e.g. "not a review", "ad". |
| `publishedAt?` | date | When the admin approved it, or when it was auto-published from a trusted page. |
| `autoPublished` | boolean, default false | Published by the gate (§6.4) without an admin. |

`outcome` also has `scam_reported`, for a scam post whose caption describes no purchase, so the data doesn't claim more than the caption says. A review rejected by the **not a shop** action has `rejectReason: not_a_shop` (§6.4).

### `postChecks`: posts of trusted reviewer pages, from intake to publish (§6.4)

| Field | Type | Description |
|---|---|---|
| `reviewerSourceId` | ObjectId → `reviewerSources` | The trusted page that posted it. |
| `postShortcode` | string | Unique together with `reviewerSourceId`, so a post is stored once. |
| `postUrl`, `occurredAt`, `caption`, `media`, `paidPartnership`, `raw` | as in `reviews` | Copied from the Data API item. |
| `tagged` | string[] | Tagged handles (caption mentions and usertags), minus the reviewer. |
| `status` | enum: `queued \| classified \| needs_person \| published \| dismissed` | `queued` waits for the AI, `classified` for the gate. |
| `reasons` | string[] | Why the gate left the post for a person (§6.4). |
| `analysis?` | object | The model's validated answer (§6.4 step 2). |
| `lastError?` | string | The last failure of a job; a row still `queued` or `classified` with one has failed for good. |
| `shopIds`, `reviewIds` | ObjectId[] | What the post produced. |

### `ignoredHandles`: accounts the trusted-post gate never publishes about

| Field | Type | Description |
|---|---|---|
| `handle` | string, unique | Normalised handle. Added by **not a shop**; read together with `REVIEW_IGNORE_HANDLES`. |

### `wishlist`: pages people asked about that we haven't reviewed yet

| Field | Type | Description |
|---|---|---|
| `handle` | string, unique | The requested page's Instagram handle. |
| `requestCount` | number | How many times it was requested (DMs plus reviewer posts), so admins can sort by demand. |
| `sources` | enum[]: `dm \| reviewer_post` | How it got onto the list: someone asked in a DM, a reviewer tagged it, or both. |
| `firstRequestedAt` | date | First time it was requested. |
| `lastRequestedAt` | date | Most recent request. |
| `status` | enum: `open \| promoted \| dismissed` | `open` is waiting for review, `promoted` means it became a shop, `dismissed` means the admin decided not to review it. |
| `promotedShopId?` | ObjectId → `shops` | The shop it became, when promoted (or the existing shop it was linked to). |

### `postOwners`: cache of who posted a given post

| Field | Type | Description |
|---|---|---|
| `shortcode` | string, unique | Instagram post code. |
| `ownerUsername` | string | Handle of the account that posted it, found via the Data API. |
| `fetchedAt` | date | When we looked it up. The entry is kept forever, so the same post never costs twice. |

### `dmEvents`: log of each incoming DM and how the bot handled it (deleted after 90 days)

| Field | Type | Description |
|---|---|---|
| `mid` | string, unique | Meta's message ID. Also the BullMQ job ID, so the same message is never processed twice. |
| `senderIgsid` | string | The sender's Instagram-scoped ID: who to reply to. Not their handle. |
| `receivedAt` | date | When the webhook arrived. A TTL index on this field deletes the record after 90 days. |
| `kind` | enum: `profile \| post \| text \| unknown` | What the message contained: a shared or linked profile, a post, plain text with a handle, or nothing usable. |
| `targetHandle?` | string | The handle we resolved and looked up. |
| `result` | enum: `found \| wishlisted \| unresolved \| help` | What the bot answered: shop info, "added to the list", "couldn't read this", or the help message. |
| `replySentAt?` | date | When the reply was sent; empty if sending failed. |
| `error?` | string | Last error, if processing failed after all retries. |
| `text?` | string | The incoming message text. Only stored when debugging is turned on. |

### `jobRuns`: history of background jobs (for the admin Jobs screen)

| Field | Type | Description |
|---|---|---|
| `type` | enum: `daily_check \| backfill \| post_owner_lookup \| profile_fetch \| token_refresh` | Which job ran. `profile_fetch` is the shop profile run (§5.6). `token_refresh` only appears on old records. |
| `startedAt` | date | Start time. |
| `finishedAt?` | date | End time; empty while running or if it crashed. |
| `counts` | object | Numbers for the run, e.g. `{ postsFetched, postsNew, reviewsCreated, wishlisted, skipped, sourceErrors }`. |
| `error?` | string | Error message if the job failed. |

### `deletionRequests`: data deletion requests from Meta's callback (§7)

| Field | Type | Description |
|---|---|---|
| `confirmationCode` | string, unique | Code returned to Meta and shown to the user, who can check status on the data-deletion page. |
| `igsidHash` | string | Hash of the user's Instagram-scoped ID: enough to find and delete their data without keeping the ID itself. |
| `status` | enum: `pending \| done` | Whether their data has been deleted yet. |
| `at` | date | When the request arrived. |

### `admins`: people who can log in to the admin panel

| Field | Type | Description |
|---|---|---|
| `username` | string, unique, lowercase | Login name. |
| `passwordHash` | string | scrypt hash in pagesanj's format (`scrypt$N$r$p$<salt>$<hash>`, N=16384, r=8, p=1); the password itself is never stored. |
| `totpSecretEnc` | string | The authenticator (TOTP) secret, encrypted exactly as pagesanj does it (§9.1). |
| `role` | enum: `owner \| moderator`, default `owner` | As in pagesanj. |
| `lastTotpStep?` | number | The last 30-second code step used to log in, so a code can't be used twice. |
| `lastLoginAt?` | date | Last successful login. |

### `loginAttempts`: failed-login lockout (as in pagesanj)

| Field | Type | Description |
|---|---|---|
| `key` | string, unique | `<ip>|<username>`. |
| `failures` | number | Failed attempts in the current window. |
| `windowStart` | date | Start of the 15-minute window. |
| `lockedUntil?` | date | Set after the 5th failure, for 15 minutes. |

## 9. Admin panel (minimal, in the same app)

A **React** app at `/admin`, built with **Tailwind CSS** and **shadcn/ui** components, with session login and CSRF protection.

- **Build:** Vite + React + TypeScript (*builder's call*). Express serves the built files at `/admin` and a JSON API at `/admin/api/*`. The API uses the same session cookie and checks the CSRF token on every write.
- **Design:** use the **ui-ux-pro-max** skill to plan the design system and check each screen before it's built. Start from pagesanj's design system (`design-system/pagesanj/MASTER.md`: semantic colour tokens, Vazirmatn, light and dark mode) so both products look like one brand.
- **Components:** shadcn/ui (Radix-based), themed only through the design tokens. Components use token classes such as `bg-surface` and `text-ink`, never raw Tailwind palette colours.
- **Persian first:** `dir="rtl"` and Persian labels. Handles, URLs, emails and phone numbers are shown `dir="ltr"`.
- **Layout:** a sidebar with the screens below, which collapses to a top bar on mobile. Tables for lists, cards for detail views, and clear empty, loading and error states. Every action button shows a pending state, and destructive actions (reject, dismiss, delete category) ask for confirmation.
- **Accessibility:** keyboard-usable everywhere, visible focus rings, labels on every input, and text contrast of at least 4.5:1 in both themes.

### 9.1 Admin login with two-step verification (same as pagesanj, same key)

Login works exactly like pagesanj's admin login: **username + password + a 6-digit authenticator code**, all on one form. There is no login without the code, and no "skip" or "remember this device".

- **Same key:** each admin uses the **same authenticator secret as in pagesanj**, so the code from the admin's existing "Pagesanj" entry in their authenticator app works for both panels. No new QR code to scan.
- **How the secret is shared:** the bot uses **the same `DATA_ENCRYPTION_KEY`** as pagesanj (base64 of 32 bytes). The secret is stored with pagesanj's `encryptField` format (AES-256-GCM, `v1:<iv>:<tag>:<ciphertext>`, AAD `admin:totp`). A pagesanj `adminaccounts` record can then be copied to the bot's `admins` as is, with the same password hash and the same encrypted secret.
- **Moving admins over:** a script `npm run admin:import -- <username>` reads the account from pagesanj's database (`PAGESANJ_MONGODB_URI`, read-only) and copies `username`, `passwordHash`, `totpSecretEnc` and `role`. `npm run admin:create -- <username>` (password from `ADMIN_PASSWORD`, never an argument) still exists for a bot-only admin. It prints the `otpauth://` URL and base32 secret once, with issuer `Pagesanj`.
- **TOTP rules (copy pagesanj's `src/server/auth/totp.ts`):** RFC 6238, SHA-1, 6 digits, 30-second steps. Accept the previous, current and next step, compared in constant time. Reject a step that isn't newer than `lastTotpStep` (no replay), and update `lastTotpStep` atomically with the login.
- **Lockout (copy pagesanj's `login.ts`):** reserve an attempt per `<ip>|<username>` **before** checking the credentials. After 5 failures in 15 minutes, lock for 15 minutes. The error message is the same for a wrong username, password or code, and for a locked account.
- **Session:** after login, the same signed-cookie session as pagesanj (`SESSION_SECRET`, httpOnly, secure, sameSite), checked on every `/admin/api/*` call and on `/admin/queues`.
- **Login screen:** a shadcn card (username, password, code with `inputMode="numeric"` and `autocomplete="one-time-code"`), in the same style as the rest of the admin panel.

### 9.2 Screens

1. **Pending reviews:** list with the post link, caption, media thumbnail, a paid-partnership flag and the shop or wishlist target. Actions: set outcome, direction and summary, then **approve**, or **reject** with a reason.
2. **Wishlist:** sorted by `requestCount`. Actions: **promote to shop** (creates the shop and moves attached pending reviews), **link to an existing shop** (adds to `previousHandles`, e.g. after a rename), or **dismiss**.
3. **Shops:** create and edit (handle, previous handles, name, status, tags, categories, profile image, contact details). Categories are chosen from the list (screen 4), not typed. A new shop (including one promoted from the wishlist) starts with the profile fetch (§5.6), and the admin checks the result before saving: the image is required, and contact details stay empty unless the shop's page shows them. Actions: **upload a profile image** (replaces the fetched one), **refresh profile from Instagram**, and edit or clear each contact field.
4. **Categories:** add, rename and delete categories (deleting only when no shop uses one), with the number of shops in each.
5. **Reviewer sources:** add or edit, toggle follow, set the backfill limit, "run backfill now." Adding shows the page's Instagram profile first (picture, name, bio, post count, followers, and whether it is OK: exists, public, has posts; one Data API request) and has a **trusted** switch, also on the edit screen.
6. **Jobs:** recent `jobRuns`, the Data API request quota (`GET /api/my`: used, limit, left, plan end), "run daily check now."
7. **Person check:** the `postChecks` the gate held (`needs_person`), plus a "failed" filter. Each shows the post, the model's suggestion and the reasons. Actions: edit outcome, direction and summary and **publish** (a missing shop is created first with the shop form, image upload included; a post with several reviewed shops gets one review per shop), **dismiss**, or **run the AI again**. Published reviews show when they were auto-published. The Shops screen has **not a shop** for auto-created shops (§6.4).

## 10. Instagram setup (BoxAPI)

We have **no Meta app of our own**: no App Review, no Graph API token and no token refresh. BoxAPI's official, Meta-approved DM & Comment API does that part. Endpoint details are in the `boxapi` skill.

1. Connect pagesanj's **Instagram Business (or Creator) account** to BoxAPI through BoxAPI's official Instagram login link (`instagram_oauth_url` from `GET https://api.sendbox.chat/api/v1/service/info`).
2. In the BoxAPI panel (*API settings*): set the webhook URL to `https://<PUBLIC_BASE_URL>/webhooks/boxapi`, and generate the **webhook secret** (`BOXAPI_WEBHOOK_SECRET`). The route rejects every request until the secret is set.
3. **Tokens** in `backend/.env`: `BOXAPI_INSTAGRAM_DM_TOKEN` (DM & Comment API, header `X-Api-Key`), `BOXAPI_INSTAGRAM_TOKEN` (Instagram Data API, Bearer), `BOXAPI_AI_TOKEN` (AI API, Bearer, e.g. the `typesafe/jev-*` models).
4. **Send API:** `POST https://api.sendbox.chat/api/v1/service/actions/send_message` (SendBox, BoxAPI's DM service outside Iran; `BOXAPI_DM_BASE_URL`) with `{ account_id, recipient_id, message }`. `account_id` is the connected page's UUID, and `recipient_id` is the webhook's `sender.id`.
5. **BoxAPI rules:** message only people who messaged or commented first. No bulk or unsolicited messages (BoxAPI closes accounts for spam).
6. **Hosting:** the backend runs **outside Iran**, so the DM API uses `https://api.sendbox.chat/api/v1`, the Data API uses `https://instagram.boxpi.ir` and the AI API uses `https://ai.boxapi.ir/ai/v1` (`ai.boxpi.ir` rejects our key). Some Data API tokens are only accepted on `https://boxapi.ir`; set `BOXAPI_INSTAGRAM_BASE_URL` for that.
7. **Fallback:** keep the lookup logic in a function that doesn't depend on the transport.

## 11. Tech stack and architecture

- **Runtime:** Node.js LTS (22 or later), Express, MongoDB with Mongoose.
- **Language:** *builder's call:* TypeScript, run with `tsx` in development and compiled with `tsc` for production. This matches pagesanj and makes the later website share types.
- **Validation:** zod (as in pagesanj). **Tests:** vitest with mongodb-memory-server (as in pagesanj).
- **Queue:** **BullMQ** on **Redis**.
  - Queues: `dm-inbound`, `post-owner`, `dm-send`, `reviewer-daily`, `reviewer-backfill`, `shop-profile` (shop profile fetch, §5.6), `ai` (classify one trusted post, one job at a time, at most 20 a minute) and `post-publish` (the gate, one job at a time). The last two use 8 attempts with a 60,000 ms exponential backoff (§6.4).
  - Workers run in a separate process (`npm run worker`) from the Express web process, so the webhook stays fast.
- **Scheduler:** BullMQ **job schedulers** (repeatable jobs), with the timezone set to `Asia/Tehran`, for the daily reviewer check (§6.1). Each job runs once even with several workers, so no separate lock is needed.
- **Monitoring:** Bull Board mounted at `/admin/queues`, behind the admin login.
- **Structure:** an npm workspaces repo with three folders, each its own service and Docker image: `backend/` (the API: Express web process and workers), `admin/` and `web/`. `docker-compose.yml` runs them side by side with MongoDB and Redis.
  - `backend/src/queues/`: queue definitions and workers.
  - `backend/src/routes/`: webhooks, media, the public deletion-status API, admin JSON API.
  - `backend/src/bot/`: parse, resolve, lookup, reply. The core is **pure and transport-agnostic**.
  - `backend/src/boxapi/`: BoxAPI webhook signature, DM send (`send_message`), and the Data API client with its post and profile mappers.
  - `backend/src/services/`: domain logic, including the reviewer-post backfill and daily check (`reviewerPosts.ts`) and the post-owner lookup (`postOwners.ts`).
  - `backend/src/models/`, `backend/src/jobs/`, `backend/src/i18n/` (fa, en strings for bot replies).
  - `admin/`: the admin React app (Vite, Tailwind, shadcn/ui under `admin/src/components/ui`). Its build is served by its own nginx image, which proxies `/admin/api` and `/admin/queues` to the backend so the browser sees one origin.
  - `web/`: the public website React app (Vite, Tailwind), with the landing and legal pages (§7) and its own fa/en strings in `web/src/i18n/`. It has a client build (CSS, fonts, assets) and an SSR build (`web/dist/server/entry-server.js`, exporting `render(url, data)`). `web/server.js` (Express) calls `render` for every public route and passes in server data such as a deletion code's status, which it reads from the backend's `GET /api/deletion-status`. The future public website (shop pages, search) grows from this app.
- **Admin UI:** React, Vite, Tailwind CSS v4, shadcn/ui, lucide-react icons. The design comes from the ui-ux-pro-max skill, starting from pagesanj's design tokens (§9).
- **Website UI:** React, Vite, Tailwind CSS v4, server-rendered by `web/server.js` (§7.1). The design comes from the Taste skill and is written down in `web/DESIGN.md`.
- **Configuration (environment variables):** `MONGODB_URI`, `REDIS_URL`, `BOXAPI_INSTAGRAM_DM_TOKEN`, `BOXAPI_INSTAGRAM_TOKEN`, `BOXAPI_AI_TOKEN`, `BOXAPI_WEBHOOK_SECRET`, `BOXAPI_DM_BASE_URL` and `BOXAPI_INSTAGRAM_BASE_URL` (optional), `BOXAPI_AI_BASE_URL` (default `https://ai.boxapi.ir/ai/v1`), `AI_REVIEW_MODEL`, `AI_PUBLISH_MIN_CONFIDENCE` (default 0.8), `REVIEW_IGNORE_HANDLES`, `DAILY_CHECK_CRON`, `SESSION_SECRET`, `DATA_ENCRYPTION_KEY` (**the same value as pagesanj's**, §9.1), `PAGESANJ_MONGODB_URI` (optional, read-only, only for `admin:import`), `PUBLIC_BASE_URL` (the website's URL, for the deletion-status link), `TRUST_PROXY` (true behind one trusted reverse proxy, so the login lockout sees the real client IP), `ADMIN_PASSWORD` (only for `admin:create`). The website has its own: `CONTACT_EMAIL` (shown on the legal pages, §7), `SITE_INSTAGRAM_HANDLE`, `COMPANY_NAME`, `API_URL` (the backend). The admin image has `BACKEND_URL`.
- **Hosting:** any Node host with HTTPS and a stable public URL, which the BoxAPI webhook requires. **Database:** MongoDB Atlas (free tier is enough for v1). **Redis:** a managed Redis (e.g. Upstash or Redis Cloud free tier), or Redis next to the app. Set `maxmemory-policy noeviction`, as BullMQ requires.
- **Logging:** structured JSON logs with **pino** (`backend/src/lib/logger.ts`), `pino-http` for Express request logs, and `pino-pretty` in development only. Each worker uses a child logger carrying `{ queue, jobId }`. Never log tokens or full message bodies at info level: pino's `redact` option removes tokens, `signed_request`, `authorization` headers and message `text`. Message bodies are logged only at `debug`.

## 12. Security and privacy

- Verify the HMAC on every webhook and reject anything that fails.
- Keep secrets only in environment variables or encrypted in the database; nothing in the repo.
- Store the minimum about people who DM us: IGSID and metadata, with a 90-day TTL. Honour deletion requests from Meta's callback.
- The admin panel sits behind login with **two-step verification** (password + authenticator code, §9.1), with lockout after 5 failures, secure, httpOnly, sameSite session cookies and CSRF tokens.
- `DATA_ENCRYPTION_KEY` is shared with pagesanj (§9.1), so treat it as one secret for both apps: if either app leaks it, rotate it in both and re-encrypt the TOTP secrets and the Meta token.
- Store reviewer posts as **links** (permission `link_only` by default). Don't re-host their media publicly without permission.
- Shop profile images are the shop's own public profile picture. We keep a copy only to show it (in the admin panel now, on the website later). Serve it with `X-Content-Type-Options: nosniff`, and accept only real image types checked from the bytes.
- Shop contact details are only the ones the shop publishes on its own page (§5.6).

## 13. Success metrics

- The bot replies in **≤5 seconds** for a profile and **≤30 seconds** for a post (which needs the owner lookup), at the 95th percentile.
- **≥95%** of DMs containing a profile or post are resolved to a handle.
- Every new post from followed sources appears as a pending review within 24 hours.

## 14. Milestones

1. **M0, webhook spike (1–2 days):** page connected to BoxAPI, `/webhooks/boxapi` receiving signed events, raw payloads logged for each share type (§5.3). Locks the parser down.
2. **M1, core and data:** models (including categories and shop images), the admin app shell (design system from ui-ux-pro-max, Tailwind and shadcn/ui setup, sidebar), admin login with two-step verification and `admin:import` from pagesanj (§9.1), shop and category CRUD in admin, the shop profile fetch (§5.6), handle normalisation, lookup function with unit tests.
3. **M2, DM bot:** parse, resolve (including the post-owner lookup with cache), reply in fa/en, wishlist, dedupe and rate limits.
4. **M3, daily reviewer check:** reviewer sources, backfill, daily cron, pending reviews, job runs, admin approval screens.
5. **M4, landing page and Meta compliance:** EN/FA pages designed with the Taste skill, every item of the §7.3 checklist, data-deletion and deauthorize callbacks, token refresh job.
6. **M5, BoxAPI migration:** replace the Graph API send, Meta webhook, token refresh and the old scraper code with BoxAPI (§10, §5.3, §5.6, §6.2); remove the Meta-only config and cost tracking. **Done 2026-10-29.**
7. **Later (not v1):** public website with shop pages (then add the shop link to DM replies), search, a one-time import of shops from pagesanj (its CSV importer columns: `handle, display_name, website, categories`). Category names in the file are matched to `categories` by normalised name; an unknown name is reported, not created on the fly. Imported shops still need the profile fetch (§5.6).

## 15. Open questions

1. **Tags:** are they just the status label plus free-form admin tags (current assumption), or a fixed list?
2. **Seed data:** start with an empty shops collection, or import the shops already in pagesanj?
3. **Reviewer posts tagging several businesses:** one pending review per business (current assumption). Confirm.
4. **Shared post and profile payloads:** BoxAPI only documents the `ig_reel` share. Log real ones in M0.
5. **Categories:** one level, or a parent/child tree (e.g. «پوشاک» › «کفش»)? Current assumption: one level.
6. **Deletion requests:** with no Meta callback, how does a user's request (DM or email) reach `requestDeletion`? An admin action is the likely answer.
7. **Deletion and the queue:** finished DM jobs stay in Redis for up to 7 days (BullMQ `removeOnComplete`) and hold the message. A deletion request doesn't remove them yet. Shorten that retention for the DM queues, or remove a user's jobs on deletion, before App Review.

## 16. Decisions made by the builder or assistant (please check)

- TypeScript rather than plain JavaScript.
- The landing and legal pages are a separate React app (`web/`, Vite SSR build) with its own small Node server that renders it, rather than templates in `src/views/`. It runs as its own service, not inside the backend. The pages still work without client JavaScript, as Meta's reviewers require.
- The admin panel is a Vite + React app (Tailwind, shadcn/ui, designed with the ui-ux-pro-max skill), served by its own nginx image that proxies the backend's JSON API, rather than a Next.js app.
- Admin accounts reuse pagesanj's: same `DATA_ENCRYPTION_KEY`, same password hash and TOTP formats, copied with `admin:import`, so one authenticator entry works for both panels.
- Unknown tagged businesses from reviewer posts go to the wishlist (with the pending review attached) instead of creating a shop.
- Backfill cap of 50 posts per new source; daily check at 09:00 Tehran time.
- Post-to-author lookup via BoxAPI's Data API, with a permanent cache.
- **2026-10-28: BoxAPI replaces Meta's Graph API and Apify.** DMs come in on `POST /webhooks/boxapi` and go out through BoxAPI's `send_message`. Reviewer posts, post owners and shop profiles come from BoxAPI's Instagram Data API. AI calls (Jev models) go to BoxAPI's AI API. Our own Meta app, App Review, token refresh and all cost and budget tracking are dropped. **2026-10-29:** the Meta part is done. DM replies go through `send_message` (with the webhook's `account_id`), and the Meta webhook, `/meta/*` callbacks, token refresh, `metaToken` and the Meta env vars are gone. Later the same day the rest of M5 landed: reviewer posts, post owners and shop profiles use the Data API (`src/boxapi/data.ts`), the queues are `reviewer-daily`, `reviewer-backfill` and `shop-profile`, and `src/apify/`, the budget guard, `jobRuns.costUsd` / `apifyRunId` and the `APIFY_*` env vars are gone. Field names were checked against real responses (`backend/tests/fixtures/boxapi/`).
- Persian replies by default. English when the message's own words (ignoring URLs and @handles) have at least 3 Latin letters and more Latin than Persian/Arabic letters.
- A 90-day retention period for DM logs.
- Shop profiles (image and contact details) are fetched on create and on demand, not daily.
- The profile fetch runs in the worker (`shop-profile` queue); the admin API answers with a job id and the admin app polls for the result, instead of holding the request open while the Data API answers.
- Profile images are stored in MongoDB (`shopImages`), up to 2 MB each.
- Shop and category slugs are made once (shop: from the handle; category: from the English name, else the Persian name, Persian letters kept) and never change on a rename, so website URLs stay stable.
- A shop website given as `http://` or without a scheme is stored as `https://`. Renaming a shop's handle moves the old handle to `previousHandles` automatically; one handle can't belong to two shops.
- Logging with pino (structured JSON, built-in redaction) rather than winston.
- DM idempotency: BullMQ job ids come from the message `mid` (`<mid>`, `<mid>-r<n>` per reply part, `<mid>-checking`, `<mid>-lookup`, `<mid>-owner`), and a `dmEvents` row that already has a result is not answered again.
- Per-sender limit: at most 10 sent messages a minute per recipient; over that, the reply is dropped and logged (`dmEvents.error = rate_limited`). Global send limit: 10 a second.
- `handleMessage` adds unknown pages to the wishlist through an injected function, so another transport (e.g. ManyChat, §10.8) gets the same behaviour.
- A review attached to a wishlist entry can't be approved until the entry is promoted to, or linked with, a shop. Linking moves the reviews; one the shop already has for the same post is rejected as a duplicate.
- Reviewer posts with no tagged business are counted and logged in `jobRuns`, not stored.
- A reviewer source's handle can't be edited after it's added, because posts are matched to sources by handle.
- Security headers on every response (nosniff, frame denial, referrer policy, HSTS in production), and a strict same-origin Content-Security-Policy on the website and admin app. Nothing blocks crawlers. Secret query values (`hub.verify_token`, tokens, `signed_request`) are masked in request logs.
- The website gets `contactEmail` (from `CONTACT_EMAIL`) with every page's server data, for the legal pages.
- The website also gets `instagramHandle` (`SITE_INSTAGRAM_HANDLE`, default `pagesanj`) and `companyName` (`COMPANY_NAME`, default the brand name) when set. The site brand is «پیج‌سنج» in Persian and "Pagesanj" in English.
- Website legal copy commits to: DM requests and email deletion requests completed within 30 days; deletion via Instagram's *Apps and websites* runs as soon as the callback arrives; processing-queue messages removed within 7 days (§15 item 7). The site sets no cookies and loads no analytics.
- **2026-10-30: trusted reviewer pages (§6.4).** Decided by the founder: trusted pages publish without an admin, unclear posts go to a person, a scam claim from a trusted page tags the shop `scammer`. The assistant's calls:
  - The starting model is `openai/gpt-6-luna` (cheapest of those tried, best confidence spread on 6 real posts), set in `AI_REVIEW_MODEL`; it needs `max_completion_tokens`, so the client picks the token field per model. Token cap 1,500. The AI host is `https://ai.boxapi.ir/ai/v1`; `GET /ai/v1/me` shows the key's own credit. Jev decision models refuse our key, so a chat model is used.
  - The gate (§6.4) has extra hold reasons beyond the spec: `scam_contradiction` (a scam claim whose direction isn't negative), `source_not_trusted` (the source lost its trust before the gate ran), `review_pending` and `review_rejected` (a review of the post already exists and is the admin's to decide, or was taken down).
  - Shop status is derived from published reviews, with `statusManual` marking a hand-set status. A shop with no published review and no `scammer` tag resets to `no_known_issues`, so a takedown leaves no stale status; `createShop` sets `statusManual` for an explicit non-default status.
  - Categories can be created by the AI step (this changes "never free text" in §8).
  - A scam post with no purchase described is stored with the outcome `scam_reported`; rejecting it keeps the tag and `serious_warning` until an admin changes them.
  - 429, 5xx, quota and network errors retry; only a real not-found, private or no-image result goes to a person. A 4xx from BoxAPI isn't retried.
  - Auto-created shops keep a phone read from the bio (§5.6). **Not a shop** removes an auto-created shop and ignores its handle. Auto-creating a shop absorbs an open wishlist entry; a dismissed handle goes to a person.
  - Posts from sources that aren't trusted keep the old flow. Existing pending reviews are left as they are; only posts ingested after this, or a forced backfill, use the new flow.
  - Every reply with reviews ends with the responsibility line (§5.4).
