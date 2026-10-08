# AgriMarket — Project Documentation

> Complete reference for the AgriMarket / HarvestAI platform: a mobile marketplace
> connecting tuber farmers directly with buyers, with AI market insights, escrow
> payments, and an OTP-gated auth flow.
>
> **Last updated:** 2026-08-29
> **Scope:** backend (`production-backend`) + mobile frontend (`first-app`).

---

## 1. System Overview

AgriMarket is a two-sided marketplace for **non-perishable tubers** (Yam, Sweet
Potato, Cassava, Water Yam). It has two active codebases:

| Project         | Path                                           | Role                                           | Port       |
| --------------- | ---------------------------------------------- | ---------------------------------------------- | ---------- |
| **Backend API** | `/Users/macbookair/Desktop/production-backend` | REST API, DB, auth, payments, AI, integrations | **5001**   |
| **Mobile app**  | `/Users/macbookair/Documents/first-app`        | Expo / React Native client (iOS, Android, Web) | Metro 8081 |

> **Discarded:** `first-app/mobileapp-Backend/` is an old backend and is **not used**.
> The canonical backend is `production-backend`.

**Roles:** `FARMER`, `BUYER`, `ADMIN`.

**Core buyer→farmer flow:**
`browse products → add to cart → place order → pay (escrow hold) → farmer accepts
→ PACKED → SHIPPED → DELIVERED → buyer confirms receipt → escrow released to
farmer → farmer withdraws`.

**Naming note:** `app.json` sets the app name to **AgriMarket**, but several
screens display the brand **"HarvestAI"** (splash, notifications header). These
refer to the same product.

---

# PART A — BACKEND (`production-backend`)

## 2. Tech Stack

| Concern       | Choice                                                         |
| ------------- | -------------------------------------------------------------- |
| Language      | TypeScript 5.6.3 (`"type": "commonjs"`)                        |
| Runtime/dev   | Node.js, `tsx watch` for dev                                   |
| Web framework | Express 5.2.1                                                  |
| ORM           | Prisma 6.16.2 (`@prisma/client`)                               |
| Database      | PostgreSQL (Neon serverless — auto-suspends when idle)         |
| Auth          | JWT (access token + refresh cookie), `bcrypt` password hashing |
| Validation    | Zod 3.24.1                                                     |
| File upload   | Multer 2.2 (memory storage, 5 MB limit)                        |
| Images        | ImageKit (`@imagekit/nodejs`, active), Cloudinary (legacy)     |
| Email         | Nodemailer 9 (SMTP) — OTP delivery                             |
| Security      | Helmet, CORS, cookie-parser                                    |
| Logging       | Morgan (`combined`)                                            |

### NPM scripts (`package.json`)

```
dev              tsx watch src/server.ts
build            tsc -p tsconfig.json
start            node dist/server.js
typecheck        tsc -p tsconfig.json --noEmit
prisma:generate  prisma generate
prisma:migrate   prisma migrate dev
prisma:studio    prisma studio
test             (STUB — no test suite configured)
```

## 3. Architecture

Strict layered architecture; dependencies point downward only:

```
HTTP request
   │
routes/         → declare endpoints, attach requireAuth, run zod param/body parsing
controllers/    → read req.user, parse body, call a service, shape the JSON response
services/       → business logic, orchestration, transactions, notifications
repositories/   → all Prisma access (the ONLY layer that touches the DB)
prisma/client   → singleton PrismaClient
```

Cross-cutting:

- `middleware/authMiddleware.ts` — `requireAuth` verifies the JWT and sets
  `req.user = { id, role }` where `id` = `User.id`.
- `admin/adminAuth.ts` — `requireAdmin` runs `requireAuth`, then rejects any
  non-`ADMIN` role with 403.
- `middleware/errorHandler.ts` — central error mapper (see §9).
- `middleware/notFound.ts` — 404 fallback.

### Full backend source tree

```
src/
├─ app.ts                     createApp(): middleware + route mounting
├─ server.ts                  boots HTTP server on PORT (default 5000; .env=5001)
├─ config/env.ts             env var access + requireEnv/requireJwtSecrets/requireMailConfig
├─ constants/productTypes.ts
├─ prisma/client.ts           PrismaClient singleton
│
├─ middleware/
│   ├─ authMiddleware.ts      requireAuth → req.user = { id, role }
│   ├─ errorHandler.ts
│   └─ notFound.ts
│
├─ admin/
│   ├─ adminAuth.ts           requireAdmin guard
│   └─ utils/{filters.ts, pagination.ts}
│
├─ routes/
│   ├─ health.ts              GET /health
│   ├─ auth/                  index + login/logout/otp/refresh/register
│   ├─ marketPrice/           index (mounts /market-prices) + marketPrice.routes
│   ├─ buyer/                 index + buyer.routes
│   ├─ farmer/                index + farmer.routes + produce.routes
│   ├─ ai/                    index + ai.routes
│   └─ admin/                 index + dashboard/users/farmers/buyers/products/
│                             orders/shipments/payments/statistics (+ placeholder, unmounted)
│
├─ controllers/               buyer, farmer, order, marketPrice, ai,
│                             notification, wallet, admin* (9)
│
├─ services/
│   ├─ buyerService, farmerService, orderService, productService,
│   │  paymentService, shippingService, dhlService, marketPriceService,
│   │  otpService, notificationService, walletService
│   ├─ ai/                    aiHttpClient + price/demand/profit/crop/shipping
│   └─ admin/                 analytics, buyer, farmer, order, pagination,
│                             payment, product, shipment, statistics, user
│
├─ repositories/              buyer, farmer, product, order, user, otp,
│                             marketPrice, notification, wallet
│
├─ validators/                buyer, farmer, order, product, adminCommon,
│                             notification, wallet
│
└─ lib/
    ├─ auth/authTokens.ts     sign/verify access + refresh JWTs
    ├─ imagekit.ts            uploadBufferToImageKit(), isImageKitConfigured()
    ├─ cloudinary.ts          (legacy)
    ├─ mail/{nodemailerClient.ts, sendOtpEmail.ts}
    └─ otp/{otpGenerator.ts, otpTokenHash.ts}
```

