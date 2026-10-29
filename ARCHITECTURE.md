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

  subgraph web["Backend web process (npm run dev / start)<br/>Express API :3000"]
    wh["POST /webhooks/boxapi<br/>HMAC check"]
    adminapi["/admin/api/*<br/>JSON API"]
    board["/admin/queues<br/>Bull Board"]
    pub["/api/deletion-status<br/>+ /media/shop/:sha"]
  end

  adminapp["admin/ (nginx :8080)<br/>/admin SPA, proxies /admin/api + /admin/queues"]
  site["web/ (server.js :3001)<br/>SSR website"]

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

  admin --> adminapp
  adminapp --> adminapi
  adminapp --> board
  adminapi <--> db
  adminapi -- enqueue --> q4 & q5 & q6
  board --- redis

  visitor --> site
  site -- deletion status --> pub
  pub <--> db
```

The backend has **two Node processes** that share MongoDB and Redis. The website and admin app are separate services (§6).

| Process | Entry | Does |
|---|---|---|
| Web | `backend/src/server.ts` → `app.ts` | Receives webhooks, serves the admin JSON API, Bull Board, shop images and the public deletion-status API. It never calls Instagram itself: slow work goes into a queue. |
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

- **Admin** (`admin/`, Vite + React at `/admin`, served by its own nginx image that proxies `/admin/api` and `/admin/queues` to the backend). The screens are pending reviews, wishlist, shops, categories, reviewer sources and jobs. Login needs a password plus a TOTP code, and every write needs a CSRF token. Bull Board is at `/admin/queues`.
- **Website** (`web/`, Vite + React SSR, rendered by its own server `web/server.js` at `/`; it asks the backend only for deletion statuses). It has the landing page and the legal pages Meta requires (`/privacy`, `/terms`, `/data-deletion` plus a deletion-status lookup), in fa (RTL, the default) and en.

## 7. Configuration

Backend config goes through `backend/src/config/env.ts`; the template is `backend/.env.example`. The website reads `CONTACT_EMAIL`, `SITE_INSTAGRAM_HANDLE`, `COMPANY_NAME` and `API_URL` (template `web/.env.example`); the admin image reads `BACKEND_URL`.

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
npm test             # backend tests (vitest, in-memory MongoDB) and website server tests

docker compose up -d --build   # backend :3000, worker, web :3001, admin :8080, MongoDB, Redis
```

## 9. Deploying on Hamravesh (Kubernetes)

Hamravesh runs each part as its own app, the same way `docker-compose.yml` runs them side by side. Six apps in one namespace:

| App | Image | Command | Port | Public domain | Health check |
|---|---|---|---|---|---|
| `mongo` | MongoDB 7 (managed / one-click) | n/a | 27017 | no | built in |
| `redis` | Redis 7 (managed / one-click) | n/a | 6379 | no | built in |
| `backend` | `pagesanj/backend` | default (`node dist/server.js`) | 3000 | yes, BoxAPI posts the webhook here | HTTP `GET /healthz` |
| `worker` | `pagesanj/backend` (**same image**) | `node dist/worker.js` | none | no | none (it serves no HTTP) |
| `web` | `pagesanj/web` | default (`node server.js`) | 3001 | yes, the public site | HTTP `GET /healthz` |
| `admin` | `pagesanj/admin` | default (nginx) | 8080 | yes, the panel at `/admin` | HTTP `GET /healthz` |

`backend` and `worker` never call each other. The API puts jobs into Redis and the workers take them out.

### Steps

1. **Build and push the images.** Every Dockerfile uses the repo root as its build context, so clone with submodules first:
   ```bash
   git clone --recurse-submodules <root repo> && cd pagesanj
   docker build -f backend/Dockerfile -t <registry>/pagesanj/backend:<tag> .
   docker build -f web/Dockerfile     -t <registry>/pagesanj/web:<tag> .
   docker build -f admin/Dockerfile   -t <registry>/pagesanj/admin:<tag> .
   docker push <registry>/pagesanj/backend:<tag>   # and the other two
   ```
   Push to Hamravesh's registry or any registry it can pull from. Building from git inside Hamravesh also works if it can fetch the submodules and lets you set the Dockerfile path and the root context.
