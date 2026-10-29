# How pagesanj works

A snapshot of the system as of 2026-10-29, after the BoxAPI migration (PRD §14 M5). The spec is `PRD.md`; this file is the map.

pagesanj does three things:

1. **DM bot.** Someone sends our Instagram account a shop's page, post or `@handle`, and the bot replies with what we know about that shop.
2. **Daily reviewer check.** Every morning we read new posts from reviewer pages we follow. Each shop tagged in a post becomes a **pending review**, and an admin approves or rejects it.
3. **Website and admin panel.** A public bilingual (fa/en) site, and an admin panel where all moderation happens.

Instagram and AI are reached **only through BoxAPI** (boxapi.ir). We have no Meta app, no Graph API token and no scraper.

## 1. The big picture

```mermaid
flowchart LR
  user([Instagram user])
  admin([Admin])
  visitor([Website visitor])

  subgraph BoxAPI["BoxAPI (boxapi.ir)"]
    dmapi["DM & Comment API (SendBox)<br/>api.sendbox.chat/api/v1<br/>webhook + send_message"]
    dataapi["Instagram Data API<br/>posts · post info · profiles · quota"]
  end

  subgraph web["Web process (npm run dev / start)<br/>Express"]
    wh["POST /webhooks/boxapi<br/>HMAC check"]
    adminapi["/admin/api/*<br/>JSON API + /admin SPA"]
    board["/admin/queues<br/>Bull Board"]
    site["/ (SSR website)<br/>+ /media/shop/:sha"]
  end

  subgraph redis["Redis (BullMQ)"]
    q1[[dm-inbound]]
    q2[[post-owner]]
    q3[[dm-send]]
    q4[[reviewer-daily]]
    q5[[reviewer-backfill]]
    q6[[shop-profile]]
  end

  subgraph worker["Worker process (npm run dev:worker / worker)"]
    w["BullMQ workers<br/>+ daily scheduler 09:00 Tehran"]
    bot["src/bot (pure)<br/>parse → resolve → lookup → reply"]
  end

  db[(MongoDB)]

  user -- DM --> dmapi
  dmapi -- signed webhook --> wh
  wh --> q1
  q1 & q2 & q3 & q4 & q5 & q6 --> w
  w --> bot
  w -- send_message --> dmapi
  dmapi -- reply --> user
  w -- read posts / profiles --> dataapi
  w <--> db

  admin --> adminapi
  admin --> board
  adminapi <--> db
  adminapi -- enqueue --> q4 & q5 & q6
  board --- redis

  visitor --> site
  site <--> db
```

There are **two Node processes** that share MongoDB and Redis:

| Process | Entry | Does |
|---|---|---|
| Web | `backend/src/server.ts` → `app.ts` | Receives webhooks, serves the admin API and SPA, Bull Board and the SSR website. It never calls Instagram itself: slow work goes into a queue. |
| Worker | `backend/src/worker.ts` | Runs every queue's worker and registers the daily scheduler. All BoxAPI calls happen here. |

## 2. Feature 1: the DM bot

```mermaid
sequenceDiagram
  autonumber
  participant U as Instagram user
  participant B as BoxAPI
  participant W as Web: /webhooks/boxapi
  participant IN as dm-inbound worker
  participant BOT as src/bot (pure)
  participant PO as post-owner worker
  participant D as Data API
  participant S as dm-send worker
  participant DB as MongoDB

  U->>B: DM (profile, post or reel share, link, @handle)
  B->>W: POST {event_type: messaging, account_id, data}
  W->>W: verify X-BoxApi-Signature (HMAC, ±300 s)
  W->>IN: enqueue job (jobId = message mid, so retries dedupe)
  W-->>B: 200 straight away
  IN->>DB: dmEvents upsert (skip if already answered)
  IN->>BOT: handleMessage(message)
  BOT->>BOT: parse target (profile / post / text)
  alt it's a post and the author is unknown
    BOT->>DB: our reviews? postOwners cache?
    BOT-->>IN: needsOwnerLookup(shortcode)
    IN->>S: "Checking… one moment."
    IN->>PO: lookup job
    PO->>D: media/get_info_by_shortcode
    D-->>PO: items[0].user.username
    PO->>DB: postOwners (cached forever)
    PO->>IN: re-enqueue the DM (ownerLookupDone)
    IN->>BOT: handleMessage again
  end
  BOT->>DB: find shop by handle / previousHandles
  alt shop found
    BOT-->>IN: shop reply (name, categories, contact, status, up to 5 published reviews)
  else not found
    BOT->>DB: wishlist +1
    BOT-->>IN: "not reviewed yet, added to our list"
  end
  IN->>S: reply parts
  S->>S: rate limits: 10/s global, 10/min per sender
  S->>B: POST api.sendbox.chat/api/v1/service/actions/send_message
  B->>U: reply
```