### `app.ts` middleware order & mounts

```
helmet() → cors() → morgan("combined")
express.json()
express.raw({ type: "application/json" }) on /webhooks
cookieParser()

app.use("/",          healthRouter)              // GET /health
app.use("/auth",      authRouter)
app.use("/",          marketPriceIndexRouter)     // → /market-prices/*
app.use("/farmer",    farmerIndexRouter)
app.use("/buyer",     buyerIndexRouter)
app.use("/admin",     adminIndexRouter)
app.use("/ai",        aiIndexRouter)

notFound → errorHandler
```

Routers are loaded lazily with `require()`. **There is no `/api` prefix** — routes
are mounted at the root.

## 4. Environment Variables

Read via `src/config/env.ts` (+ Prisma reads `DATABASE_URL`; ImageKit reads its key directly).

| Variable                                              | Purpose                           | Notes                                     |
| ----------------------------------------------------- | --------------------------------- | ----------------------------------------- |
| `NODE_ENV`                                            | environment                       |                                           |
| `PORT`                                                | HTTP port                         | `.env` sets **5001** (code default 5000)  |
| `DATABASE_URL`                                        | Neon Postgres connection string   | required by Prisma                        |
| `JWT_ACCESS_SECRET`                                   | signs access tokens               | `requireJwtSecrets()`                     |
| `JWT_REFRESH_SECRET`                                  | signs refresh tokens              | `requireJwtSecrets()`                     |
| `AI_SERVICE_URL`                                      | external ML microservice base URL | optional — falls back to local heuristics |
| `AI_SERVICE_TIMEOUT_MS`                               | AI HTTP timeout                   | default 10000                             |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | OTP email transport               | `requireMailConfig()`                     |
| `FROM_EMAIL`                                          | OTP sender address                |                                           |
| `IMAGEKIT_PRIVATE_KEY`                                | ImageKit uploads                  | `src/lib/imagekit.ts`                     |

> ### ⚠️ SECURITY — leaked credential
>
> `.env.example` currently contains a **real, live Neon `DATABASE_URL` with valid
> credentials** (committed to the repo). This should be treated as compromised:
> **rotate the Neon password** and replace the value in `.env.example` with a
> placeholder (e.g. `postgresql://USER:PASSWORD@HOST/DB`). Example files must never
> contain real secrets.

## 5. Authentication & OTP

JWT access token + refresh cookie. Accounts are **hard-gated behind OTP**: on
registration a user is created `PENDING` with **no token**; a SIGNUP OTP is
emailed; verifying it flips the account to `ACTIVE`; only then can the user log in
and receive a token.

| Method | Path               | Auth           | Behaviour                                                                                                                                                                       |
| ------ | ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register`   | public         | Creates `PENDING` user + role profile, fires SIGNUP OTP. Returns `{ ok, otpRequired, purpose:"SIGNUP", email }`. **No token.** 409 on duplicate email/phone.                    |
| POST   | `/auth/login`      | public         | bcrypt compare. `PENDING` → 403 `{ otpRequired, purpose:"LOGIN", email }` (fires LOGIN OTP). Other non-`ACTIVE` → 403. `ACTIVE` → `{ ok, accessToken, user }` + refresh cookie. |
| POST   | `/auth/otp/resend` | public         | (Re)issues an OTP for `{ email, purpose }`.                                                                                                                                     |
| POST   | `/auth/otp/verify` | public         | Verifies `{ email, purpose, otp }`; SIGNUP/LOGIN activate the pending user.                                                                                                     |
| POST   | `/auth/refresh`    | refresh cookie | Issues a new access token; rotates the refresh token.                                                                                                                           |
| POST   | `/auth/logout`     | —              | Clears the refresh cookie.                                                                                                                                                      |

OTP internals: codes are generated (`lib/otp/otpGenerator.ts`), stored **hashed**
(`lib/otp/otpTokenHash.ts`) as `OTP` rows with `purpose`, `channel`, `status`,
`expiresAt`, and an `attempts` counter. Delivery via Nodemailer
(`lib/mail/sendOtpEmail.ts`).

## 6. Data Model (Prisma)

`datasource` = PostgreSQL (`env("DATABASE_URL")`), `generator` = prisma-client-js.
Money fields are `Decimal(18,2)` and **serialize to strings in JSON** — the client
coerces with `Number()`.

### Enums

| Enum                    | Values                                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UserRole`              | FARMER, BUYER, ADMIN                                                                                                                                                                                  |
| `ProfileStatus`         | ACTIVE, SUSPENDED, PENDING                                                                                                                                                                            |
| `ProductStatus`         | ACTIVE, INACTIVE, SOLD_OUT, DRAFT                                                                                                                                                                     |
| `OrderStatus`           | CREATED, CONFIRMED, CANCELLED, FULFILLING, SHIPPED, DELIVERED                                                                                                                                         |
| `InvoiceStatus`         | DRAFT, ISSUED, CANCELLED, PAID                                                                                                                                                                        |
| `PaymentStatus`         | PENDING, AUTHORIZED, PAID, FAILED, REFUNDED                                                                                                                                                           |
| `PaymentMethod`         | CARD, BANK_TRANSFER, CASH_ON_DELIVERY, WALLET                                                                                                                                                         |
| `DeliveryMethod`        | AIR, FLIGHT                                                                                                                                                                                           |
| `ShipmentGroupStatus`   | PENDING, PACKED, SHIPPED, DELIVERED, CANCELLED                                                                                                                                                        |
| `ShipmentItemStatus`    | PENDING, RESERVED, SHIPPED, DELIVERED, CANCELLED                                                                                                                                                      |
| `OTPPurpose`            | LOGIN, SIGNUP, PASSWORD_RESET, PHONE_VERIFICATION                                                                                                                                                     |
| `OTPChannel`            | EMAIL, SMS                                                                                                                                                                                            |
| `OTPStatus`             | ACTIVE, CONSUMED, EXPIRED, REVOKED                                                                                                                                                                    |
| `MarketPriceSource`     | USER_REPORTED, FEED, MANUAL_ENTRY, EXTERNAL_PROVIDER                                                                                                                                                  |
| `PredictionStatus`      | PENDING, COMPLETED, FAILED                                                                                                                                                                            |
| `ProductType`           | CROP, LIVESTOCK, GRAIN, FRUIT, VEGETABLE, OTHER                                                                                                                                                       |
| `RestrictedProductType` | YAM, SWEET_POTATO, CASSAVA, WATER_YAM                                                                                                                                                                 |
| `NotificationType`      | CART_ITEM_ADDED, PAYMENT_SENT, ORDER_PLACED, PAYMENT_RECEIVED, ORDER_ACCEPTED, ORDER_PACKED, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_REJECTED, RECEIPT_CONFIRMED, ESCROW_RELEASED, WITHDRAWAL_REQUESTED |
| `WalletTransactionType` | ESCROW_HOLD, ESCROW_RELEASE, ESCROW_REVERSAL, WITHDRAWAL                                                                                                                                              |
| `WithdrawalStatus`      | PENDING, PAID, REJECTED                                                                                                                                                                               |

