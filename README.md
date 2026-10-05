# OutSource — Multi-Vendor E-Commerce Platform

**A multi-vendor marketplace built the way real ones are: independent sellers run their own storefront, buyers shop across every shop from one place, and an admin oversees the whole platform. Three Next.js apps, a TypeScript API gateway with nine domain services behind it, Kafka for the event pipeline, Stripe for payments.**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Nx](https://img.shields.io/badge/Nx_Monorepo-143055?style=flat&logo=nx&logoColor=white)](https://nx.dev/)
[![CI](https://github.com/gautamprabhu07/Ecom-SaaS/actions/workflows/ci.yml/badge.svg)](https://github.com/gautamprabhu07/Ecom-SaaS/actions/workflows/ci.yml)
<!-- coverage-badge -->[![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat)](CONTRIBUTING.md#running-the-tests)<!-- /coverage-badge -->

> **Running locally:** this project is built to be demoed on localhost, not hosted. Jump to [Run it locally](#run-it-locally) (about 10 minutes, free-tier accounts only) or to the [screenshots](#screenshots).

---

## The 30-second version

| | |
|---|---|
| **What it is** | A full multi-vendor marketplace: buyer storefront, seller dashboard, admin console |
| **Scale of the codebase** | 13 apps in one Nx monorepo: 3 Next.js frontends, an API gateway and 9 Express services; 1 shared Prisma schema (20 models) on MongoDB |
| **Hardest problems solved** | Exactly-once effects on an at-least-once Kafka pipeline · three-role auth with silent refresh · per-shop data isolation in one shared database · money maths and webhook idempotency at checkout |
| **Proof, not claims** | 192 unit + 28 integration tests · CI on every push · a recommender evaluated against baselines with confidence intervals · indexes backed by before/after benchmarks · a Kafka pipeline verified by killing it mid-flight |
| **Honest about limits** | Seed data is synthetic, the recommender ties a one-line heuristic, several services are untested. See [Limitations](#limitations) |

---

## Table of Contents

- [Key features](#key-features)
- [Engineering highlights](#engineering-highlights)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Screenshots](#screenshots)
- [Run it locally](#run-it-locally)
- [Testing and CI](#testing-and-ci)
- [Limitations](#limitations)
- [Folder structure](#folder-structure)
- [Further reading](#further-reading)
- [About this project](#about-this-project)

---

## Key features

Everything listed is implemented and working; nothing here is aspirational.

**Buyer app (`user-ui`)**
- Catalog with category browsing, filtering, keyword search and offers
- Shop directory: visit seller storefronts, follow and unfollow shops
- **Shop reviews** with a star rating and a distribution chart. Only buyers who have a paid order from that shop can review, once, and can edit or delete their own review
- **Notification bell** with unread badge (order status changes, polled every 60 s)
- Cart, wishlist, **Stripe checkout**, order history
- Personalised recommendations
- Real-time buyer to seller chat over WebSocket
- Email-OTP signup, forgot-password, JWT sessions with silent refresh, saved addresses

**Seller dashboard (`seller-ui`)**
- OTP-verified onboarding, shop creation, Stripe Connect payout onboarding
- Product create, edit, delete and restore, with a 24-hour soft-delete window before a cron job purges
- Discount codes (percentage or flat) and offer campaigns, scoped to the seller's own shop
- Orders, payments ledger (earnings versus the 10% platform fee), delivery-status updates that notify the buyer
- **Live analytics from real data:** revenue over time with 7/30/90/180-day ranges and period-over-period change, device split, a visitor world map, a view-to-purchase conversion funnel, top products, recent orders
- Notification bell (new orders, new reviews) and real-time chat

**Admin console (`admin-ui`)**
- Platform-wide users, sellers, products and orders with search, filters and CSV export; promote users to admin
- The same analytics dashboard, computed across the whole platform
- **Live application logs** streamed over WebSocket from Kafka
- **AI analytics assistant**: ask questions about store performance, answered by Gemini grounded in the platform's own data

---

## Engineering highlights

These are the parts I would want to talk through in an interview. Each links to the evidence.

### 1. A Kafka pipeline that is correct when things crash
Buyer events and chat messages go through Kafka so the request path never waits on a database write. Delivery is **at-least-once**, so the consumers are built to make repeats harmless: events carry an id that Redis remembers for 24 hours, offsets are committed only *after* processing, failing events are retried with backoff and then **dead-lettered** (with a Mongo fallback if the DLQ topic itself is unreachable), and shutdown flushes in-flight work. I verified it rather than assuming it: hard-killing the service with a full buffer and checking that every event was applied exactly once after restart. Testing it also uncovered five real bugs (lost events on never-committed partitions, a stuck flush guard, a DLQ publish that stalled the consumer, among them). Full write-up: [`docs/kafka.md`](docs/kafka.md).

### 2. A recommender that is evaluated honestly
Content-based recommendations: a per-user interest vector from weighted actions (`purchase +6`, `add_to_cart +4`, `remove_from_cart -2`...) with exponential recency decay, scored by cosine similarity in TensorFlow.js. An offline harness (`npm run eval:ml`) runs a leave-last-k-out temporal split with bootstrap confidence intervals:

| Strategy | Precision@10 | NDCG@10 |
|---|---:|---:|
| **Content-based model** | **0.102** | **0.281** |
| Top-category popularity | 0.104 | 0.238 |
| Random | 0.018 | 0.039 |
| Popularity | 0.006 | 0.017 |

It clearly beats random and popularity. It is **statistically tied** with a one-line "best sellers in your favourite category" rule, and the data is synthetic with a planted preference, so this shows the mechanism works, not that it would win on real shoppers. I would rather say that plainly than overclaim. Report with methodology and ablations: [`docs/ml-evaluation.md`](docs/ml-evaluation.md).

### 3. Per-shop data isolation in one shared database
All shops share one MongoDB database, so tenant isolation is enforced in code. The dashboard queries take a scope: the admin passes none, the seller endpoints **always** build it from the authenticated seller's own shop and never from anything the client sends. I proved it numerically: the ten sellers' revenues add up exactly to the platform total, and every mutating product and order endpoint checks ownership. Authorization failures return `403`, not `401`, because the frontend treats `401` as "refresh the session" and would otherwise loop.

### 4. Dashboards that are real aggregations, not mock charts
Revenue, funnel, device, geography and top-product numbers come from MongoDB aggregations shared by the admin and seller services. Along the way the cross-check caught a subtle bug: a MongoDB aggregation cursor silently returns only its first 101 rows, so a 180-day chart was missing its most recent 79 days (API said $60,898, the database said $92,360). Fixed, and covered by tests.

### 5. Checkout you can trust
Stripe webhooks are retried, so the order handler has to be idempotent. The payment session is consumed the moment the orders are saved, and email and notifications are best-effort, so no failure after that point can create duplicate orders (a real duplicate-order bug I found and fixed). The money rules (10% platform fee rounded down, percentage and flat coupons capped at the line price, per-shop totals) live in a pure module with unit tests, and the integration tests drive a multi-shop cart through the webhook against a real database, checking totals and stock.

### 6. Indexes measured, not guessed
The schema had no indexes. I benchmarked the hottest queries on a throwaway database (30,000 products, 60,000 orders, 100,000 messages), added 14 indexes, and re-measured. Typical results at p50: listing by category and price **-59%**, products by shop **-67%**, a buyer's order history **-68%**, order items **-68%**. It also records what *didn't* work: an index that made "top shops" 66% slower (dropped), and keyword search needing a text index rather than a B-tree. Full table: [`docs/performance.md`](docs/performance.md).

### 7. Tests that found real bugs
The test suite is not decoration. Writing it exposed: any cart with two or more items crashing at payment-session creation (`.localCompare` is not a function), production builds failing on six pages (`useSearchParams` without a Suspense boundary), and a checkout crash for a buyer with no email. I also checked the suite is real by reintroducing an old bug and confirming a test fails.

---

## Architecture

An API gateway reverse-proxies each path prefix to the service that owns it. All services share one Prisma schema against one MongoDB database. Kafka carries analytics events, chat messages and logs asynchronously; a cron job retrains cached recommendations and purges soft-deleted products.

```
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│    user-ui     │   │   seller-ui    │   │    admin-ui    │
│ Next.js :3000  │   │ Next.js :3001  │   │ Next.js :3002  │
└───────┬────────┘   └───────┬────────┘   └───────┬────────┘
        └─────────────┬──────┴──────┬─────────────┘
                      │ HTTP        │ WebSocket (chat, logs)
                      ▼             ▼
              ┌──────────────────────────┐
              │   api-gateway  :8080     │  CORS · rate limit (Redis) · reverse proxy
              └─────────────┬────────────┘
   ┌──────────┬─────────────┼──────────┬───────────┬──────────────┐
   ▼          ▼             ▼          ▼           ▼              ▼
 auth      product        order      admin       seller    recommendation
 :6001      :6002         :6004      :6005       :6009        :6010
   └──────────┴──────┬──────┴──────────┴───────────┴──────────────┘
                     ▼
         ┌───────────────────────┐       ┌────────────────────────┐
         │  MongoDB (Prisma)     │◄─────►│  Redis (Upstash)       │
         │  1 schema, 20 models  │       │  OTP · idempotency ·   │
         └───────────────────────┘       │  presence · sessions   │
                     ▲                   └────────────────────────┘
                     │
        ┌────────────┴────────────────┐
        │  Kafka (Confluent Cloud)    │
        │  users-events · chat_new_message · logs  (+ .dlq topics)
        └────────────┬────────────────┘
          ┌──────────┼─────────────┐
          ▼          ▼             ▼
    kafka-service  chatting     logger
     (analytics)   :6006        :6008
                   (chat WS)    (log stream WS)
```

**Checkout, end to end:** `user-ui` calls the gateway → `order-service` stores a short-lived payment session in Redis (10-minute TTL) → Stripe PaymentIntent with a 10% application fee → Stripe's webhook confirms payment → one order per shop is saved, stock decremented, the session consumed, buyer emailed and sellers notified → a `purchase` event flows through Kafka into the analytics the recommender and dashboards read.

---

## Tech stack

| Category | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, TanStack Query, Zustand, Jotai, React Hook Form, Recharts, react-simple-maps |
| **Backend** | Node.js, Express 5, `express-http-proxy` gateway, `express-rate-limit` (Redis-backed), `ws`, `node-cron` |
| **Data** | MongoDB with Prisma (one shared schema, 20 models, 14 benchmarked indexes) |
| **Messaging / cache** | Kafka on Confluent Cloud (`kafkajs`, dead-letter queues), Redis on Upstash |
| **Auth** | JWT access and refresh tokens, role-scoped HTTP-only cookies (user / seller / admin), bcrypt, email OTP with throttling and lockout |
| **Payments** | Stripe PaymentIntents and Stripe Connect |
| **AI / ML** | TensorFlow.js content-based recommender, Google Gemini for the admin assistant |
| **Media / email** | ImageKit, Nodemailer with EJS templates |
| **Tooling** | Nx monorepo, TypeScript, Jest + SWC, ESLint, GitHub Actions |

---

## Screenshots

> Add images to `docs/screenshots/` using the file names below; the table renders as soon as they exist.

| Buyer storefront | Shop page with reviews | Checkout |
|---|---|---|
| ![Buyer storefront](docs/screenshots/user-home.png) | ![Shop reviews](docs/screenshots/user-shop-reviews.png) | ![Checkout](docs/screenshots/user-checkout.png) |

| Seller dashboard | Seller notifications | Product management |
|---|---|---|
| ![Seller dashboard](docs/screenshots/seller-dashboard.png) | ![Notifications](docs/screenshots/seller-notifications.png) | ![Products](docs/screenshots/seller-products.png) |

| Admin analytics | Live logs | AI assistant |
|---|---|---|
| ![Admin dashboard](docs/screenshots/admin-dashboard.png) | ![Live logs](docs/screenshots/admin-logs.png) | ![AI assistant](docs/screenshots/admin-ai-assistant.png) |

---

## Run it locally

### Prerequisites

- Node.js 20+ and npm
- Free-tier accounts for the managed services: **MongoDB Atlas**, **Upstash Redis**, **Confluent Cloud** (Kafka)
- A **Stripe** account (test-mode keys) for checkout
- Optional: a **Gemini** API key (admin AI assistant), **ImageKit** (product image uploads), an SMTP account (OTP emails)

### 1. Install

```bash
npm install
npx prisma generate
```

### 2. Configure environment variables

Shared backend secrets live in one **root `.env`**; each frontend has its own `.env`. None are committed.

**`.env`** (repo root):

```bash
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db>"
REDIS_DATABASE_URL="rediss://<user>:<password>@<host>:<port>"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SERVICE="gmail"
SMTP_USER="<your-smtp-user>"
SMTP_PASSWORD="<your-smtp-app-password>"

ACCESS_TOKEN_SECRET="<random-secret>"
REFRESH_TOKEN_SECRET="<random-secret>"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

KAFKA_API_KEY="<confluent-api-key>"
KAFKA_API_SECRET="<confluent-api-secret>"

IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."

GEMINI_API_KEY="<gemini-api-key>"
```

**`apps/user-ui/.env`**

```bash
NEXT_PUBLIC_SERVER_URL="http://localhost:8080"
NEXT_PUBLIC_SELLER_SERVER_URL="http://localhost:3001"
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."
NEXT_PUBLIC_CHATTING_WEBSOCKET_URL="ws://localhost:6006"
```

**`apps/seller-ui/.env`**

```bash
NEXT_PUBLIC_SERVER_URL="http://localhost:8080"
NEXT_PUBLIC_USER_UI_URL="http://localhost:3000"
NEXT_PUBLIC_CHATTING_WEBSOCKET_URL="ws://localhost:6006"
```

**`apps/admin-ui/.env`**

```bash
NEXT_PUBLIC_SERVER_URL="http://localhost:8080"
NEXT_PUBLIC_USER_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="ws://localhost:6008"
GEMINI_API_KEY="<gemini-api-key>"
```

Kafka topics to create once in the Confluent console: `users-events`, `chat_new_message`, `logs`, plus the dead-letter topics `users-events.dlq` and `chat_new_message.dlq` (details in [`docs/kafka.md`](docs/kafka.md)).

### 3. Load demo data

```bash
npm run seed
```

This fills the database with a realistic marketplace: **10 shops across 10 categories, 200 products with category-matched images, 50 buyers, ~400 orders spread over a year, 150 reviews**, plus the analytics that power the dashboards. It is safe to re-run, and it never touches accounts you created yourself. The script prints the demo logins when it finishes: the demo buyer and the seeded sellers all use the password `Password123!`, with emails ending in `@seed.outsource.dev`.

### 4. Start everything

```bash
npm run dev            # every backend service and all three frontends
```

| App | URL | Service | Port |
|---|---|---|---|
| Buyer storefront | http://localhost:3000 | api-gateway | 8080 |
| Seller dashboard | http://localhost:3001 | auth / product | 6001 / 6002 |
| Admin console | http://localhost:3002 | order / admin | 6004 / 6005 |
| | | chatting / logger | 6006 / 6008 |
| | | seller / recommendation | 6009 / 6010 |

Or run one piece: `npm run user-ui`, `npm run seller-ui`, `npm run admin-ui`, `npx nx serve auth-service`.

### 5. Try it

1. Log in to the buyer app with the demo buyer, browse a shop, add items to the cart and check out with Stripe's test card `4242 4242 4242 4242`. (Checkout needs the Stripe webhook forwarded locally: `stripe listen --forward-to localhost:6004/api/create-order`.)
2. Log in to the seller dashboard with one of the seeded sellers to see revenue, funnel, geography and top products, then change the date range.
3. Use the admin console for the platform-wide view, live logs and the AI assistant. An admin account is a normal user whose `role` is `admin`: promote one from an existing admin, or set the field in MongoDB.

API docs: `npm run auth-docs` and `npm run product-docs` generate Swagger files for those two services.

---

## Testing and CI

```bash
npm run test:unit          # 192 unit tests, no database needed (~10 s)
npm run test:coverage      # same, with a coverage report
npm run test:integration   # 28 integration tests against a real MongoDB test database
npm run lint && npm run typecheck && npm run build
```

- **Unit tests** cover the recommender's scoring and decay, OTP throttling and lockout, token and role middleware, checkout and coupon maths, product ownership, the Kafka analytics roll-up, reviews, notifications and the dashboard aggregations.
- **Integration tests** run real Express routers over HTTP against a separate `eshop_test` database: signup, OTP, login and refresh for all three roles, product create, update and delete with ownership checks, checkout totals and stock decrement, webhook replay, and review eligibility. Redis, email, Stripe and Kafka logging are faked, and the suite refuses to run against any database that is not named `eshop_test`.
- **CI** (GitHub Actions) runs install, lint, typecheck, unit tests with coverage (uploaded as an artifact) and the build of every app, on every push and pull request to `main`.
- The coverage badge reflects the business-logic files listed in `jest.unit.config.js` (about 96% of lines), **not** the whole repository. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Limitations

Things a reviewer should know, stated plainly:

- **The demo data is synthetic.** The seed generates buyers, orders and interactions, so dashboards look realistic but are not real traffic. The recommender evaluation inherits this and shows that the mechanism recovers a planted preference, not real-world performance.
- **The recommender is not clearly better than a simple heuristic.** It beats popularity and random, and ties "best sellers in your favourite category".
- **Test coverage is uneven.** The business logic named above is well covered. The admin, seller, chatting, logger and gateway services, all UI code, and most of the product-service controller have no automated tests. Integration tests are not run in CI.
- **Not deployed.** It is designed to run on localhost. There is no containerisation or production hosting, and the managed services (Atlas, Upstash, Confluent) are used on free tiers.
- **Known rough edges:** `createProduct` returns a 500 instead of a 400 when `tags` is missing; request validation is hand-written per endpoint rather than schema-driven; there is no structured logging or health-check aggregation yet; visitor location uses a plain-HTTP IP lookup that would be blocked on an HTTPS deployment; one service folder keeps an old `reccomendation` spelling.
- **Some services are small enough to merge.** `logger-service` is about 70 lines. I split by domain on purpose to practise boundaries, and I would consolidate a few if starting over.

---

## Folder structure

```
eshop/
├── apps/
│   ├── api-gateway/            # reverse proxy, CORS, Redis-backed rate limiting
│   ├── auth-service/           # signup, OTP, login, JWT refresh, addresses
│   ├── product-service/        # products, categories, discounts, shop pages, reviews
│   ├── order-service/          # cart to checkout, Stripe webhook, orders, notifications
│   ├── seller-service/         # seller profile, shop images, seller analytics
│   ├── admin-service/          # admin management, platform analytics, Gemini assistant
│   ├── chatting-service/       # WebSocket chat + Kafka-backed message persistence
│   ├── kafka-service/          # consumes buyer events, writes analytics (idempotent, DLQ)
│   ├── logger-service/         # consumes logs from Kafka, streams them to the admin UI
│   ├── reccomendation-service/ # TensorFlow.js recommender + retrain cron
│   ├── user-ui/ seller-ui/ admin-ui/   # the three Next.js apps
├── packages/
│   ├── libs/                   # Prisma, Redis, ImageKit clients; shared analytics and notifications code
│   ├── middleware/             # auth and role guards
│   ├── error-handler/          # typed errors + Express error middleware
│   ├── utils/                  # Kafka producer/consumer toolkit, shared log producer
│   ├── components/ types/      # shared React inputs and TypeScript types
├── prisma/                     # schema.prisma (20 models), seed script and seed data
├── tests/                      # unit/ and integration/ suites
├── tools/                      # recommender evaluation, DB benchmark, DB maintenance scripts
└── docs/                       # kafka.md, ml-evaluation.md, performance.md
```

---

## Further reading

- [`docs/kafka.md`](docs/kafka.md): delivery guarantees, dead-letter queues, idempotency, and how the pipeline was verified
- [`docs/ml-evaluation.md`](docs/ml-evaluation.md): recommender methodology, results, ablations, limitations
- [`docs/performance.md`](docs/performance.md): index benchmarks, before and after, with what did not work
- [`CONTRIBUTING.md`](CONTRIBUTING.md): running the unit and integration suites

---

## About this project

I built OutSource to move past "one backend, one frontend" and into what a real multi-vendor platform needs: separate trust boundaries for buyers, sellers and admins, data that stays isolated between shops sharing one database, and an event pipeline that cannot lose or double-count work when something crashes.

What I am most proud of is not any single feature but the habit of **verifying instead of assuming**: killing the Kafka consumer mid-flight, cross-checking dashboard totals against the database, benchmarking before adding an index, and publishing the recommender result even though it only ties a simple baseline. Doing that surfaced real bugs in my own code, and I fixed them and wrote them down.
