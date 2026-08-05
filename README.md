# OutSource — Multi-Vendor E-Commerce Platform

**A multi-vendor marketplace where independent sellers open a storefront, list products, and manage orders, while buyers shop across every shop from one place — checkout, live seller chat, and order tracking included.** It's built as an 11-service backend behind a single API gateway with three separate frontends (buyer, seller, admin), the kind of split most real e-commerce platforms actually use once one team can no longer own everything.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Nx](https://img.shields.io/badge/Nx_Monorepo-143055?style=flat&logo=nx&logoColor=white)](https://nx.dev/)

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Notable Engineering Decisions / Challenges Solved](#notable-engineering-decisions--challenges-solved)
- [Screenshots / Demo](#screenshots--demo)
- [Getting Started / Local Setup](#getting-started--local-setup)
- [Folder Structure](#folder-structure)
- [About This Project](#about-this-project)

---

## Key Features

Grouped by which of the three apps they live in. Everything listed is implemented in the codebase — nothing here is aspirational.

**🛍️ Buyer app (`user-ui`)**
- Product catalog with category browsing, filtering, and keyword search (redirects to a filtered product listing)
- Shop directory — browse individual seller storefronts, follow/unfollow a shop
- Cart and wishlist (persisted client-side via Zustand)
- Full checkout flow with **Stripe** payment intents, order confirmation, and order history
- Personalized product recommendations (see [engineering decisions](#notable-engineering-decisions--challenges-solved))
- Real-time **buyer ↔ seller chat** over WebSocket, with unread-message badges
- Auth: signup/login with **email OTP verification**, forgot-password flow, JWT session with silent token refresh
- Saved shipping addresses, editable profile, offers/deals page

**🏪 Seller dashboard (`seller-ui`)**
- Seller signup with shop creation, country selection, and OTP-verified onboarding
- Stripe Connect–based seller payout onboarding
- Product CRUD — create/edit/delete/restore, with a 24-hour soft-delete grace period before a cron job purges it permanently
- Event/discount campaign creation, discount code management (percentage or flat, scoped to the seller's own shop)
- Order management and a payments ledger (seller earnings vs. platform fee, broken out per order)
- Image upload/management via ImageKit
- Same real-time chat, now on the seller side, with online-presence indicators

**🛠️ Admin dashboard (`admin-ui`)**
- Platform-wide user, seller, and product management tables (search + role filtering)
- Order and payment oversight across every shop, with CSV export
- Admin management — promote existing users to admin
- Live application log viewer streamed over WebSocket (Kafka-backed), with severity filtering and download
- **AI analytics assistant** — ask natural-language questions about store performance, answered by Gemini grounded in the platform's own analytics data (see below)
- World-map + time-series analytics dashboard (visitor geography, revenue trend, device breakdown)

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | ![Next.js](https://img.shields.io/badge/-Next.js_16-black?style=flat-square&logo=next.js) ![React](https://img.shields.io/badge/-React_19-61DAFB?style=flat-square&logo=react&logoColor=black) ![TailwindCSS](https://img.shields.io/badge/-Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Zustand](https://img.shields.io/badge/-Zustand-593d88?style=flat-square) Jotai · React Query (TanStack) · React Table · React Hook Form · Recharts · react-simple-maps (D3-geo) · styled-components |
| **Backend** | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/-Express_5-000000?style=flat-square&logo=express) 11 independently-deployable microservices, `express-http-proxy` API gateway, `express-rate-limit`, `ws` (raw WebSocket server), `node-cron` |
| **Database** | ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma) One shared Prisma schema (20 models) across all services |
| **Messaging / Caching** | ![Kafka](https://img.shields.io/badge/-Kafka-231F20?style=flat-square&logo=apachekafka) (Confluent Cloud, 3 topics) · ![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat-square&logo=redis&logoColor=white) (Upstash — OTP throttling, presence, unread counts, payment sessions) |
| **Auth** | JWT access/refresh tokens, role-scoped HTTP-only cookies (`user` / `seller` / `admin`), bcrypt password hashing, email-OTP verification |
| **Payments** | ![Stripe](https://img.shields.io/badge/-Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white) Payment Intents (buyer checkout) + Stripe Connect (seller payouts) |
| **AI / ML** | ![TensorFlow.js](https://img.shields.io/badge/-TensorFlow.js-FF6F00?style=flat-square&logo=tensorflow&logoColor=white) content-based recommender (cosine similarity) · Google Gemini (`@google/genai`) for the admin analytics assistant |
| **Email / Media** | Nodemailer + EJS templates (OTP, seller activation emails) · ImageKit (product image CDN/upload) |
| **DevOps / Monorepo** | ![Nx](https://img.shields.io/badge/-Nx-143055?style=flat-square&logo=nx&logoColor=white) Nx 23 monorepo, esbuild/webpack per-app builds, Docker (auth-service), Swagger/OpenAPI docs (auth + product services) |
| **Testing** | Jest + ts-jest configured at the workspace level (see [Getting Started](#getting-started--local-setup) for current test status — this is flagged honestly below, not glossed over) |

---

## Architecture Overview

The system is a **microservices architecture behind a single API gateway**. The gateway doesn't contain business logic — it terminates CORS/rate-limiting policy and reverse-proxies each request by path prefix to the right backend service, each of which is its own Express process on its own port. All eleven services read and write through **one shared Prisma schema** against a single MongoDB database, so data modeling stays centralized even though request handling is split by domain. Two things run *outside* the request/response cycle: **Kafka** carries analytics events and chat messages asynchronously so the client-facing path never blocks on a database write, and a **cron job** periodically retrains cached product recommendations and purges soft-deleted products.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   user-ui    │   │  seller-ui   │   │   admin-ui   │
│ (Next.js :3000) │ │ (Next.js :3001) │ │ (Next.js :3002) │
└───────┬──────┘   └───────┬──────┘   └───────┬──────┘
        │                  │                  │
        └────────────┬─────┴─────┬────────────┘
                      │  HTTPS    │  WebSocket (chat, logs)
                      ▼           ▼
              ┌────────────────────────┐
              │   api-gateway  :8080    │  CORS · rate-limit · reverse proxy
              └────────────┬────────────┘
       ┌────────┬──────────┼──────────┬─────────┬──────────┐
       ▼        ▼          ▼          ▼         ▼          ▼
   auth-svc  product-svc order-svc admin-svc seller-svc recommendation-svc
    :6001      :6002      :6004     :6005     :6009        :6010
       │        │          │          │         │             │
       └────────┴────┬─────┴──────────┴─────────┴─────────────┘
                      ▼
             ┌─────────────────┐        ┌───────────────┐
             │  MongoDB (Prisma) │◄─────►│  Redis (Upstash) │
             │  1 schema, 20 models│      │ OTP · presence · │
             └─────────────────┘        │ unread counts    │
                      ▲                  └───────────────┘
                      │
       ┌──────────────┴───────────────┐
       │      Kafka (Confluent)         │
       │ users-events · chat_new_message │
       │           · logs                │
       └──────────────┬───────────────┘
              ┌────────┴────────┐
              ▼                 ▼
      kafka-service :–    chatting-service :6006
    (analytics writer)   logger-service :6008
                          (WebSocket chat + live log stream)
```

**Request flow, buyer checkout as an example:** `user-ui` calls the gateway → proxied to `order-service` → order/cart state written to MongoDB and a short-lived payment session cached in Redis (`payment_session:{id}`, 10-minute TTL) → Stripe Payment Intent created → on success, a `users-events` Kafka event fires for `purchase` → `kafka-service` consumes it asynchronously and updates the buyer's interaction profile used by the recommender.

---

## Notable Engineering Decisions / Challenges Solved

**1. Real-time chat without blocking the database on the hot path.**
The chat service accepts raw WebSocket connections (`ws`, not Socket.IO) and maps connected users to live sockets in memory for instant delivery — but instead of writing every message to MongoDB synchronously, it publishes to a Kafka topic (`chat_new_message`) and a separate consumer batches writes every 3 seconds via `prisma.message.createMany()`. If the batch write fails, the buffer is re-queued rather than dropped, giving at-least-once delivery without slowing down the socket itself.

**2. Content-based recommendations that don't need a training pipeline.**
Rather than standing up a full ML training pipeline, the recommender builds a per-user interest vector from weighted interaction history (`purchase: +6`, `add_to_cart: +4`, `remove_from_cart: -2`, …) with **exponential recency decay** (14-day half-life), vectorizes candidate products against the same category/tag vocabulary, and scores them with cosine similarity computed via TensorFlow.js tensor ops. Results are cached per-user and refreshed on a 30-minute cron for recently-active users only, with a synchronous on-demand fallback for brand-new users — a batch-plus-fallback design that avoids scoring the whole catalog on every page load.

**3. Application-layer multi-tenancy instead of per-tenant databases.**
All shops share one MongoDB database and one Prisma schema, so tenant isolation is enforced explicitly in each mutating controller: every product/discount-code write checks the resource's `shopId`/`sellerId` against the authenticated seller's own shop before allowing the change, rather than trusting the request body. Simpler to operate than database-per-tenant, at the cost of every write path needing this check done correctly.

**4. Three-role auth with a shared refresh pipeline.**
Users, sellers, and admins all authenticate via JWT access/refresh pairs, but sellers get separate cookie names (`seller_access_token`) from users/admins (`access_token`) since a browser can be logged in as a buyer and a seller simultaneously. The refresh-token endpoint has to branch on the role encoded in the JWT to look the account up in the right table and reissue the right cookie — a design that's easy to get subtly wrong (a missing role branch silently breaks that role's session refresh) and required careful tracing of the working path against the broken one to fix in practice.

**5. Decoupled, replayable analytics instead of writing directly from the request handler.**
Every buyer interaction (product view, cart/wishlist change, shop visit) is fired at the client as a Kafka event rather than written to Mongo inline with the request. `kafka-service` consumes `users-events` into an in-memory queue flushed every 3 seconds, updating per-user, per-product, and per-shop analytics documents that power both the recommender and the admin AI-analytics assistant — keeping the write-heavy analytics path off of every buyer's page-load latency.

---

## Screenshots / Demo

> Screenshots not yet captured — replace the placeholders below once available.

| Buyer storefront | Seller dashboard | Admin analytics |
|---|---|---|
| ![Buyer storefront](<img width="1917" height="1032" alt="image" src="https://github.com/user-attachments/assets/f3d036e3-8148-4a95-a6ea-bc47824cb981" />
) | ![Seller dashboard](<img width="1917" height="1028" alt="image" src="https://github.com/user-attachments/assets/491e8bd8-d54f-46f0-98b7-a5a08e44fa1d" />
) | ![Admin analytics](<img width="1916" height="1026" alt="image" src="https://github.com/user-attachments/assets/f9cbc908-43a7-4041-86a8-f49aff87c986" />
) |



---

## Getting Started / Local Setup

### Prerequisites

- Node.js 18+ and npm
- A MongoDB connection string (Atlas or self-hosted)
- A Redis instance (Upstash or self-hosted)
- A Confluent Cloud (or any SASL/SSL Kafka) cluster + API key/secret
- Stripe account (test-mode keys are fine)
- Gemini API key (only needed for the admin AI-chat feature)
- ImageKit account (only needed for product image uploads)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

This is an Nx monorepo — env vars are split between one **root `.env`** (shared backend secrets) and **per-app `.env` files** for the three frontends. None of these are committed (see `.gitignore`); create them yourself:

**`.env`** (repo root — used by every backend service via Prisma/shared libs):

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

### 3. Generate the Prisma client

```bash
npx prisma generate
```

### 4. Run everything

```bash
npm run dev          # runs `nx run-many --target=serve --all` — every backend service + all 3 frontends
```

Or run pieces individually while working on a single app:

```bash
npm run user-ui       # user-ui only, http://localhost:3000
npm run seller-ui      # seller-ui only, http://localhost:3001
npm run admin-ui       # admin-ui only, http://localhost:3002
npx nx serve auth-service    # any individual backend service, e.g. http://localhost:6001
```

Service ports (fixed, read from each service's `main.ts`):

| Service | Port | Service | Port |
|---|---|---|---|
| api-gateway | 8080 | admin-service | 6005 |
| auth-service | 6001 | chatting-service | 6006 |
| product-service | 6002 | logger-service | 6008 |
| order-service | 6004 | seller-service | 6009 |
| — | — | recommendation-service | 6010 |

### 5. API docs (optional)

```bash
npm run auth-docs      # generates apps/auth-service/src/swagger-output.json
npm run product-docs    # generates apps/product-service/src/swagger-output.json
```

### Testing

The workspace has Jest + `ts-jest`/`@swc/jest` configured (`jest.config.ts`, `jest.preset.js`), but the current test suite is scaffolding only — being upfront about this rather than implying more coverage than exists.

---

## Folder Structure

```
eshop/
├── apps/
│   ├── api-gateway/          # Express reverse proxy: CORS, rate-limiting, routes to every service
│   ├── auth-service/          # Signup/login, OTP verification, JWT issue + refresh, addresses
│   ├── product-service/       # Product CRUD, categories, discount codes, soft-delete cron
│   ├── order-service/         # Cart → Stripe checkout → order persistence, payment sessions
│   ├── seller-service/        # Seller profile + shop image management
│   ├── admin-service/         # Admin user/seller/order management, Gemini AI-analytics endpoint
│   ├── chatting-service/      # WebSocket chat server + Kafka-backed message persistence
│   ├── kafka-service/         # Consumes buyer interaction events, updates analytics
│   ├── logger-service/        # Consumes app logs from Kafka, streams to admin UI over WebSocket
│   ├── reccomendation-service/ # TensorFlow.js content-based recommender + retrain cron
│   ├── user-ui/               # Buyer-facing Next.js storefront
│   ├── seller-ui/             # Seller dashboard (Next.js)
│   └── admin-ui/              # Admin dashboard (Next.js)
├── packages/
│   ├── libs/                  # Shared Prisma client, Redis client, ImageKit client
│   ├── middleware/             # isAuthenticated / isOptionalAuth / role guards (isUser/isSeller/isAdmin)
│   ├── error-handler/          # Typed error classes + Express error middleware
│   ├── utils/                  # Kafka client factory, shared log producer
│   ├── components/             # Shared React form inputs (used by seller-ui + admin-ui)
│   └── types/                  # Shared TypeScript types
├── prisma/
│   └── schema.prisma           # Single schema (20 models) shared by every backend service
├── nx.json                     # Nx workspace configuration
└── package.json                # Root scripts (dev, per-app dev shortcuts, doc generation)
```

---

## About This Project

I built OutSource to force myself past "one backend, one frontend" and into what a real multi-vendor platform actually needs: separate trust boundaries for buyers, sellers, and admins, data that has to stay isolated between shops sharing one database, and a chat/analytics path that can't just block on every request. Splitting the backend into eleven services behind a gateway taught me a lot about where to put a boundary and where not to — some of those services (like `logger-service` at 71 lines) probably didn't need to be their own service, and I'd merge a few of them if I did this again.

The parts I'm most glad I pushed through rather than took a shortcut on were the Kafka-backed chat write path and getting the three-role JWT refresh flow actually correct — both looked simple until I had to reason carefully about ordering and failure cases. I also learned the limits of what I built: there's no automated test suite here yet, and the recommender has no offline evaluation, which are the two things I'd prioritize next if I kept building on this.