### Models (key fields)

- **User** — `email`/`phone` unique, `passwordHash`, `role`, `status`. Relations: `farmerProfile`, `buyerProfile`, `otps`, `refreshTokens`, `notifications`.
- **FarmerProfile** — `userId` unique, `displayName`, `farmName?`, `location?`, `profileImageUrl?`, `profileImagePublicId?`. Relations: `products`, `shipmentShippingAllocations`, `wallet`.
- **BuyerProfile** — `userId` unique, `displayName`. Relations: `orders`, `wishlistItems`, `savedProducts`.
- **WishlistItem / SavedProduct** — unique `[buyerProfileId, productId]`.
- **Product** — `farmerProfileId`, `productName` = `RestrictedProductType` (tubers only), `sku?` unique, `status` (default DRAFT), `quantityKg`, `quantityTonnes`, `unit`, `pricePerKg`, `totalValue`, `images String[]`, `description?`, `location?`, `destinationCountry?`.
- **Order** — `buyerProfileId`, `status` (default CREATED), `deliveryMethod` (default AIR), `currency`, `subtotal`/`tax`/`shipping`/`total`, `notes?`, **`receiptConfirmedAt?`** (drives escrow release + idempotency). Relations: `shipmentGroups`, `payments`, `invoices`.
- **ShipmentGroup** — `orderId?` (nullable), `status`, `shippingCostAmount`, `shippingCurrency` (default NGN), weight fields, departure/destination fields, `trackingNumber?` unique, `carrier?`, `shippedAt?`, `deliveredAt?`.
- **ShipmentShippingAllocation** — `shipmentGroupId`, `farmerProfileId`, `weightContributionKg`, `shippingPercentage`, `shippingAmount`; unique `[shipmentGroupId, farmerProfileId]`.
- **ShipmentItem** — `shipmentGroupId`, `productId`, `quantity`, `unit`, `currency`, `unitPrice`, **`lineTotal`** (basis for escrow split), `status`.
- **Payment** — `orderId`, `status`, `method`, `currency`, `amount`, `provider?`, `providerPaymentId?` unique, `authorizedAt`/`paidAt`/`failedAt`/`refundedAt`.
- **Invoice** — `orderId`, `status`, amounts, `payload Json`, `issuedAt?`.
- **MarketPrice** — `productId`, `source`, `recordedAt`, `currency`, `price`, `region?`, `quality?`, `notes?`; unique `[productId, recordedAt]`.
- **Prediction** — `productId`, `status`, `generatedAt`, `targetDate`, `currency`, `predictedPrice`, `modelName?`, `version?`, `confidence?`; unique `[productId, targetDate]`.
- **OTP** — `userId`, `purpose`, `channel`, `tokenHash` unique, `status`, `expiresAt`, `consumedAt?`, `attempts`, `lastAttemptAt?`.
- **RefreshToken** — `userId`, `tokenHash` unique, `revokedAt?`, `expiresAt`.
- **Notification** — `userId` (→ User, cascade), `type`, `title`, `body`, `orderId?`, `data Json?`, `readAt?`, `createdAt`. Indexes `[userId, createdAt desc]`, `[userId, readAt]`.
- **Wallet** — `farmerProfileId` unique (→ FarmerProfile, cascade), `currency`, `availableBalance Decimal(18,2)`, `escrowBalance Decimal(18,2)`. Relations: `transactions`, `withdrawals`.
- **WalletTransaction** — `walletId`, `type`, `amount`, `currency`, `orderId?`, `note?`, `availableBalanceAfter`, `escrowBalanceAfter`.
- **WalletWithdrawal** — `walletId`, `amount`, `currency`, `status` (default PENDING), `requestedAt`, `processedAt?`.

## 7. API Surface

All endpoints below require `requireAuth` unless marked **public**. Base URL has no
`/api` prefix.

### Health & Auth

```
GET   /health                       public
POST  /auth/register                public
POST  /auth/login                   public
POST  /auth/otp/resend              public
POST  /auth/otp/verify              public
POST  /auth/refresh                 refresh cookie
POST  /auth/logout
```

### Market prices (mounted at `/market-prices`)

```
POST  /market-prices                add a market price
PATCH /market-prices/:id            update
GET   /market-prices/current        current price(s)
```

### Buyer (`/buyer`)

