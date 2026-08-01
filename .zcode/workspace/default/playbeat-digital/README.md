# 🎵 PlayBeat Digital

> **Your Digital World. One Powerful Marketplace.**

A production-grade, full-stack e-commerce & digital-products platform built with **Node.js/Express + MongoDB** on the backend and **React (Vite) + Tailwind CSS** on the frontend. It ships with a customer storefront, a complete admin dashboard, secure authentication, real payment webhooks, encrypted digital-inventory delivery, a homepage CMS, support tickets, analytics, and Vercel-ready deployment.

---

## ✨ Features

### Storefront
- Premium dark/glassmorphism UI with animated gradients
- Dynamic homepage driven entirely from the **Homepage CMS** (no hardcoded sections)
- Product catalog with search, filters, sorting, pagination, variants & reviews
- Product detail with image gallery, JSON-LD structured data, related products
- Persistent server-side cart + guest cart (merged on login), coupon codes
- Secure checkout with Stripe / Lemon Squeezy / manual payments
- Customer dashboard: orders, digital downloads, support tickets, wishlist, profile

### Admin Panel (`/admin`)
- Dashboard with revenue/orders/customer KPIs + charts (revenue, top products, categories)
- Products & categories management with variants
- **Encrypted digital inventory** management: single add, bulk import, CSV export, reveal
- Orders: status, notes, resend delivery, refunds, manual-delivery verification
- Customers, payments, coupons, reviews moderation
- **Homepage Builder** (add/reorder/toggle/configure sections live)
- Support tickets with internal notes, assignment, priorities
- Settings (payments, email, SEO, social, announcements), admin users, audit logs

### Backend
- REST API, JWT auth, HTTP-only cookies, **role-based access control** (superadmin/admin/manager/support)
- Helmet, CORS allowlist, rate limiting, input validation, mongo-sanitize, XSS-safe error handling
- **Serverless-safe** MongoDB connection caching + retry logic
- **Transaction-safe inventory reservation** (atomic, no double-delivery)
- **Real payment verification** via Stripe & Lemon Squeezy webhooks (never fake confirmations)
- **AES-256-GCM encryption** of digital payloads at rest
- Audit logging of every sensitive admin action
- Transactional email (nodemailer/SMTP) with graceful dev fallback
- Sitemap + health endpoint

---

## 🧱 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS, Recharts, React Helmet Async, Axios |
| Backend | Node.js, Express 4, Mongoose 8, JWT, bcrypt, Stripe SDK, nodemailer |
| Database | MongoDB Atlas (or local MongoDB) |
| Tests | Jest + Supertest + mongodb-memory-server (backend), Vitest (frontend) |
| Deploy | Vercel (frontend as static SPA, backend as a Vercel Function) |

---

## 📁 Project Structure

```
playbeat-digital/
├── backend/                 # Express API (Vercel project 2)
│   ├── api/index.js         # Serverless entry (Vercel Function)
│   ├── src/
│   │   ├── config/          # env + cached DB connection
│   │   ├── models/          # 16 Mongoose models
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # Express routers (/api/*)
│   │   ├── middleware/      # auth, RBAC, errors, rate limit, audit
│   │   ├── services/        # email, inventory, delivery, payments, orderFlow
│   │   ├── utils/           # token, crypto, pricing, numbering...
│   │   ├── validators/      # express-validator rules
│   │   ├── jobs/            # reservation-expiry sweep
│   │   └── seed/            # seedAdmin.js + seedDemo.js
│   ├── tests/               # Jest API + service tests
│   └── vercel.json
├── frontend/                # React SPA (Vercel project 1)
│   ├── src/
│   │   ├── components/      # Header, ProductCard, SectionRenderer, admin UI...
│   │   ├── context/         # Auth, Cart, AdminAuth, Toast
│   │   ├── layouts/         # StoreLayout, AccountLayout, AdminApp
│   │   ├── pages/           # store/, account/, admin/
│   │   ├── hooks/ lib/      # api client, formatting, constants
│   ├── public/robots.txt
│   └── vercel.json
├── shared/constants.js      # Domain enums shared by the backend
└── package.json             # npm workspaces root
```

> **Note on `ProductVariant` and `OrderItem`:** these are modeled as embedded
> subdocuments (MongoDB best practice) rather than separate collections, while
> still fully supporting variants, pricing, stock and delivered assets.

---

## 🚀 Local Setup

**Prerequisites:** Node.js ≥ 18, and either MongoDB Atlas (recommended) or local MongoDB.

```bash
# 1. Clone & install (npm workspaces installs both apps)
cd playbeat-digital
npm install

# 2. Configure backend env
cp backend/.env.example backend/.env
#   → set MONGODB_URI, JWT_SECRET, INVENTORY_ENCRYPTION_KEY
#   → set ADMIN_EMAIL + ADMIN_PASSWORD for the seeder

# 3. Configure frontend env
cp frontend/.env.example frontend/.env
#   → VITE_API_URL=http://localhost:5000/api (dev uses the Vite proxy too)

# 4. Seed an admin + demo content
npm run seed:admin
npm run seed:demo

# 5. Run both apps together
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000  (health: http://localhost:5000/api/health)
- **Admin panel:** http://localhost:5173/admin  (login with your seeded admin)

---

## 🔑 Admin Seeding

Admin credentials come **only** from environment variables — they are never hardcoded.

```bash
# backend/.env
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password   # ≥ 12 chars in production
```

```bash
npm run seed:admin        # creates/updates a superadmin
```

The first-seeded admin will be prompted to change its password via the admin panel.

---

## 💳 Payment Configuration

Payments are verified through **real provider webhooks** — orders only become paid
and deliver inventory after a verified webhook (or admin-verified manual payment).

### Stripe
1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `backend/.env`.
2. Webhook URL: `https://<api-domain>/api/payments/webhook/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`,
     `checkout.session.async_payment_failed`.