Rules the bot always follows (PRD §5.2, §5.5):

- A shared **post** is answered about its **author**, never about the accounts tagged in it.
- It only replies to people who messaged first. Echoes of our own messages are ignored. A message is never answered twice: the job ids come from the `mid`, and a `dmEvents` row that already has a result is skipped.
- Persian by default; English when the message is mostly Latin script.

Code: `routes/webhooks.ts`, `boxapi/signature.ts`, `queues/workers/{dmInbound,postOwner,dmSend}.worker.ts`, `bot/*`, `services/botDeps.ts`, `services/postOwners.ts`, `boxapi/dm.ts`.

## 3. Feature 2: the daily reviewer check

```mermaid
flowchart TD
  A[Admin adds a reviewer source<br/>e.g. @sadegh.delicious] -->|follow = true| BF[[reviewer-backfill]]
  CRON["Scheduler 09:00 Asia/Tehran<br/>or 'run daily check now'"] --> DAY[[reviewer-daily]]

  BF --> BF1["Data API user/get_media_by_username<br/>12 posts per call, page with max_id<br/>until backfillLimit (default 50)"]
  DAY --> D1["For each followed source:<br/>newest page of 12;<br/>older pages (max 3) only while<br/>every non-pinned post is new"]

  BF1 --> ING
  D1 --> ING

  ING["ingestPosts:<br/>dedupe by shortcode,<br/>skip posts already stored"] --> TAG["extractTagged:<br/>caption @mentions ∪ usertags,<br/>minus the reviewer and REVIEW_IGNORE_HANDLES"]
  TAG -->|no tagged business| SKIP[counted as skipped]
  TAG -->|shop exists| PR1[pending review on the shop]
  TAG -->|unknown handle| PR2[wishlist entry +1<br/>+ pending review attached]
  ING --> LS["update lastSeenShortcode / lastSeenPostAt<br/>(pinned posts never count as newest)"]
  PR1 & PR2 --> MOD[Admin sets outcome + direction<br/>→ approve or reject]
  MOD -->|approved| PUB[published review<br/>shown in DM replies]
```

- One failing source (for example a renamed page) is counted in `sourceErrors` and doesn't stop the others. The job fails only if every source fails.
- Every run writes a `jobRuns` row with its counts. The admin Jobs page shows those rows next to the BoxAPI request quota (`GET /api/my`).
- Nothing is published without an admin's approval. Outcome and direction are never guessed.

Code: `services/reviewerPosts.ts`, `services/reviews.ts`, `boxapi/posts.ts`, `queues/workers/reviewer{Daily,Backfill}.worker.ts`, `queues/schedulers.ts`.

## 4. Shop profile fetch

When a shop is created, or an admin presses **refresh profile**:

```mermaid
sequenceDiagram
  participant A as Admin panel
  participant API as /admin/api/shops
  participant Q as shop-profile worker
  participant D as Data API
  participant CDN as Instagram CDN
  participant DB as MongoDB

  A->>API: POST /profile-preview {handle} (or /:id/refresh-profile)
  API->>Q: enqueue
  API-->>A: 202 {jobId}
  loop every 2 s
    A->>API: GET /profile-jobs/:jobId
  end
  Q->>D: user/get_info_by_username
  D-->>Q: body.user (HD picture, external_url / bio_links, public_email, contact_phone_number)
  Q->>CDN: download the image now (links expire), max 2 MB, JPEG/PNG/WebP only
  Q->>DB: shopImages (+ update the shop on refresh)
  Q-->>A: draft: image, contact, display name
  Note over A: Admin checks it, uploads an image if the fetch failed, then saves
```