2. **Redis.** Give it a persistent volume, AOF on (`appendonly yes`) and `maxmemory-policy noeviction`. BullMQ can lose jobs under any other eviction policy.
3. **MongoDB.** Give it a persistent volume, and turn on backups.
4. **`backend`.** Deploy from the backend image on port 3000. Set every variable from `backend/.env.example` (§7) as app secrets/env, with:
   - `MONGODB_URI` and `REDIS_URL` pointing at the internal addresses of the `mongo` and `redis` apps (the Hamravesh panel shows them).
   - `NODE_ENV=production`, `TRUST_PROXY=true` (it runs behind Hamravesh's ingress), `PUBLIC_BASE_URL=https://<web domain>`.
   - A domain with HTTPS.
5. **`worker`.** Create a second app from the **same backend image and tag**, with the **same env vars**, and override the command to `node dist/worker.js`. No port, no domain, no HTTP health check. Set the termination grace period to 30–60s: on `SIGTERM` the worker finishes its running jobs before it exits.
6. **`web`.** Deploy from the web image on port 3001 with the `web/.env.example` variables. Set `API_URL` to the backend's internal address (`http://<backend app>:3000`). Give it the public site domain.
7. **`admin`.** Deploy from the admin image on port 8080, with `BACKEND_URL` set to the backend's internal address. Give it a domain. nginx proxies `/admin/api` and `/admin/queues`, so the panel and API share one origin and the session cookie just works.
8. **First admin.** The admin scripts run through `tsx`, a dev dependency that isn't in the image, so run them from a dev checkout. Point `backend/.env` at the production `MONGODB_URI` (for example through a port-forward to the `mongo` app), set `ADMIN_PASSWORD` and `DATA_ENCRYPTION_KEY`, then run `npm run admin:create -- <username>`. To copy admins from pagesanj, run `npm run admin:import -- <username>` instead.
9. **BoxAPI.** Set the webhook URL in the BoxAPI/SendBox panel to `https://<backend domain>/webhooks/boxapi` and copy its secret into `BOXAPI_WEBHOOK_SECRET`. Until it's set, every webhook is rejected.
10. **Check.** `GET /healthz` on backend, web and admin. Send the Instagram account a DM and follow it through Bull Board (`/admin/queues`): `dm-inbound` → `post-owner` → `dm-send`.

> **Region:** the BoxAPI defaults assume the backend is **outside Iran** (PRD §10). If the Hamravesh apps run in an Iranian data centre, switch the hosts: `BOXAPI_DM_BASE_URL=https://boxapi.ir` (the DM API's Iran host) and `BOXAPI_INSTAGRAM_BASE_URL=https://boxapi.ir`. Update PRD §10 if that becomes the plan.

### Updating

Build and push a new tag, then point **both** `backend` and `worker` at it. They share models and queue payloads, so they should always run the same version.

### Scaling

- **More workers: raise `worker`'s replica count.** BullMQ locks each job in Redis, so each job runs on exactly one replica.
  - The daily scheduler is registered with a fixed id (`upsertJobScheduler`), so extra replicas don't create duplicate daily runs.
  - The `dm-send` limiter (10 sends/s) and the per-recipient send limit live in Redis, so they stay global however many replicas run.
  - `concurrency` is **per process**: `post-owner` and `shop-profile` run 2 jobs each per replica, so 3 replicas make 6 Data API calls at once. Check that against the BoxAPI plan and its quota (§7).
  - Most of the work is waiting on BoxAPI, so if one queue backs up, raise that worker's `concurrency` before adding replicas.
- **More API: raise `backend`'s replica count.** The web process holds no state in memory: admin sessions are signed cookies and everything else is in MongoDB or Redis.
- Run **one** MongoDB and **one** Redis. Every replica of every app shares them.
