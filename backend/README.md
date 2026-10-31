# 🏛️ AuditoReserve — Backend API & Background Worker Engine

Production-grade Node.js/Express REST API, WebSocket engine, and BullMQ background worker system powering the **AuditoReserve** Auditorium Booking Platform.

---

## 📌 Table of Contents

- [Overview & Topology](#-overview--topology)
- [Tech Stack & Backing Services](#-tech-stack--backing-services)
- [Repository Structure](#-repository-structure)
- [Environment Configuration](#-environment-configuration)
- [Running with Docker Compose](#-running-with-docker-compose)
- [Manual Local Development](#-manual-local-development)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [API Reference](#-api-reference)
- [Background Worker Engine](#-background-worker-engine)
- [Automated Testing Suite](#-automated-testing-suite)
- [Health Checks & Observability](#-health-checks--observability)

---

## 🚀 Overview & Topology

The backend is built around a **dual-service architecture**:
1. **API Server (`src/server.js`):** Stateless Express.js application handling client HTTP requests, WebSocket real-time connections, distributed locking, rate limiting, and database operations.
2. **Background Worker (`src/worker.js`):** Independent asynchronous worker process managing 3 BullMQ queues (`email-queue`, `booking-expiry`, `pdf-generation-queue`) with an embedded lightweight HTTP health probe to satisfy cloud deployment requirements (e.g. Render Web Services).

```
                            [ Client Traffic ]
                                    │
                                    ▼
                         [ Express HTTP Ingress ]
                         ├── Port 5000: REST API & Socket.io
                         └── Middlewares: RateLimiter, Idempotency, JWT Guard
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        [ MongoDB 7 (Mongoose) ]             [ Redis 7 (ioredis) ]
        ├── ACID Transactions                ├── Redlock Distributed Locks
        ├── Compound Query Indexes           ├── Socket.io Redis Adapter
        └── Sparse Token Indexes             ├── Sliding Window Rate Limiting (Lua)
                                             └── BullMQ Worker Queues
                                                      │
                                                      ▼
                                         [ Background Worker Service ]
                                         ├── emailWorker (Brevo / SMTP)
                                         ├── bookingExpiryWorker (12h/24h)
                                         ├── pdfWorker (Direct Cloudinary Stream)
                                         └── Port 10000 Health Server
```

---

## 🛠️ Tech Stack & Backing Services

- **Runtime & Framework:** Node.js 20 LTS, Express 4.21
- **Database:** MongoDB 7 with Mongoose 9.6 (Transactions, Schema validation, Compound indexes)
- **Cache & Message Broker:** Redis 7 with ioredis 5.10
- **Asynchronous Queues:** BullMQ 5.78 (Delayed jobs, exponential retry policies)
- **Real-Time WebSockets:** Socket.IO 4.8 with `@socket.io/redis-adapter`
- **PDF Generation & Cloud Storage:** PDFKit 0.20 & Cloudinary SDK (Direct memory upload stream)
- **Payment Gateway:** Razorpay Node SDK 2.9 (HMAC-SHA256 signature verification)
- **Email Delivery:** Brevo HTTP API (`https://api.brevo.com/v3/smtp/email`) with Nodemailer 8.0 SMTP fallback
- **Security & Validation:** Winston 3.19, Helmet 8.1, Zod 4.6, bcryptjs 3.0, cookie-parser
- **Testing:** Jest 30.5, Supertest 7.3, ioredis-mock 8.13

---

## 📂 Repository Structure

```
backend/
├── src/
│   ├── config/             # Database, Redis, Cloudinary, Razorpay, Socket & Winston configs
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── logger.js
│   │   ├── queueConnection.js
│   │   ├── razorPay.js
│   │   ├── redis.js
│   │   └── socket.js
│   ├── controllers/        # Express route controllers
│   │   ├── auditoriumController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── notificationController.js
│   │   └── paymentController.js
│   ├── middlewares/        # Security, validation & rate limiting
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── idempotencyMiddleware.js
│   │   ├── rateLimiter.js
│   │   ├── uploadMiddleware.js
│   │   └── validateMiddleware.js
│   ├── models/             # Mongoose data schemas & indexes
│   │   ├── auditorium.js
│   │   ├── booking.js
│   │   ├── notification.js
│   │   ├── payment.js
│   │   └── User.js
│   ├── queue/              # BullMQ queue definitions
│   │   ├── bookingExpiryQueue.js
│   │   ├── emailQueue.js
│   │   └── pdfQueue.js
│   ├── routes/             # Express route routers
│   │   ├── auditoriumRoutes.js
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── paymentRoutes.js
│   ├── service/            # Business services
│   │   ├── email.js
│   │   └── notificationService.js
│   ├── utils/              # Helper utilities
│   │   ├── cache.js
│   │   ├── cloudinaryHelper.js
│   │   ├── EmailOptions.js
│   │   ├── jwt.js
│   │   ├── lock.js
│   │   └── receiptGenerator.js
│   ├── validators/         # Zod validation schemas
│   ├── worker/             # BullMQ queue workers
│   │   ├── bookingExpiryWorker.js
│   │   ├── emailWorker.js
│   │   └── pdfWorker.js
│   ├── app.js              # Express app configuration
│   ├── server.js           # API entrypoint (HTTP + WebSockets)
│   └── worker.js           # Dedicated background worker entrypoint
├── tests/                  # Automated test suites (136 tests)
│   ├── helpers/
│   ├── integration/
│   └── unit/
├── Dockerfile              # Multi-stage production container
├── docker-compose.yml      # API & Worker orchestration
└── package.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file in `backend/` based on `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
UNIVERSITY_DOMAIN=tmu.ac.in

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/auditoreserve

# Redis Configuration (BullMQ, Distributed Locks, Rate Limiting & Socket.IO)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Email / Brevo Configuration (Primary HTTP API)
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME=AuditoReserve

# Optional SMTP fallback (used if BREVO_API_KEY is not provided)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_SECRET_KEY=your_razorpay_secret_key
```

---

## 🐳 Running with Docker Compose

The backend includes a `docker-compose.yml` defining both the **API Server** and **Background Worker** services:

```bash
# 1. Build images and start services in detached mode
docker compose up -d --build

# 2. Check container status
docker compose ps

# 3. Follow API server logs
docker compose logs -f api

# 4. Follow worker process logs
docker compose logs -f worker

# 5. Stop services
docker compose down
```

---

## ⚡ Manual Local Development

### 1. Prerequisites
- Node.js 20+
- Running MongoDB instance (`mongodb://localhost:27017`)
- Running Redis instance (`localhost:6379`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Services
Open two terminal windows:

**Terminal 1 — API Server:**
```bash
npm run dev:api
# Or: npm run dev
```

**Terminal 2 — Background Worker:**
```bash
npm run dev:worker
```

---

## 📜 NPM Scripts Reference

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm start` | `node src/server.js` | Run API server in production mode |
| `npm run start:api` | `node src/server.js` | Explicit command to launch API server |
| `npm run start:worker` | `node src/worker.js` | Launch BullMQ worker process with health server |
| `npm run dev` | `nodemon src/server.js` | Run API server with nodemon auto-reload |
| `npm run dev:api` | `nodemon src/server.js` | Run API server with nodemon |
| `npm run dev:worker` | `nodemon src/worker.js` | Run worker process with nodemon |
| `npm test` | `jest --runInBand --detectOpenHandles --forceExit` | Run all 21 test suites (136 tests) |
| `npm run test:coverage`| `jest --runInBand --coverage --detectOpenHandles --forceExit` | Run tests with coverage reporting |

---

## 🔌 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | 5 req / 15m | Register new user with university domain check |
| `GET` | `/api/auth/verify-email` | Public | — | Verify email via SHA-256 token query param |
| `POST` | `/api/auth/resend-verification` | Public | 5 req / 15m | Resend email verification link |
| `POST` | `/api/auth/login` | Public | 10 req / 15m | Authenticate user, issue access token & HttpOnly cookies |
| `POST` | `/api/auth/refresh` | Public | 30 req / 15m | Rotate refresh token and issue new access token |
| `POST` | `/api/auth/logout` | Authenticated | — | Revoke refresh token in database & clear cookies |
| `POST` | `/api/auth/forget-password` | Public | 5 req / 15m | Request 10-minute password reset link |
| `POST` | `/api/auth/reset-password/:token`| Public | 5 req / 15m | Reset password via token parameter |
| `GET` | `/api/auth/me` | Authenticated | — | Fetch current user profile |

### 🏛️ Auditoriums (`/api/auditoriums`)
| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/auditoriums/viewAllAuditoriums` | Public | 60 req / 1m | List all auditoriums (Redis cache-aside, 5m TTL) |
| `GET` | `/api/auditoriums/viewAuditorium/:id` | Public | 60 req / 1m | Get single auditorium details (Redis cached) |
| `POST` | `/api/auditoriums/createAuditorium` | Admin | 10 req / 1m | Create venue with up to 5 Cloudinary images |
| `PUT` | `/api/auditoriums/updateAuditorium/:id`| Admin | 10 req / 1m | Update venue, evict cache & delete old Cloudinary images |
| `DELETE`| `/api/auditoriums/deleteAuditorium/:id`| Admin | — | Delete venue (blocked if active bookings exist) |

### 📅 Bookings (`/api/bookings`)
| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings/calendar` | Student/Admin | 60 req / 1m | Fetch confirmed/approved bookings for month (YYYY-MM) |
| `POST` | `/api/bookings/createBooking` | Student | 5 req / 1m | Submit booking request (Redlock protected, max 3 active pending) |
| `GET` | `/api/bookings/my-bookings` | Student | 30 req / 1m | List user bookings with pagination |
| `PUT` | `/api/bookings/cancel/:id` | Student | 10 req / 1m | Cancel own booking (cancels payment and removes expiry job) |
| `GET` | `/api/bookings/all` | Admin | — | List all bookings with status & auditorium filters |
| `PUT` | `/api/bookings/status/:id` | Admin | — | Approve or decline booking (Redlock & transaction guarded) |

### 💳 Payments (`/api/payments`)
| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/create-order/:bookingId` | Student | 6 req / 1m | Create/fetch Razorpay order for approved booking |
| `POST` | `/api/payments/verify` | Student | 6 req / 1m | Verify HMAC-SHA256 signature (`Idempotency-Key` required) |
| `GET` | `/api/payments/:bookingId/receipt` | Authenticated | 20 req / 1m | Fetch receipt details (JSON) or inline PDF (`?format=pdf`) |
| `GET` | `/api/payments/:bookingId/receipt/download` | Authenticated | 10 req / 1m | Direct stream of pre-generated Cloudinary PDF |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | 60 req / 1m | Paginated notifications for current user |
| `GET` | `/api/notifications/unread-count` | Authenticated | 60 req / 1m | Unread notifications badge count |
| `PATCH`| `/api/notifications/read-all` | Authenticated | 30 req / 1m | Mark all notifications as read |
| `PATCH`| `/api/notifications/:id` | Authenticated | 30 req / 1m | Mark specific notification as read |
| `DELETE`| `/api/notifications/:id` | Authenticated | 30 req / 1m | Delete notification by ID |

---

## ⚙️ Background Worker Engine

AuditoReserve utilizes BullMQ backed by Redis for asynchronous job processing:

1. **`email-queue` (`worker/emailWorker.js`):**
   - Processes transactional emails: verification tokens, password reset links, booking approval notices, and cancellation alerts.
   - Primary transport uses the Brevo HTTP API; falls back to Nodemailer SMTP when configured.
2. **`booking-expiry` (`worker/bookingExpiryWorker.js`):**
   - Pending booking expiry: Auto-cancels booking requests left unreviewed by administrators within 24 hours (or before event start).
   - Approved booking expiry: Releases approved slots back to inventory if the 12-hour payment deadline expires.
   - Guarded with `lock:booking:${bookingId}` to prevent race conditions during concurrent payment verification.
3. **`pdf-generation-queue` (`worker/pdfWorker.js`):**
   - Assembles high-resolution vector PDF receipts using PDFKit.
   - Directly pipes PDF streams into Cloudinary (`upload_stream`) with zero local disk I/O.
   - Limits concurrency to `2` to preserve CPU and memory.

---

## 🧪 Automated Testing Suite

The backend contains **136 automated tests** across **21 test suites**:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

### Key Test Coverage:
- **Concurrency & Double-Booking:** Simulates simultaneous admin approvals for overlapping slots and verifies that only one succeeds while the second fails with a conflict error.
- **Payment Idempotency:** Simulates concurrent payment verification requests with identical `Idempotency-Key` headers to ensure single execution.
- **Privilege & Role Guarding:** Proves that students cannot escalate roles to `admin` during registration, forged JWTs are rejected, and expired tokens fail authentication.
- **Worker Simulation:** Tests pending and approved booking auto-expiry, lock retry behavior, and email dispatch triggers.

---

## 🩺 Health Checks & Observability

- **API Server Health Check:**
  ```bash
  curl http://localhost:5000/api/health
  # Response: {"success": true, "message": "Server is running"}
  ```

- **Worker Health Probe:**
  ```bash
  curl http://localhost:10000
  # Response: "Worker is active and running\n"
  ```

- **Structured Logging:** Winston outputs to stdout as well as `logs/error.log` and `logs/combined.log`.