Contact details come **only from the shop's own page**. A field the page no longer shows is cleared on refresh.

Code: `queues/workers/shopProfile.worker.ts`, `boxapi/profile.ts`, `lib/download.ts`, `routes/admin/shops.ts`, `admin/src/lib/profileJob.ts`.

## 5. Data (MongoDB)

```mermaid
erDiagram
  SHOP ||--o{ REVIEW : "has"
  WISHLIST ||--o{ REVIEW : "pending until promoted"
  REVIEWER_SOURCE ||--o{ REVIEW : "posted"
  SHOP }o--o{ CATEGORY : "in"
  SHOP ||--|| SHOP_IMAGE : "profile image"
  WISHLIST |o--o| SHOP : "promoted to"

  SHOP {
    string handle "plus previousHandles"
    string status
    string contact "email, website, phone"
  }
  REVIEW {
    string postShortcode
    string status "pending, published, rejected"
    string outcome
    string direction
    object raw "full Data API item"
  }
  WISHLIST {
    string handle
    int requestCount
    string sources "dm, reviewer_post"
  }
  REVIEWER_SOURCE {
    string handle
    bool follow
    int backfillLimit
    date lastSeenPostAt
  }
  POST_OWNER {
    string shortcode
    string ownerUsername
  }
  DM_EVENT {
    string mid
    string result
    string targetHandle
  }
  JOB_RUN {
    string type
    object counts
    string error
  }
```

Also `admins` and `loginAttempts` (admin login with TOTP, same formats as pagesanj) and `deletionRequests`.

## 6. Admin panel and website

- **Admin** (`admin/`, Vite + React, served at `/admin`). The screens are pending reviews, wishlist, shops, categories, reviewer sources and jobs. Login needs a password plus a TOTP code, and every write needs a CSRF token. Bull Board is at `/admin/queues`.
- **Website** (`web/`, Vite + React SSR, rendered by Express at `/`). It has the landing page and the legal pages Meta requires (`/privacy`, `/terms`, `/data-deletion` plus a deletion-status lookup), in fa (RTL, the default) and en.

## 7. Configuration

Everything goes through `backend/src/config/env.ts`; the template is `backend/.env.example`.

| Variable | For |
|---|---|
| `MONGODB_URI`, `REDIS_URL` | Data and queues (Redis must use `maxmemory-policy noeviction`). |
| `BOXAPI_INSTAGRAM_DM_TOKEN` | DM & Comment API (`X-Api-Key`): sending replies. |
| `BOXAPI_DM_BASE_URL` | DM API host. Defaults to `https://api.sendbox.chat/api/v1` (SendBox, BoxAPI's DM service outside Iran). |
| `BOXAPI_WEBHOOK_SECRET` | Checking webhook signatures. Until it's set, every webhook is rejected. |
| `BOXAPI_INSTAGRAM_TOKEN` | Data API (Bearer): posts, post owners, profiles, quota. |
| `BOXAPI_INSTAGRAM_BASE_URL` | Data API host. Defaults to `https://instagram.boxpi.ir`; **set it to `https://boxapi.ir`**, because our current token is only accepted there. |
| `BOXAPI_AI_TOKEN` | AI API (Jev models). Not used yet. |
| `REVIEW_IGNORE_HANDLES` | Tagged handles that aren't shops (sponsors). |
| `DAILY_CHECK_CRON` | Daily check time (default `0 9 * * *`, Asia/Tehran). |
| `SESSION_SECRET`, `DATA_ENCRYPTION_KEY` | Admin sessions; encryption key shared with pagesanj. |

> **Quota:** the BoxAPI Data API plan is small (10 requests a month at the time of writing). Each backfill page, daily-check page, post-owner lookup and profile fetch uses one request. The Jobs page shows what's left.

## 8. Running it

```bash
npm install
npm run dev          # web process  → http://localhost:3000
npm run dev:worker   # worker process (needed for replies, lookups, daily check)
npm run dev:admin    # admin panel dev server
npm run dev:web      # website dev server
npm test             # backend tests (vitest, in-memory MongoDB)
```