```
POST   /buyer/profile
PATCH  /buyer/profile
GET    /buyer/profile
POST   /buyer/profile-image         multipart "image"
GET    /buyer/dashboard

GET    /buyer/saved-products
POST   /buyer/saved-products
DELETE /buyer/saved-products/:productId

GET    /buyer/wishlist
POST   /buyer/wishlist
DELETE /buyer/wishlist/:productId

GET    /buyer/products              browse ACTIVE products (?q, ?productName)
GET    /buyer/products/:productId

POST   /buyer/orders               place order (placeOrderSchema)
GET    /buyer/orders
GET    /buyer/orders/:orderId
DELETE /buyer/orders/:orderId
POST   /buyer/orders/:orderId/pay              simulated gateway → escrow hold
POST   /buyer/orders/:orderId/confirm-received releases farmer escrow

GET    /buyer/notifications
GET    /buyer/notifications/unread-count
POST   /buyer/notifications/read-all
POST   /buyer/notifications/:id/read
POST   /buyer/notifications/cart               lightweight "added to cart" notify
```

### Farmer (`/farmer`)

```
POST   /farmer/profile
PATCH  /farmer/profile
GET    /farmer/profile
POST   /farmer/profile-image        multipart "image"
POST   /farmer/product-image        multipart "image" → ImageKit URL
GET    /farmer/dashboard

POST   /farmer/products             create product (produce.routes; multer configured)
GET    /farmer/products             farmer's own listings
GET    /farmer/orders               orders containing this farmer's products
POST   /farmer/orders/:orderId/accept
POST   /farmer/orders/:orderId/reject           (+ escrow reversal if paid)
POST   /farmer/orders/:orderId/advance-status   body { status: PACKED|SHIPPED|DELIVERED }

GET    /farmer/notifications
GET    /farmer/notifications/unread-count
POST   /farmer/notifications/read-all
POST   /farmer/notifications/:id/read

GET    /farmer/wallet                           escrow + available balances
GET    /farmer/wallet/transactions
POST   /farmer/wallet/withdraw                  body { amount } (≤ available)
```

### AI (`/ai`)

```
POST  /ai/price-prediction
POST  /ai/demand-forecasting
POST  /ai/profit-estimation
POST  /ai/crop-recommendation
POST  /ai/shipping-recommendation
```

Each responds `{ ok: true, result }`. Uses the external ML service if
`AI_SERVICE_URL` is set, otherwise computes locally from Prisma data.

### Admin (`/admin`, all `requireAdmin`)

```
GET  /admin/dashboard/analytics
GET  /admin/dashboard/statistics
GET  /admin/users
GET  /admin/farmers
GET  /admin/buyers
GET  /admin/products
GET  /admin/orders
GET  /admin/shipments
GET  /admin/payments
GET  /admin/statistics/revenue
GET  /admin/statistics/orders
GET  /admin/statistics/shipments
GET  /admin/statistics/farmers
GET  /admin/statistics/top-products
```

(`admin/placeholder.routes.ts` exists but is **not mounted**.)

## 8. Escrow Wallet & Notifications (feature deep-dive)

**Status: backend COMPLETE. Frontend NOT yet wired (see Part B §17).**

### Design principles

- **Money ops are atomic** — every escrow hold/release/reversal and withdrawal
  happens _inside_ a Prisma `$transaction(..., { maxWait: 10000, timeout: 20000 })`.
- **Notifications are best-effort, after commit** — emitted via a non-throwing
  `notificationService.emit()` so a notification failure can never break a payment
  or a status change. Transactions stay lean (important for Neon timeouts).
- **Escrow is keyed to the order** — every ledger row carries `orderId`, so release
  finds the exact prior hold; operations are idempotent and no-op when no payment
  happened.
- **Escrow amount = the farmer's own goods value** = Σ of that farmer's shipment
  items' `lineTotal` — **not** the order total (shipping/tax are not the farmer's
  money). A multi-farmer order splits the payment per farmer.

### Event → notification map

| Trigger                          | Recipient            | NotificationType                                     | Money effect                            |
| -------------------------------- | -------------------- | ---------------------------------------------------- | --------------------------------------- |
| `POST /buyer/notifications/cart` | buyer                | `CART_ITEM_ADDED`                                    | —                                       |
| place order                      | each farmer in order | `ORDER_PLACED`                                       | —                                       |
| pay order                        | buyer / each farmer  | `PAYMENT_SENT` / `PAYMENT_RECEIVED`                  | **escrow hold** per farmer              |
| farmer accept                    | buyer                | `ORDER_ACCEPTED`                                     | —                                       |
| advance PACKED/SHIPPED/DELIVERED | buyer                | `ORDER_PACKED` / `ORDER_SHIPPED` / `ORDER_DELIVERED` | —                                       |
| farmer reject                    | buyer                | `ORDER_REJECTED`                                     | **escrow reversal** if already paid     |
| buyer confirm-received           | farmer(s)            | `RECEIPT_CONFIRMED` + `ESCROW_RELEASED`              | escrow → available                      |
| farmer withdraw                  | farmer               | `WITHDRAWAL_REQUESTED`                               | available ↓, `WalletWithdrawal` PENDING |

### Money lifecycle

```
buyer pays  ──▶ escrowBalance += goodsValue      (WalletTransaction: ESCROW_HOLD)
farmer rejects ─▶ escrowBalance -= goodsValue     (ESCROW_REVERSAL)   [if paid]
buyer confirms ─▶ escrowBalance -= goodsValue
                 availableBalance += goodsValue    (ESCROW_RELEASE)
farmer withdraw ▶ availableBalance -= amount       (WITHDRAWAL) + WalletWithdrawal(PENDING)
```

Withdrawal validates `amount ≤ availableBalance` (else 400). Every
`WalletTransaction` records `availableBalanceAfter` / `escrowBalanceAfter`.

### Files

- Repositories: `notificationRepository.ts`, `walletRepository.ts`
  (`ensureWallet`, `holdEscrow`, `releaseEscrowForOrder`, `reverseEscrowForOrder`,
  `withdraw`, `settleHolds`, `listTransactions`).
- Services: `notificationService.ts` (`emit`, `buildMessage` for all 12 types),
  `walletService.ts` (`getWallet`, `listTransactions`, `requestWithdrawal`).
