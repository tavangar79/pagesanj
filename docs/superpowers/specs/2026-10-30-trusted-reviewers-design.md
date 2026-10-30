# Trusted reviewer pages: design

Status: draft for approval, 2026-10-30.

## Why

Today every reviewer post waits for an admin, and every new shop is created by hand. The founder wants pages they already trust, such as `nulbox`, to fill the site on their own: a shop that page reviews appears automatically, and the review goes live. People only look at the posts the system can't be sure about. The DM bot then answers with those reviews.

## Goals

1. An admin can mark a reviewer page as **trusted**.
2. Shops reviewed by a trusted page are created automatically, with their profile and category.
3. Clear reviews from a trusted page are published automatically.
4. Anything unclear goes to a **person-check list**: posts with no page, posts that aren't reviews, and thin posts such as `crop_shoop`, where the caption has no opinion because the review is in the video.
5. When a trusted page calls a shop a scammer, the shop gets the tag `scammer`.
6. Adding a reviewer page shows its Instagram profile, post count and whether the page is OK before it is saved.
7. Shop categories are set automatically.
8. DM replies include the review posts, a short description, and a closing line saying buying is the user's own responsibility.

## Non-goals

- Reading video or images. V1 sends the caption text only.
- Auto-publishing from pages that aren't trusted. Their posts keep today's flow.
- Jev decision models: `/api/alpha/decisions` refuses our key. A direct Gemini key isn't used either.
- Billing or AI cost tracking (project rule).

## Anti-goals

Failure, even if the code works:

- A police, government, friend or sponsor account becomes a shop. Real example: the scam post on `vebo.ir` tagged `policefata_faraja` and `policefata_faraja1`.
- A page the model is unsure about is published rather than checked by a person.
- A review states something the caption doesn't say.
- A post silently disappears: every post must end up published, in the person-check list, or logged as a duplicate.

## Decisions by the founder

- Trusted pages publish without an admin. The rule "never publish without an admin's approval" is narrowed in `CLAUDE.md` and `PRD.md` §3: it still applies to everything except trusted pages.
- Posts with no page or no review go to the person-check list. They are not dropped.
- Posts like `crop_shoop` go to the person-check list.
- Scam claims from a trusted page give the shop the tag `scammer`.
- Deploy target is Hetzner. Region limits are not a concern.
- The Instagram plan will be upgraded later. Testing is fine with few requests for now.
- The DM reply ends with the responsibility line.
- The AI model name is set in `backend/.env`, so it can change without a code change. Luna is only the starting value.
- Shop status follows its published reviews: all positive `recommended`, all negative `warning`, a mix of both `mixed`, any scam claim `serious_warning`, which always wins. An admin can still change it by hand.
- A scam claim can auto-publish from a page name written only in the caption, because reviewers are sometimes blocked by the shop and can't tag it. The profile fetch must still find that page; if it doesn't (`vebo.ir` may be a website), the post goes to a person.

## Calls made by the assistant (please check)

- **Starting model:** `openai/gpt-6-luna` through BoxAPI. The request sends the token cap under the parameter each model accepts. On the 6 real posts it was about 3x cheaper than Haiku 5.5 ($0.00013 vs $0.00040 per post) and its confidence separated clear from thin posts better. It used `max_completion_tokens`, not `max_tokens`. The sample is small, and it invented a detail on `crop_shoop`, which is why rule 4 below exists.
- **Publish gate.** A post publishes only if all of these hold:
  1. The source is trusted.
  2. `is_review` is true and exactly one shop has role `reviewed_shop`.
  3. Confidence is at least 0.8 (env var).
  4. The caption is not thin: at least one concrete statement about the product, delivery or service. The model reports this as a separate `has_evidence` field. `outcome` of `none` is allowed only when `scam_claim` is true.
  5. `paidPartnership` is false: a paid review needs a person.
  6. The shop's profile could be read, including its image.
  Anything else goes to the person-check list with a reason.