3. Enable Stripe in **Admin → Settings → Payments**.

### Lemon Squeezy
1. Set `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`.
2. Map each product variant to a Lemon Squeezy variant via `lemonSqueezyVariantId`.
3. Webhook URL: `https://<api-domain>/api/payments/webhook/lemonsqueezy`
   (HMAC `X-Signature` verified).

### Manual / Bank Transfer
Enable in settings; the customer sees instructions, and an admin verifies the
payment by setting the order status to **paid** (which triggers delivery).

> ⚠️ In production, **always set** `STRIPE_WEBHOOK_SECRET` and use the raw-body
> webhook routes (already wired in `app.js`).

---

## 🔐 Security

- Passwords hashed with bcrypt (cost 12)
- JWT auth + optional HTTP-only cookies
- Role-based authorization **enforced on every sensitive API** (frontend checks are UI-only)
- AES-256-GCM encryption of all digital inventory payloads
- Helmet, CORS allowlist, rate limiting, input validation, mongo-injection sanitization
- Secrets live **only** in environment variables (a production startup check fails fast if missing)
- No raw stack traces or secrets exposed to clients

---

## 🌐 API Overview

All routes are prefixed with `/api`. Highlights:

```
GET    /api/health
# Auth
POST   /api/auth/register | login | logout | forgot-password
POST   /api/auth/reset-password/:token      GET /api/auth/me  PUT /api/auth/me
# Catalog
GET    /api/products (?q&category&sort&page)   GET /api/products/:slug
POST   /api/products/:slug/reviews             GET /api/categories
# Cart (auth)
GET/POST/PUT/DELETE  /api/cart[/items/...]     POST /api/cart/apply-coupon
# Orders & payments
POST   /api/orders                            GET /api/orders/mine[/:id]
POST   /api/payments/stripe/session/:orderId  GET /api/payments/mine
POST   /api/payments/webhook/stripe           POST /api/payments/webhook/lemonsqueezy
# Tickets / notifications / homepage / settings (public subsets)
# Admin (/api/admin/*) — products, categories, inventory, orders, customers,
#        payments, coupons, homepage, tickets, settings, dashboard, analytics,
#        audit-logs, auth/users  (role-gated)
```

---

## ☁️ Deploying to Vercel

Deploy as **two Vercel projects**.

### 1. Frontend
- Import the `frontend/` folder.
- Build command: `npm run build` · Output dir: `dist`
- Env: `VITE_API_URL=https://api.playbeat.digital/api`
- Domain: `playbeat.digital` (the `vercel.json` SPA rewrites are included)

### 2. Backend
- Import the `backend/` folder.
- The Vercel function entry is `api/index.js` (auto-detected); `vercel.json`
  rewrites all requests to it.
- Env: `MONGODB_URI`, `JWT_SECRET`, `INVENTORY_ENCRYPTION_KEY`, `CORS_ORIGIN`,
  `STRIPE_*`, `LEMON_SQUEEZY_*`, `SMTP_*`, `CLIENT_URL`, `NODE_ENV=production`.
- Domain: `api.playbeat.digital`
- Set the Stripe/Lemon webhook URLs to the deployed API.

> **Production hardening:** the backend fails to start if `JWT_SECRET`,
> `MONGODB_URI`, or `INVENTORY_ENCRYPTION_KEY` are missing in `NODE_ENV=production`.
> For very heavy background processing, consider a dedicated host for the API
> while keeping the same Express codebase — see `jobs/` for the only long-running piece.

---

## 🧪 Testing

```bash
npm test           # backend (Jest + in-memory Mongo) + frontend (Vitest)
npm run lint       # ESLint (flat config) across backend & frontend
```

Backend tests cover auth, product listing/filtering, and the inventory
reservation/fulfill/release pipeline.

---

## 📜 Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run API + frontend concurrently |
| `npm run dev:api` / `dev:web` | Run one side |
| `npm run build` | Production frontend build |
| `npm start` | Start the backend server |
| `npm run seed:admin` | Create the superadmin from env vars |
| `npm run seed:demo` | Seed categories, products, homepage, coupon, settings |
| `npm test` | Run all tests |
| `npm run lint` | Lint the whole monorepo |

---

## 🛠️ Troubleshooting

- **Storefront shows "Couldn't load the homepage"** → the API isn't reachable. Run `npm run dev:api` and `npm run seed:demo`.
- **Admin login fails** → run `npm run seed:admin` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set.
- **Stripe webhook returns 400** → ensure `STRIPE_WEBHOOK_SECRET` matches the webhook signing secret and the endpoint receives the raw body (already configured).
- **Emails not sending** → without SMTP env vars, emails are logged to the console instead (dev mode).
- **MongoDB connection errors** → verify `MONGODB_URI` and that your Atlas IP allowlist includes your IP.

---

© PlayBeat Digital. Built as a scalable, production-grade SaaS/e-commerce platform.