- Controllers: `notificationController.ts` (shared buyer/farmer, keyed on
  `req.user.id`; includes `notifyCartItem`), `walletController.ts`.
- Wired into: `paymentService.ts` (hold on pay), `orderRepository.ts`
  (`confirmReceiptTx`, `rejectOrderTx` reversal, returns buyer/farmer userIds),
  `orderService.ts` (`confirmReceived` + emits).
- Validators: `notificationValidator.ts`, `walletValidator.ts`.

## 9. Error Handling

`middleware/errorHandler.ts` maps:

- **ZodError** → 400 (validation details)
- **Prisma P2002** (unique constraint) → 409
- `err.status` present → that status
- otherwise → 500

Controllers wrap logic in `try/catch` and forward with `next(err)`.

## 10. Integrations

| Integration    | Module                                     | Notes                                                                                                                 |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **ImageKit**   | `lib/imagekit.ts`                          | Active image host. `uploadBufferToImageKit(buffer, folder) → { url, publicId }`. Guarded by `isImageKitConfigured()`. |
| **Cloudinary** | `lib/cloudinary.ts`                        | Legacy; superseded by ImageKit.                                                                                       |
| **Nodemailer** | `lib/mail/*`                               | SMTP transport for OTP emails.                                                                                        |
| **DHL**        | `services/dhlService.ts`                   | Shipment tracking numbers / carrier logic.                                                                            |
| **AI service** | `services/ai/aiHttpClient.ts` + 5 services | Calls external ML at `AI_SERVICE_URL`; falls back to local heuristics computed from Prisma data.                      |

## 11. Running the Backend

```bash
# 1. Install
npm install

# 2. Configure .env (PORT=5001, DATABASE_URL, JWT_ACCESS_SECRET,
#    JWT_REFRESH_SECRET, SMTP_*, FROM_EMAIL, IMAGEKIT_PRIVATE_KEY, AI_SERVICE_URL?)

# 3. Generate client + run migrations
npm run prisma:generate
npx prisma migrate dev

# 4. Dev server (tsx watch, hot reload)
npm run dev            # → http://localhost:5001/health
```

> **Pending (blocked / needs confirmation):**
>
> - `npm run typecheck` has not been run against the escrow/notification code yet.
> - A migration `npx prisma migrate dev --name add_notifications_wallet_escrow`
>   is needed for the Notification / Wallet / WalletTransaction / WalletWithdrawal
>   models and `Order.receiptConfirmedAt`. **This writes to the Neon dev DB —
>   confirm before running.**

---

# PART B — FRONTEND (`first-app`)

## 12. Tech Stack

| Concern         | Choice                                                         |
| --------------- | -------------------------------------------------------------- |
| Framework       | Expo ~54.0.33, React Native 0.81.5, React 19.1                 |
| Routing         | expo-router ~6 (file-based, typed routes enabled)              |
| State           | Zustand ^5                                                     |
| Styling         | NativeWind ^4 + TailwindCSS ^3.4 (`global.css`)                |
| Storage         | expo-secure-store (native) / AsyncStorage (web)                |
| Images          | expo-image, expo-image-picker                                  |
| Icons           | `@expo/vector-icons` (MaterialCommunityIcons)                  |
| Navigation libs | @react-navigation/native + bottom-tabs                         |
| HTTP            | `fetch` wrapper (`lib/axios.ts` — despite the name, not axios) |
| Misc            | expo-haptics, expo-linking, expo-web-browser, expo-constants   |

### NPM scripts

```
start     expo start
android   expo start --android
ios       expo start --ios
web       expo start --web
lint      expo lint
```

## 13. App Configuration (`app.json`)

- **name/slug:** AgriMarket · **scheme:** `AgriMarket`
- New Architecture enabled (`newArchEnabled: true`)
- Plugins: `expo-router`, `expo-splash-screen`, `expo-secure-store`
- `experiments.typedRoutes: true`
- Icon/splash: `./assets/images/logo.png`

## 14. Routing (expo-router)

File-based routing under `app/`. Route **groups** (parenthesized dirs) don't add
URL segments; they organize by audience. Full inventory:

```
app/
├─ _layout.tsx                 Root layout: hydrate auth, gate navigation by role
├─ index.tsx                   Splash (3s) → landing (Get started / Login)
│
├─ (public)/                   Unauthenticated funnel
│   ├─ splash.tsx
│   ├─ onboarding/{index, slide1, slide2, slide3}.tsx
│   ├─ choose-role.tsx
│   ├─ complet-profile.tsx     (sic — "complet")
│   └─ auth/{login, register, otp, forgot-password, reset-password}.tsx
│
├─ (buyer)/                    Buyer stack
│   ├─ _layout.tsx
│   ├─ home.tsx
│   ├─ marketplace.tsx
│   ├─ search.tsx
│   ├─ cart.tsx
│   ├─ checkout.tsx
│   ├─ payment.tsx
│   ├─ products/[id].tsx
│   ├─ products/reviews.tsx
│   ├─ orders/current.tsx
│   ├─ orders/history.tsx
│   ├─ tracking.tsx
│   ├─ profile.tsx
│   ├─ notification.tsx        ⚠ duplicate of notifications.tsx (singular)
│   └─ notifications.tsx       ⚠ static empty-state placeholder (not wired)
│
├─ (farmer)/                   Farmer stack
│   ├─ _layout.tsx
│   ├─ dashboard.tsx
│   ├─ inventory.tsx
│   ├─ upload.tsx
│   ├─ orders.tsx
│   ├─ analytics.tsx
│   ├─ earnings.tsx            (intended wallet/escrow UI — not yet wired)
│   ├─ notifications.tsx
│   └─ profile.tsx
│
├─ (ai)/                       AI insights (shared)
│   ├─ insight.tsx
│   ├─ pricing.tsx
│   ├─ demand.tsx
│   └─ crop-recommendation.tsx
│
└─ (shared)/                   Cross-role
    ├─ settings.tsx
    ├─ help.tsx
    ├─ support.tsx
    └─ terms.tsx
```