- **Handles:** a shop the model names must pass `normalizeHandle` (strips `@`) and be confirmed by the profile fetch. It may be plain text in the caption (`vebo.ir`), not only a tag. A failed fetch sends the post to a person.
- **Scammer tag:** the tag is `scammer`. A scam post publishes automatically like any other, under the same gate. An admin can take it down with the existing reject action, and that does not remove the tag automatically.
- **Categories:** the model chooses from the admin's list. If nothing fits it proposes a short name and the category is created automatically. This changes PRD §8, "never free text".
- **Existing data:** the 7 pending reviews stay as they are. Only posts ingested after this ships, or a forced backfill, use the new flow.

## How it works

1. The daily check and backfill fetch posts as they do now.
2. Every post from a trusted source goes to a new AI step, run in the worker through a queue, one job per post, idempotent by source and shortcode, writing `jobRuns`.
3. The model returns: `is_review`, `shops[{handle, role}]`, `direction`, `outcome`, `summary`, `category`, `scam_claim`, `has_evidence`, `confidence`. Strict JSON schema. No `null` inside an enum; use `none`. Token cap 1,500.
4. If the post passes the gate up to the shop step: find the shop by handle, else create it (profile fetch, image, contact, category), then publish the review and apply the scammer tag if claimed.
5. Otherwise the post is stored for a person with the model's suggestion and the reason. The admin can publish it, attach it to a shop, or dismiss it.

Non-trusted sources are not sent to the AI in v1.

Captions are untrusted text: the prompt treats them as data, and the output is only ever used through the schema and the gate above.

## Admin

- **Reviewer sources, add:** enter a handle, see the profile picture, name, bio, post count, followers and an OK / not OK result (exists, public, has posts) before saving. Uses 1 Data API request. A `trusted` switch is on the form and the edit screen.
- **Person-check list:** a new screen or a tab of Pending Reviews showing the post, the model's suggestion, and why it needs a person.
- **Published reviews:** show when a review was auto-published.

## DM reply

`buildShopReply` already sends each review's `postUrl` and `summary`. Change it so every reply with reviews ends with a short disclaimer in the user's language, in `strings`, for example: "این پاسخ فقط برای اطلاع‌رسانی است و مسئولیت خرید با خود شماست." Keep the 950-character split. The disclaimer goes after the last part's content, so it is always the end of the reply.

## Constraints

- All AI and Instagram calls go through BoxAPI. AI host: `https://ai.boxapi.ir/ai/v1`.
- Backend rules in `backend/CLAUDE.md`, `boxapi` and `backend-module` skills; admin rules in `admin/CLAUDE.md` and the `admin-ui` skill. Update `PRD.md` §3, §5.4, §6, §8, §9 and `ARCHITECTURE.md`.
- `shops.profileImage` is required, so a shop can't be created without an image.
- Tests from real payloads. The 6 `nulbox` posts become fixtures, with the model's reply mocked.

## Settled after the builder check (assistant's calls)

- **`none` values:** `direction: none` always goes to a person. A scam post whose caption describes no purchase is stored with a new outcome, `scam_reported`, added to `OUTCOMES` with admin labels, so the data doesn't claim more than the caption says.
- **Person-check list actions:** the admin can edit outcome, direction and summary, then publish. If the shop doesn't exist, the admin uses the existing create-shop flow, including uploading an image if needed. Publishing here also creates the category and applies a scam claim's tag and status. A post with several reviewed shops gets one review per shop, as in PRD §6.3.
- **Wishlist:** auto-creating a shop promotes an open wishlist entry for that handle and moves its reviews to the shop; those reviews stay pending. A handle an admin has dismissed goes to a person. Posts held for a person count towards wishlist demand as they do today.
- **Failures:** 429, 5xx, quota and network errors retry and stay queued rather than going to a person. Only a real "not found", "private" or "no image" goes to a person. AI failures follow the same rule.
- **Bio phone:** auto-created shops keep it. It is the shop's own published number. Update PRD §5.6.
- **Undo:** a new admin action, "not a shop", removes an auto-created shop with no other published reviews and adds its handle to the ignore list, so the next post can't re-create it. `REVIEW_IGNORE_HANDLES` also applies to handles the model names.
- **Takedown:** rejecting a scam review keeps the tag and `serious_warning` until an admin changes them on the shop.

## Left to the builder

Collection or fields for the person-check list, queue names, env var names, the exact prompt, the admin layout (through `admin-ui`), and how a category name becomes a slug.
