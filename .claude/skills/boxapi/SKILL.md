---
name: boxapi
description: Use when writing or changing any code in backend/ that talks to Instagram or an AI model - receiving or sending DMs, the BoxAPI webhook, looking up a post's author, fetching reviewer posts or a shop's profile, or calling an AI model (Jev). All of that goes through BoxAPI (boxapi.ir), not Meta's Graph API or a scraper.
---

# BoxAPI (pagesanj)

pagesanj reaches Instagram and AI models only through **BoxAPI** (docs: https://boxapi.ir/docs/). It has three products, each with its own token and auth header. The backend is hosted **outside Iran**, so use the non-Iran hosts where they exist.

| Product | Use in pagesanj | Env var | Auth header | Base URL (outside Iran) |
|---|---|---|---|---|
| Instagram DM & Comment API (official, Meta-approved) | Receive DMs (webhook), send replies (PRD §5) | `BOXAPI_INSTAGRAM_DM_TOKEN` | `X-Api-Key: <token>` | `https://api.sendbox.chat/api/v1/service/...` (SendBox, BoxAPI's DM service; Iran: `https://boxapi.ir/service/...`; env `BOXAPI_DM_BASE_URL`) |
| Instagram Data API | Post author (§5.3), reviewer posts (§6), shop profile (§5.6) | `BOXAPI_INSTAGRAM_TOKEN` | `Authorization: Bearer <token>` | `https://instagram.boxpi.ir/api/instagram/...` (Iran: `https://boxapi.ir/api/instagram/...`; `BOXAPI_INSTAGRAM_BASE_URL`, since some tokens only work on boxapi.ir) |
| AI API (OpenAI-style) | **Jev** models: `typesafe/jev-latest`, `typesafe/jev-1.14`, `typesafe/jev-router` | `BOXAPI_AI_TOKEN` | `Authorization: Bearer <token>` | `https://ai.boxapi.ir/ai/v1` (`ai.boxpi.ir` rejects our key with 401 `invalid_api_key`) |

Plus `BOXAPI_WEBHOOK_SECRET` (generated in the BoxAPI panel, *API settings*) for webhook signatures.

The BoxAPI page connection (OAuth) uses **BoxAPI's** Meta app. We have no Meta app, App Review, Graph token or token refresh of our own. Don't add any.

## Steps

1. **Read the docs page** for the endpoint you use (links below) and **check field names against a real response** before parsing. Save that response as a fixture in `backend/tests/fixtures/boxapi/`. The docs samples are truncated and sometimes disagree with each other.
2. **Put the code in `backend/src/boxapi/`**: one small client per product (`dm.ts`, `data.ts`, `ai.ts`), with `fetch` injectable for tests (same pattern as `src/boxapi/dm.ts`). Read tokens only from `env` (`src/config/env.ts`). Never log a token or message text at info.
3. **Errors:** treat network errors, 5xx and 429 as retryable (BullMQ retries); other 4xx as final (`UnrecoverableError`).
4. **Test** with vitest and `tests/setup/fakeFetch.ts`. Assert the URL, the header and the body. Run `npm run typecheck` and `npm test`, then `graphify update backend`.
5. **Follow the `backend-module` skill** for queues, models and routes.

## DM & Comment API

- **Webhook → `POST /webhooks/boxapi`** (`src/routes/webhooks.ts`, signature check in `src/boxapi/signature.ts`). The URL `https://<PUBLIC_BASE_URL>/webhooks/boxapi` is set in the BoxAPI panel.
  - Body: `{ event_id, event_type, account_id, data }`. DMs have `event_type: "messaging"`, with Meta's shape under `data.messaging[]`: `sender.id`, `recipient.id`, `timestamp`, `message.mid`, `message.text` and `message.attachments[]`. One docs page shows the event directly in `data`, so the parser accepts both.
  - Other `event_type`s: `messaging_postbacks`, `comments`, `mentions`, and `action.*` results of our own calls (`action.send_message`, `action.follow_status`), which hold `request`, `success`, `result` and `error`.
  - Signature: `X-BoxApi-Signature: sha256=<hex HMAC-SHA256(secret, "{X-BoxApi-Timestamp}.{raw body}")>`. Reject if the timestamp is more than 300 s off. Use a constant-time compare on the **raw bytes**, so no JSON parser runs before the check. The route rejects everything while `BOXAPI_WEBHOOK_SECRET` is unset.
  - BoxAPI retries 3 times, 60 s apart. Dedupe by `message.mid` (the BullMQ `jobId`), or by `event_id` for non-message events.
  - Shared reel: `attachments[].type = "ig_reel"`, with `payload.url` (`https://www.instagram.com/reel/<shortcode>/`), `payload.reel_video_id` and `payload.title`. Shared posts and profiles are **not documented**: log real payloads and build the parser from them (PRD §5.3).
- **Send a reply:** `POST {BOXAPI_DM_BASE_URL}/service/actions/send_message` with header `X-Api-Key` and body `{ "account_id": "<page uuid>", "recipient_id": "<sender.id>", "message": "<text>", "buttons"?: [{ "type": "postback"|"web_url", "title", "payload"?, "url"? }] }`. The `account_id` is the webhook's top-level `account_id`, or comes from `GET {BOXAPI_DM_BASE_URL}/service/accounts`. The result also arrives as an `action.send_message` webhook. Docs: /docs/instagram/dm/send-message/
- **Sender's profile:** `POST /service/actions/show_profile` with `{ account_id, sender_id }`. The answer (`username`, `name`, `profile_pic`) comes **via the webhook**, and only for users who have messaged or commented.
- **Account and plan:** `GET {BOXAPI_DM_BASE_URL}/service/info` (connected `accounts[]`, `instagram_oauth_url`, `plan`).
- **Rate limit:** 100 text messages per second per page. BoxAPI queues anything over the limit instead of rejecting it.
- **Rules:** reply only to people who messaged us first. No bulk or unsolicited messages (BoxAPI closes accounts for spam). Reply about the post's *author*, never tagged accounts (PRD §5.2).

## Data API

Every call is a `POST` with a JSON body and `Authorization: Bearer <BOXAPI_INSTAGRAM_TOKEN>`. The response is wrapped: `{ "status": "done", "response": { "status_code": 200, "body": { ... } } }`. Read `response.body` and check `response.status_code`.

| Need | Endpoint (append to the base URL) | Body | Fields we read |
|---|---|---|---|
| Post author (§5.3) | `/media/get_info_by_shortcode` | `{ "shortcode": "<code>" }` | `body.items[0].user.username`, `taken_at`, `caption.text`, `usertags.in[]` |
| Reviewer posts (§6) | `/user/get_media_by_username` | `{ "username": "<handle>", "count": 12, "max_id"?: "<next_max_id>" }` | `body.items[]`: `code` (shortcode), `taken_at` (unix s), `caption.text` (parse `@mentions` from it), `usertags.in[].user.username` (also on `carousel_media[]`), `is_paid_partnership`, `image_versions2.candidates[]`, `video_versions[]`, `user.username`, `user.pk`, `timeline_pinned_user_ids` (pinned if it holds `user.pk`); `next_max_id`, `more_available` |
| Shop profile (§5.6) | `/user/get_info_by_username` | `{ "username": "<handle>" }` | `body.user` (not `body.data.user` as the docs say): `full_name`, `hd_profile_pic_url_info.url` (else `profile_pic_url`), `external_url`, `bio_links[].url`, `public_email`, `contact_phone_number` (with country code; else `public_phone_country_code` + `public_phone_number`; else the first full number in `biography`) |
| Request quota | `GET /api/my` on the same host | none | `request_used`, `request_limit`, `request_left`, `plan_expiration` |

Client: `src/boxapi/data.ts`; mappers: `src/boxapi/posts.ts`, `src/boxapi/profile.ts`; real fixtures: `backend/tests/fixtures/boxapi/`. Plans can be small (10 requests a month), so don't call the live API casually. Other endpoints (id ↔ shortcode, clips, comments, hashtags, locations) are listed at https://boxapi.ir/docs/. At most 12 posts per page. There's no "newer than" filter, so **dedupe by shortcode** (PRD §6). Instagram image URLs expire, so download images straight away (PRD §5.6).

## AI API (Jev)

OpenAI-compatible: `POST <base>/chat/completions` with `Authorization: Bearer <BOXAPI_AI_TOKEN>` and body `{ "model": "typesafe/jev-latest", "messages": [{ "role": "user", "content": "..." }] }`. Also available: `/responses`, `/embeddings`, `/images/generations`, `/audio/transcriptions`. For streaming, send `"stream": true` with `Accept: text/event-stream`. Pin a versioned model id (`typesafe/jev-1.14`) in code instead of `~typesafe/jev-latest`, so its behaviour doesn't change under us. Model list: https://boxapi.ir/docs/ai/models/

- **Credit and limits:** `GET <base>/me` is our key (`credit.remaining_usd`, `limits`, `expiry`). `GET <base>/credits` and `/key` show BoxAPI's upstream account, not ours.
- **Decisions models:** `typesafe/jev-1.14` and `~typesafe/jev-latest` have type `decisions`. `/chat/completions` refuses them with a 400 naming `/api/alpha/decisions`, and that path answers 401 `Invalid credentials format` with our key (checked 2026-10-30). Use a chat model until BoxAPI gives us access.