### Navigation gating (`app/_layout.tsx`)

- On mount: `hydrate()` restores token+user from secure storage; currency store
  hydrates + refreshes rates.
- Waits for `hydrated` before routing (avoids bouncing a logged-in user to splash).
- **No token** → forced into `(public)` (except `(ai)`/`(shared)`).
- **Buyer** → `/(buyer)/home`; **Farmer** → `/(farmer)/dashboard`, while never
  yanking a token-holder out of the public funnel (so re-login / switch account
  still works).
- Global `loading` store renders a `<Loading>` overlay.

## 15. State Management (Zustand — `store/`)

| Store              | Responsibility                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authStore.ts`     | `user`, `token`, `hydrated`; `hydrate/setAuth/clearAuth`. Also holds in-memory `pendingEmail/pendingOtp/pendingPassword` for the LOGIN-OTP retry flow (password **never** persisted). |
| `cartStore.ts`     | **Client-side cart** (no server cart). `items[]`, add/remove/setQuantity/clear, `totalItems()`, `subtotal()`. Quantity clamped to `[1, availableStock]`.                              |
| `currencyStore.ts` | Selected `code`, `rates`, `ratesUpdatedAt`; persists to AsyncStorage; refreshes live rates (12 h staleness) from a keyless FX API.                                                    |
| `loadingStore.ts`  | Global loading flag for the root overlay.                                                                                                                                             |
| `roleStore.ts`     | Transient `role` selection during signup (`choose-role`).                                                                                                                             |

## 16. Services & Libraries

### API client — `lib/axios.ts` (a `fetch` wrapper, not axios)

- `apiFetch(endpoint, options)` prefixes `API_BASE_URL`, injects
  `Authorization: Bearer <token>` from `authStore`, sets JSON content-type
  (skipped for `FormData` so multipart boundaries work).
- On non-2xx: throws an `Error` carrying `.status` and `.data` (so callers can
  branch on e.g. login's 403 `{ otpRequired }`).
- Rewrites pure transport failures into a friendly "backend not reachable" message.

### API base URL — `constants/api.ts`

- `BACKEND_PORT = 5001`.
- Dev: derives the host from Metro's `hostUri` (LAN IP) → `http://<host>:5001`
  (so it never hardcodes an IP that goes stale on network change).
- Override with `EXPO_PUBLIC_API_URL` (physical device on another network, or a
  deployed backend). Falls back to `http://localhost:5001`.
- No `/api` prefix, no trailing slash.
- `DEV_BYPASS_OTP = true` — a client-side dev flag (pairs with a server-side OTP
  debug bypass). **Should be `false` for production.**

### Service modules (`services/*.service.ts`)

