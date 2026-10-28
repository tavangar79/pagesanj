---
name: boxapi
description: Use when writing or changing any code in backend/ that talks to Instagram or an AI model - receiving or sending DMs, the BoxAPI webhook, looking up a post's author, fetching reviewer posts or a shop's profile, or calling an AI model (Jev). All of that goes through BoxAPI (boxapi.ir), not Meta's Graph API or Apify.
---

# BoxAPI (pagesanj)

pagesanj reaches Instagram and AI models only through **BoxAPI** (docs: https://boxapi.ir/docs/). It has three products, each with its own token and auth header. The backend is hosted **outside Iran**, so use the non-Iran hosts where they exist.

| Product | Use in pagesanj | Env var | Auth header | Base URL (outside Iran) |
|---|---|---|---|---|
| Instagram DM & Comment API (official, Meta-approved) | Receive DMs (webhook), send replies (PRD §5) | `BoxApiInstagramDMToken` | `X-Api-Key: <token>` | `https://boxapi.ir/service/...` |
| Instagram Data API | Post author (§5.3), reviewer posts (§6), shop profile (§5.6) | `BoxApiInstagramToken` | `Authorization: Bearer <token>` | `https://instagram.boxpi.ir/api/instagram/...` (Iran: `https://boxapi.ir/api/instagram/...`) |
| AI API (OpenAI-style) | **Jev** models: `typesafe/jev-latest`, `typesafe/jev-1.14`, `typesafe/jev-router` | `BoxApiAIToken` | `Authorization: Bearer <token>` | `https://ai.boxpi.ir/ai/v1` (docs show `https://ai.boxapi.ir/ai/v1`) |

Plus `BoxApiWebhookSecret` (generated in the BoxAPI panel, *API settings*) for webhook signatures.

The BoxAPI page connection (OAuth) uses **BoxAPI's** Meta app. We have no Meta app, App Review, Graph token or token refresh of our own. Don't add any.

## Steps

1. **Read the docs page** for the endpoint you use (links below) and **check field names against a real response** before parsing. Save that response as a fixture in `backend/tests/fixtures/boxapi/`. The docs samples are truncated and sometimes disagree with each other.
2. **Put the code in `backend/src/boxapi/`**: one small client per product (`dm.ts`, `data.ts`, `ai.ts`), with `fetch` injectable for tests (same pattern as `src/meta/sendApi.ts`). Read tokens only from `env` (`src/config/env.ts`). Never log a token or message text at info.
3. **Errors:** treat network errors, 5xx and 429 as retryable (BullMQ retries); other 4xx as final (`UnrecoverableError`).
4. **Test** with vitest and `tests/setup/fakeFetch.ts`. Assert the URL, the header and the body. Run `npm run typecheck` and `npm test`, then `graphify update backend`.
5. **Follow the `backend-module` skill** for queues, models and routes.

## DM & Comment API

- **Webhook → `POST /webhooks/boxapi`** (`src/routes/webhooks.ts`, signature check in `src/boxapi/signature.ts`). The URL `https://<PUBLIC_BASE_URL>/webhooks/boxapi` is set in the BoxAPI panel.
  - Body: `{ event_id, event_type, account_id, data }`. DMs have `event_type: "messaging"`, with Meta's shape under `data.messaging[]`: `sender.id`, `recipient.id`, `timestamp`, `message.mid`, `message.text` and `message.attachments[]`. One docs page shows the event directly in `data`, so the parser accepts both.
  - Other `event_type`s: `messaging_postbacks`, `comments`, `mentions`, and `action.*` results of our own calls (`action.send_message`, `action.follow_status`), which hold `request`, `success`, `result` and `error`.
  - Signature: `X-BoxApi-Signature: sha256=<hex HMAC-SHA256(secret, "{X-BoxApi-Timestamp}.{raw body}")>`. Reject if the timestamp is more than 300 s off. Use a constant-time compare on the **raw bytes**, so no JSON parser runs before the check. The route rejects everything while `BoxApiWebhookSecret` is unset.
  - BoxAPI retries 3 times, 60 s apart. Dedupe by `message.mid` (the BullMQ `jobId`), or by `event_id` for non-message events.
  - Shared reel: `attachments[].type = "ig_reel"`, with `payload.url` (`https://www.instagram.com/reel/<shortcode>/`), `payload.reel_video_id` and `payload.title`. Shared posts and profiles are **not documented**: log real payloads and build the parser from them (PRD §5.3).
- **Send a reply:** `POST https://boxapi.ir/service/actions/send_message` with header `X-Api-Key` and body `{ "account_id": "<page uuid>", "recipient_id": "<sender.id>", "message": "<text>", "buttons"?: [{ "type": "postback"|"web_url", "title", "payload"?, "url"? }] }`. The `account_id` is the webhook's top-level `account_id`, or comes from `GET https://boxapi.ir/service/accounts`. The result also arrives as an `action.send_message` webhook. Docs: /docs/instagram/dm/send-message/
- **Sender's profile:** `POST /service/actions/show_profile` with `{ account_id, sender_id }`. The answer (`username`, `name`, `profile_pic`) comes **via the webhook**, and only for users who have messaged or commented.
- **Account and plan:** `GET https://boxapi.ir/service/info` (connected `accounts[]`, `instagram_oauth_url`, `plan`).
- **Rate limit:** 100 text messages per second per page. BoxAPI queues anything over the limit instead of rejecting it.
- **Rules:** reply only to people who messaged us first. No bulk or unsolicited messages (BoxAPI closes accounts for spam). Reply about the post's *author*, never tagged accounts (PRD §5.2).

## Data API

Every call is a `POST` with a JSON body and `Authorization: Bearer <BoxApiInstagramToken>`. The response is wrapped: `{ "status": "done", "response": { "status_code": 200, "body": { ... } } }`. Read `response.body` and check `response.status_code`.

| Need | Endpoint (append to the base URL) | Body | Fields we read |
|---|---|---|---|
| Post author (§5.3) | `/media/get_info_by_shortcode` | `{ "shortcode": "<code>" }` | `body.items[0].user.username`, `taken_at`, `caption.text`, `usertags.in[]` |
| Reviewer posts (§6) | `/user/get_media_by_username` | `{ "username": "<handle>", "count": 12, "max_id"?: "<next_max_id>" }` | `body.items[]`: `code` (shortcode), `taken_at` (unix s), `caption.text`, `usertags.in[].user.username` (also on carousel children), `is_paid_partnership`, `image_versions2.candidates[]`, `user.username`; `next_max_id` |
| Shop profile (§5.6) | `/user/get_info_by_username` | `{ "username": "<handle>" }` | `body.data.user`: `profile_pic_url_hd`, `external_url`, `bio_links[]`, `business_email`, `business_phone_number`, `is_business_account` |
| Credit left | `GET /api/my` on the same host | none | `credit_used`, `credit_limit`, `credit_left`, `plan_expiration` |

Other endpoints (id ↔ shortcode, clips, comments, hashtags, locations) are listed at https://boxapi.ir/docs/. At most 12 posts per page. There's no "newer than" filter, so **dedupe by shortcode** (PRD §6). Instagram image URLs expire, so download images straight away (PRD §5.6).

## AI API (Jev)

OpenAI-compatible: `POST <base>/chat/completions` with `Authorization: Bearer <BoxApiAIToken>` and body `{ "model": "typesafe/jev-latest", "messages": [{ "role": "user", "content": "..." }] }`. Also available: `/responses`, `/embeddings`, `/images/generations`, `/audio/transcriptions`. For streaming, send `"stream": true` with `Accept: text/event-stream`. Pin a versioned model id (`typesafe/jev-1.14`) in code instead of `~typesafe/jev-latest`, so its behaviour doesn't change under us. Model list: https://boxapi.ir/docs/ai/models/