| Service              | Wraps                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.ts`    | `/auth/register`, `/login`, `/otp/resend`, `/otp/verify`; normalizes backend user (uppercase `FARMER`/`BUYER`) → client `{ role: "farmer"/"buyer", fullName }`; persists to `authStore`.                  |
| `product.service.ts` | `/buyer/products`, `/buyer/products/:id`, `/farmer/products`, `POST /farmer/products`, `POST /farmer/product-image`. Maps Prisma `Product` → flat `UiProduct`. Exports `PRODUCT_LABELS` for the 4 tubers. |
| `order.service.ts`   | `POST /buyer/orders`, buyer/farmer order lists, accept/reject/advance-status, delete.                                                                                                                     |
| `payment.service.ts` | `POST /buyer/orders/:id/pay` (idempotent — `alreadyPaid`).                                                                                                                                                |
| `profile.service.ts` | buyer/farmer profile + dashboard GETs, profile-image uploads; `formatMoney` (USD, Hermes-safe).                                                                                                           |
| `ai.service.ts`      | all 5 `/ai/*` endpoints; unwraps `{ result }`. Typed result shapes.                                                                                                                                       |

### `lib/` utilities

| File                 | Purpose                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `axios.ts`           | `apiFetch` (above).                                                                                                            |
| `storage.ts`         | Secure token/user persistence (SecureStore native / AsyncStorage web); `StoredUser` type.                                      |
| `currency.ts`        | 8 currencies (USD base), static fallback rates, `RATES_URL`, Hermes-safe `formatCurrency` / `convertFromUsd` / `convertToUsd`. |
| `useMoney.ts`        | Hook bridging `currencyStore` + `currency.ts` for currency-aware display.                                                      |
| `CurrencyPicker.tsx` | Currency selection UI.                                                                                                         |
| `imagePick.ts`       | expo-image-picker wrapper.                                                                                                     |
| `location.ts`        | Location helpers (states/regions).                                                                                             |
| `notification.ts`    | **EMPTY FILE** — notification client not implemented.                                                                          |

### Components (`components/`)

- `ui/Loading.tsx` — full-screen loader (used by root layout).
- `ui/Screen.ts` — screen scaffold helper.
- `onboarding/OnboardingSlide.tsx` — reusable onboarding slide.

## 17. Frontend ↔ Backend Contract

| Client call                                        | → Backend endpoint                                       |
| -------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `AuthService.register`                             | `POST /auth/register`                                    |
| `AuthService.login`                                | `POST /auth/login`                                       |
| `AuthService.resendOtp`                            | `POST /auth/otp/resend`                                  |
| `AuthService.verifyOTP`                            | `POST /auth/otp/verify`                                  |
| `ProductService.getAllProducts`                    | `GET /buyer/products`                                    |
| `ProductService.getProductById`                    | `GET /buyer/products/:id`                                |
| `ProductService.getMyProducts`                     | `GET /farmer/products`                                   |
| `ProductService.createProduct`                     | `POST /farmer/products`                                  |
| `ProductService.uploadProductImage`                | `POST /farmer/product-image`                             |
| `OrderService.createOrder`                         | `POST /buyer/orders`                                     |
| `OrderService.getBuyerOrders/getBuyerOrder`        | `GET /buyer/orders[/:id]`                                |
| `OrderService.getFarmerOrders`                     | `GET /farmer/orders`                                     |
| `OrderService.accept/reject/advanceShipmentStatus` | `POST /farmer/orders/:id/{accept,reject,advance-status}` |
| `OrderService.deleteOrder`                         | `DELETE /buyer/orders/:id`                               |
| `PaymentService.payForOrder`                       | `POST /buyer/orders/:id/pay`                             |
| `ProfileService.*`                                 | `/buyer                                                  | farmer/profile`, `/dashboard`, `/profile-image` |
| `AiService.*`                                      | `POST /ai/*`                                             |

### ⚠️ Not yet consumed by the client

The following backend endpoints are **built and ready but have no client
service/wiring**:

- **Notifications** — `GET/POST /buyer|farmer/notifications*`, `POST /buyer/notifications/cart`.
  `lib/notification.ts` is empty; `(buyer)/notifications.tsx` renders a hardcoded
  "No notifications yet" empty state; there is no `notification.service.ts`.
- **Escrow wallet** — `GET /farmer/wallet`, `/wallet/transactions`,
  `POST /farmer/wallet/withdraw`. There is no `wallet.service.ts`; the
  `(farmer)/earnings.tsx` screen is the intended home for this.
- **Confirm receipt** — `POST /buyer/orders/:id/confirm-received` (releases escrow).
- **Saved products / Wishlist** — buyer endpoints exist; no dedicated client service.
- **Market prices** — `/market-prices/*` endpoints exist; not called by the app.

**To finish the escrow + notification feature end-to-end**, the frontend needs:
`notification.service.ts` (list/unread-count/mark-read/cart), `wallet.service.ts`
(get/transactions/withdraw), wiring `notifications.tsx` and `earnings.tsx` to
those, and a "Confirm received" action on the buyer's delivered-order screen.

## 18. Currency System

- The database/base currency is **USD**; all amounts are stored and computed in USD.
- The client converts **for display only** via `currency.ts` + `currencyStore`.
- 8 supported currencies (USD, EUR, GBP, NGN, KES, ZAR, GHS, CAD) with flags/symbols.
- Live rates fetched from `https://open.er-api.com/v6/latest/USD` (keyless),
  cached 12 h, with static fallback rates for offline/first-run.
- Formatting avoids `Intl`/`toLocaleString` (unreliable on Hermes/Android) — manual
  grouping via `toFixed` + regex.

## 19. Running the Frontend

```bash
cd first-app
npm install
npx expo start          # then press a (Android), i (iOS), or w (Web)
```

- Backend must be running on **:5001** on the same machine (dev auto-derives the
  LAN host from Metro). For a physical device on another network or a deployed
  backend, set `EXPO_PUBLIC_API_URL`.

---

# PART C — Cross-Cutting Notes

## 20. Known Issues / Cleanup Backlog

1. **⚠ Leaked Neon credential in `.env.example`** — rotate + replace with placeholder (Part A §4).
2. **Escrow + notifications not wired on the client** (Part B §17) — backend is done.
3. **`DEV_BYPASS_OTP = true`** in `constants/api.ts` — must be `false` for production.
4. **Duplicate buyer screens** — `(buyer)/notification.tsx` vs `(buyer)/notifications.tsx`.
5. **Empty `lib/notification.ts`** — remove or implement.
6. **Typos** — `(public)/complet-profile.tsx`.
7. **Brand inconsistency** — "AgriMarket" (config) vs "HarvestAI" (UI).
8. **No automated tests** — backend `test` script is a stub; no client tests.
9. **Backend typecheck + migration pending** (Part A §11) — migration requires
   confirmation before writing to the Neon dev DB.

## 21. Glossary

- **Escrow hold** — buyer's payment held in the farmer's `escrowBalance`, not yet spendable.
- **Escrow release** — on buyer receipt confirmation, moves funds escrow → available.
- **Goods value** — a single farmer's share of an order (Σ their shipment items' `lineTotal`).
- **Hard OTP gate** — a new account is `PENDING` with no token until an OTP verifies it `ACTIVE`.
- **Restricted product** — the marketplace only lists 4 tubers (Yam, Sweet Potato, Cassava, Water Yam).

---

# APPENDICES

## Appendix A — Role Matrix and Access Control

| Role     | Primary actions                                                                                       | Access level   | Key restrictions                                                             |
| -------- | ----------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `FARMER` | list inventory, create/edit products, accept/reject orders, ship/deliver, view wallet, withdraw funds | authenticated  | cannot buy, cannot see admin dashboards, cannot alter buyer order state      |
| `BUYER`  | browse products, add to cart, place orders, pay, confirm receipt, view notifications                  | authenticated  | cannot approve orders, cannot list farmer wallet, cannot access admin routes |
| `ADMIN`  | monitor marketplace, review orders/payments/users, revenue/statistics views                           | `requireAdmin` | no direct product creation or payment release flow in the public app         |

### Role-to-resource mapping

```text
FARMER
  ├─ own profile + products
  ├─ assigned order items only
  ├─ wallet + withdrawals
  └─ farmer notifications

BUYER
  ├─ own profile + saved products
  ├─ cart + checkout + payments
  ├─ buyer orders + confirm-received
  └─ buyer notifications

ADMIN
  ├─ all user listings
  ├─ product visibility reviews
  ├─ order, shipment, payment analytics
  └─ revenue / perf reports
```

### Authorization rules

- `requireAuth` sets `req.user = { id, role }` for every protected route.
- `requireAdmin` extends this by rejecting any role other than `ADMIN` with 403.
- Buyer and farmer routes are commonly scoped to the signed-in user's own data.
- Notifications and wallet endpoints are user-bound, not global.

## Appendix B — Core Business Flow

### Buyer lifecycle

```text
Browse tubers
   ↓
Add to cart
   ↓
Create order
   ↓
Buyer pays
   ↓
Escrow hold on farmer share(s)
   ↓
Farmer accepts / rejects
   ↓
Packed → Shipped → Delivered
   ↓
Buyer confirms receipt
   ↓
Escrow released to farmer
   ↓
Farmer can withdraw available balance
```

### Payment and wallet flow

```text
Buyer payment
   ↓
PaymentService holds -> WalletTransaction(ESCROW_HOLD)
   ↓
Per-farmer split based on shipment item line totals
   ↓
If rejected: reverse hold -> ESCROW_REVERSAL
   ↓
If confirmed received: release to available -> ESCROW_RELEASE
   ↓
Farmer withdrawal: availableBalance -= amount
```

### Notification flow

```text
State change in order/payment/wallet
   ↓
Service emits notification
   ↓
Notification persisted to User.notifications
   ↓
Client polls or fetches list/unread count
   ↓
User marks individual or all notifications as read
```

## Appendix C — Example Requests and Responses

### 1) Register account (public)

```http
POST /auth/register
Content-Type: application/json

{
  "fullName": "Ada Okafor",
  "email": "ada@example.com",
  "phone": "+2348012345678",
  "password": "StrongPass123!",
  "role": "FARMER"
}
```

Example success:

```json
{
  "ok": true,
  "otpRequired": true,
  "purpose": "SIGNUP",
  "email": "ada@example.com"
}
```

### 2) Verify OTP

```http
POST /auth/otp/verify
Content-Type: application/json

{
  "email": "ada@example.com",
  "purpose": "SIGNUP",
  "otp": "482113"
}
```

Example success:

```json
{
  "ok": true,
  "message": "OTP verified successfully",
  "user": {
    "id": "usr_123",
    "email": "ada@example.com",
    "role": "FARMER",
    "status": "ACTIVE"
  }
}
```

### 3) Create order

```http
POST /buyer/orders
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod_101",
      "quantity": 50,
      "unit": "KG"
    }
  ],
  "deliveryMethod": "AIR",
  "currency": "USD",
  "notes": "Deliver before Friday"
}
```

Example success:

```json
{
  "ok": true,
  "order": {
    "id": "ord_55",
    "status": "CREATED",
    "currency": "USD",
    "total": "250.00"
  }
}
```

### 4) Pay for order

```http
POST /buyer/orders/ord_55/pay
Authorization: Bearer <jwt>
Content-Type: application/json
```

Example success:

```json
{
  "ok": true,
  "message": "Payment received and escrow held",
  "payment": {
    "id": "pay_88",
    "status": "PAID",
    "amount": "250.00",
    "currency": "USD"
  }
}
```

### 5) Withdraw available balance

```http
POST /farmer/wallet/withdraw
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "amount": 120.50
}
```

Example success:

```json
{
  "ok": true,
  "withdrawal": {
    "id": "wd_12",
    "amount": "120.50",
    "currency": "USD",
    "status": "PENDING"
  }
}
```

## Appendix D — Deployment and Operational Checklist

### Before first deployment

- [ ] Rotate any leaked credentials and replace all real values in `.env.example`.
- [ ] Set production-safe OTP behavior (`DEV_BYPASS_OTP = false`).
- [ ] Confirm `DATABASE_URL`, SMTP, JWT secrets, and ImageKit keys are valid in the target environment.
- [ ] Run Prisma migration in a controlled environment before production traffic.
- [ ] Test the buyer payment → escrow → release workflow end-to-end with a sandbox or staging order.

### Production readiness notes

- Database: PostgreSQL on Neon or equivalent with proper backup and retention.
- Auth: JWT access tokens + refresh cookie; limit refresh token lifetime and revoke policy.
- Payments: escrow is backend-driven; do not expose raw wallet state without server validation.
- Files: restrict image upload MIME types and implement size limits beyond the current 5 MB cap.
- Observability: log request IDs, payment actions, OTP events, and wallet movement records for auditing.

### Recommended release gate

```text
1. typecheck pass
2. prisma generate pass
3. migration applied successfully
4. OTP verification tested with a real email transport
5. escrow hold and release tested on one live-like order
6. admin dashboard verified
7. notifications list/unread count verified on both roles
8. production env flags verified
```

## Appendix E — Risk Register and Assumptions

| Risk / assumption                                     | Impact | Current status                             |
| ----------------------------------------------------- | ------ | ------------------------------------------ |
| Real secret exposed in `.env.example`                 | High   | Must be rotated and sanitized              |
| Client-side notifications are not yet wired           | Medium | Backend complete, frontend remains pending |
| Client-side wallet UI not implemented                 | Medium | API exists, app wiring pending             |
| OTP bypass flag remains enabled in production         | High   | Must be switched off before launch         |
| No automated tests suite                              | Medium | Significant regression risk during changes |
| Brand naming differs between AgriMarket and HarvestAI | Low    | Cosmetic consistency issue                 |

### Assumptions

- The backend remains the source of truth for all order, wallet, and payment state.
- The app is scoped to non-perishable tubers only.
- Mobile users are authenticated with JWTs and may refresh sessions without a full login.
- Escrow is required for all direct payment-to-farmer flows.
- Product and order data must be treated as financial records and audited accordingly.

## Appendix F — Summary of System Boundaries

```text
Frontend (Expo app)
  ├─ user auth, onboarding, profiles
  ├─ product browsing / cart / checkout
  ├─ order actions, buyer receipt confirmation
  ├─ farmer wallet and notification UIs (to be completed)
  └─ AI dashboards and insights

Backend (Express + Prisma)
  ├─ auth + OTP + role enforcement
  ├─ inventory, order, payment, shipping, wallet logic
  ├─ admin analytics and role-based reports
  ├─ notification + escrow ledger operations
  └─ ImageKit / email / AI integrations

Data layer (PostgreSQL)
  ├─ user and role records
  ├─ product and order ledger
  ├─ wallet transactions and withdrawals
  ├─ notification feed
  └─ market price / AI prediction data
```

This documentation set intentionally captures the implemented backend, the client contract, and the operational gaps that still need attention before a production launch.

```

```
