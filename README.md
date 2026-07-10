# AudiReserve - Auditorium Booking System

AudiReserve is a modern, high-performance, full-stack web application designed for educational institutions to streamline auditorium reservations. It features role-based workflows, real-time availability checking, secure payment processing, a resilient Redis-backed caching layer, and an asynchronous background queue system for emails, automated booking expiries, and real-time in-app notifications.

---

## Table of Contents

- [Core Workflows](#core-workflows)
- [Architecture & Key Design Patterns](#architecture--key-design-patterns)
  - [1. Resilient Caching (Redis Cache-Aside)](#1-resilient-caching-redis-cache-aside)
  - [2. Asynchronous Queue Architecture (BullMQ)](#2-asynchronous-queue-architecture-bullmq)
  - [3. Payment Processing & Auto-Expiry](#3-payment-processing--auto-expiry)
  - [4. Real-time In-App Notification Center (Socket.io)](#4-real-time-in-app-notification-center-socketio)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Security Features](#security-features)

---

## Core Workflows

```
[Student] Registers & Verifies Email
   │
   ▼
[Student] Requests a Booking Slot (Conflict check performed) ──► Real-time In-App Alert
   │
   ▼
[Admin] Reviews & Approves Booking
   │
   ├─► [System] Generates Razorpay Order & Payment Intent
   ├─► [System] Triggers delayed job (12 hours) in Expiry Queue
   ├─► [System] Dispatches payment request email to student
   └─► [System] Pushes real-time Payment Request notification to student's dashboard
   │
   ├───► Paid within 12 hours?
   │        │
   │        ├───► [YES] ──► Booking confirmed. Confirmation email sent.
   │        │               Push notification: "Booking Confirmed 🎉"
   │        │
   │        └───► [NO]  ──► Expiry worker cancels booking and payment order.
   │                        Cancellation email sent. Push notification: "Booking Expired".
```

---

## Architecture & Key Design Patterns

### 1. Resilient Caching (Redis Cache-Aside)
AudiReserve uses the **Cache-Aside pattern** with Redis to provide high-speed reads for public auditorium listings and single auditorium lookups. 
- **Read Strategy**: Requests query Redis first. On a cache miss, data is read from MongoDB, stored in Redis with a Time-To-Live (TTL) of **300 seconds (5 minutes)**, and returned.
- **Write Strategy & Invalidation**: Any write operation (Create, Update, Delete) dynamically invalidates the associated Redis keys (e.g., `auditoriums:*`), preventing stale data reads.
- **Resilience**: A try-catch fallback wrapper guarantees that if the Redis service goes offline, the server automatically routes all traffic directly to MongoDB without crashing.

### 2. Asynchronous Queue Architecture (BullMQ)
For heavyweight background processes, AudiReserve implements **BullMQ** coupled with a dedicated Redis instance:
- **`email-queue`**: Decouples SMTP email delivery from the main request-response cycle. Registration, email verification, password resets, payment notifications, and cancellation alerts are handled in the background.
- **`booking-expiry`**: Utilizes delayed jobs to handle payment windows.
- **Graceful Shutdown Handling**: Both email and expiry workers capture `SIGTERM` and `SIGINT` signals, ensuring they finish active processing before closing connections gracefully to prevent job loss or database inconsistency.

### 3. Payment Processing & Auto-Expiry
- When an administrator approves a booking, a corresponding **Payment** record is created with an order ID via the **Razorpay API**.
- A BullMQ delayed job is registered for exactly **12 hours** into the future.
- If the student completes the payment through the frontend, the payment status transitions to `paid` and the booking status is set to `confirmed`.
- If the 12-hour window lapses and the status remains `approved`, the `bookingExpiryWorker` automatically resets the booking status to `cancelled`, voids the payment intent, and notifies the student.

### 4. Real-time In-App Notification Center (Socket.io)
AudiReserve implements a real-time push layer paired with persistent storage for in-app notifications.
- **Persistent Storage**: All notifications (pending bookings, payment requests, approvals, expiries, cancellations, and confirmations) are saved to a MongoDB collection. This allows users to view their notification history when logging in from any device.
- **Real-Time Push**: WebSockets (using **Socket.io**) deliver instantaneous alerts directly to the user interface when they have the application open.
- **Connection Tracker**: Keeps a map of user IDs to socket connections. It supports multi-device/multi-tab connection tracking, ensuring real-time notifications are pushed to all active sessions of a user.
- **Graceful Disconnection**: Automatically cleans up socket instances upon client disconnection to prevent memory leaks.

---

## Tech Stack

### Backend
* **Node.js** & **Express.js** — Fast, asynchronous web server framework.
* **MongoDB** & **Mongoose** — Document-based database & Object Data Modeling.
* **Redis** (`ioredis`) — Caching database and message broker for BullMQ.
* **BullMQ** — Enterprise-grade message queue and background job scheduler.
* **Socket.io** — Real-time bidirectional event-based communication.
* **Razorpay Node SDK** — Payment gateway processing.
* **Nodemailer** — Verification, payment request, and receipt email dispatches (supports SMTP/Brevo HTTP API).
* **Cloudinary & Multer** — Multi-file image uploading and Content Delivery Network (CDN) hosting.
* **Cookie** & **Cookie-Parser** — Safe HTTP cookie parsing and header tokens management.
* **Helmet** & **CORS** — HTTP headers security policy and Cross-Origin request security.
* **Express Rate Limit** — Brute-force and DDoS mitigation on auth endpoints.

### Frontend
* **React 19** & **TypeScript** — Component architecture and strict typing.
* **Vite** — High-speed build toolchain.
* **Tailwind CSS v4** — Modern utility-first stylesheet layouts.
* **TanStack React Query** — Caching, synchronizing, and updating server state in React.
* **Framer Motion** — Fluid micro-interactions and transitions.
* **React Hook Form** & **Zod** — Schema-driven validation and form management.
* **Socket.io Client** — Real-time event listener integration.

---

## Project Structure

```
Auditorium Booking System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── cloudinary.js        # Cloudinary client config
│   │   │   ├── redis.js             # Standalone Redis connection for caching
│   │   │   ├── razorPay.js          # Razorpay client instance
│   │   │   ├── queueConnection.js   # Redis connection config shared by BullMQ Queues/Workers
│   │   │   └── socket.js            # Socket.io server instance, cookies auth, & socket registry
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register, login, verification, and reset password logic
│   │   │   ├── auditoriumController.js # CRUD handlers for Auditoriums with cache invalidation
│   │   │   ├── bookingController.js  # Booking requests, approval logic, and expiry queue triggering
│   │   │   ├── paymentController.js  # Razorpay order creation and webhook/signature validation
│   │   │   └── notificationController.js # In-app notification API handlers (read, get, delete)
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js    # JWT protection, role checks (Student/Admin), and verification filters
│   │   │   └── uploadMiddleware.js  # Multer integration with Cloudinary
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── auditorium.js
│   │   │   ├── booking.js           # Includes approvedAt, paymentDeadline, and status states
│   │   │   ├── payment.js           # Tracks transaction amounts, gateways, orders, and signatures
│   │   │   └── notification.js      # Persistent storage schema for in-app user notifications
│   │   ├── queue/
│   │   │   ├── emailQueue.js        # BullMQ email queue wrapper
│   │   │   └── bookingExpiryQueue.js # BullMQ booking expiry queue wrapper
│   │   ├── worker/
│   │   │   ├── emailWorker.js       # Background job handler for sending emails
│   │   │   └── bookingExpiryWorker.js # Background job handler for 12-hour booking cancellations
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── auditoriumRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   └── notificationRoutes.js # Secured API routes for notifications
│   │   ├── service/
│   │   │   ├── email.js             # Transporter selection (Nodemailer vs Brevo API)
│   │   │   └── notificationService.js # Business service to write and dispatch in-app notifications
│   │   ├── utils/
│   │   │   ├── cache.js             # Redis cache wrapping layers
│   │   │   ├── EmailOptions.js      # Custom dynamic HTML templates for user notifications
│   │   │   └── jwt.js               # Access/Refresh token creation and hashing utilities
│   │   ├── app.js                   # Express application setup and global error handlers
│   │   └── server.js                # Main server entrypoint (Initializes HTTP server, database, Socket.io, & workers)
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.ts            # Axios central configuration
    │   │   ├── auth.ts
    │   │   ├── auditoriums.ts
    │   │   ├── bookings.ts
    │   │   └── payments.ts          # Integrates backend payment endpoints with Razorpay checkout
    │   ├── components/
    │   │   ├── auditoriums/
    │   │   ├── auth/
    │   │   ├── bookings/
    │   │   ├── common/
    │   │   └── layout/
    │   ├── hooks/
    │   │   ├── useAuth.tsx          # Session authentication provider
    │   │   ├── useToast.ts          # Feedback UI helper
    │   │   └── ToastProvider.tsx
    │   ├── pages/
    │   │   ├── admin/
    │   │   ├── auth/
    │   │   ├── public/
    │   │   └── student/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   └── types.ts
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## Getting Started

### Prerequisites
* **Node.js** (v18+)
* **MongoDB** (Local instance or Mongo Atlas URL)
* **Redis** (Local instance or Cloud Redis host)
* **Cloudinary** (For auditorium image hosting)
* **Razorpay Account** (In test mode)
* **Brevo or Gmail App Credentials** (For sending emails)

### Installation & Run Commands

1. **Clone Repository**:
   ```bash
   git clone https://github.com/buildwithrishabh/AuditoReserve.git
   cd "Auditorium Booking System"
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables inside .env
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Set API URL parameters inside .env
   npm run dev
   ```

* The app will run at:
  * **Frontend**: `http://localhost:5173`
  * **Backend URL**: `http://localhost:5000`

---

## Environment Variables

### Backend Config (`backend/.env`)
| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `PORT` | Local network port | `5000` |
| `MONGODB_URI` | Connection string | `mongodb+srv://...` |
| `NODE_ENV` | Mode check | `development` or `production` |
| `REDIS_HOST` | Redis endpoint | `127.0.0.1` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis auth key | `your_redis_password` |
| `UNIVERSITY_DOMAIN` | Verification constraint | `tmu.ac.in` |
| `JWT_ACCESS_SECRET` | Access sign key | `your_access_secret` |
| `JWT_REFRESH_SECRET`| Refresh sign key | `your_refresh_secret` |
| `SMTP_HOST` | SMTP relay server | `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP connection port | `587` |
| `SMTP_USER` | Email account username | `example@smtp-brevo.com` |
| `BREVO_API_KEY` | Brevo API key (bypasses port block)| `xkeysib-...` |
| `FROM_EMAIL` | Sender address | `noreply@domain.com` |
| `FROM_NAME` | Sender display name | `AuditoReserve` |
| `CLOUDINARY_CLOUD_NAME`| Cloud name | `cloud_name` |
| `CLOUDINARY_API_KEY`  | API identifier | `your_api_key` |
| `CLOUDINARY_API_SECRET`| Secret key | `your_api_secret` |
| `RAZORPAY_KEY_ID` | Sandbox Key ID | `rzp_test_xxxxxx` |
| `RAZORPAY_SECRET_KEY` | Sandbox secret | `your_secret_key` |

---

## API Endpoints

### Auth Module (`/api/auth`)
* `POST /register` — Registration request. (Public)
* `GET /verify-email?token=...` — Activates verification token. (Public)
* `POST /login` — Authenticates credentials, sets cookie tokens. (Public)
* `POST /refresh` — Re-signs expired access tokens. (Cookie validation)
* `POST /logout` — Removes access cookies and destroys sessions. (Authenticated)
* `POST /forget-password` — Dispatches reset link. (Public)
* `POST /reset-password/:token` — Validates password updates. (Public)
* `GET /me` — Retrieves current session details. (Authenticated)

### Auditoriums Module (`/api/auditoriums`)
* `GET /viewAllAuditoriums` — List all venues. (Public, **Cached**)
* `GET /viewAuditorium/:id` — Details of a venue. (Public, **Cached**)
* `POST /createAuditorium` — Inserts new venue. (Admin, **Invalidates cache**)
* `PUT /updateAuditorium/:id` — Edits existing venue. (Admin, **Invalidates cache**)
* `DELETE /deleteAuditorium/:id` — Removes venue. (Admin, **Invalidates cache**)

### Bookings Module (`/api/bookings`)
* `POST /createBooking` — Submits slot request. (Student)
* `GET /my-bookings` — Lists personal bookings. (Student)
* `PUT /cancel/:id` — Cancels reservations. (Student)
* `GET /all` — Lists all reservation bookings. (Admin)
* `PUT /status/:id` — Modifies status to `approved`/`cancelled` & registers delayed expiry job. (Admin)

### Payments Module (`/api/payments`)
* `POST /create-order/:bookingId` — Generates a Razorpay order invoice. (Student)
* `POST /verify` — Validates signature parameters to complete reservations. (Student)

### Notifications Module (`/api/notifications`)
* `GET /` — Get user's notification history (paginated). (Authenticated)
* `GET /unread-count` — Get count of unread notifications. (Authenticated)
* `PATCH /read-all` — Mark all notifications of the user as read. (Authenticated)
* `PATCH /:id` — Mark a specific notification as read. (Authenticated)
* `DELETE /:id` — Delete a notification record. (Authenticated)

---

## Data Models

### User Schema
```javascript
{
  name: String,                      // Required
  email: String,                     // Required, unique, restricted to UNIVERSITY_DOMAIN
  password: String,                  // Hashed (bcrypt)
  role: String,                      // 'student' or 'admin'
  isVerified: Boolean,               // Default: false
  refreshToken: String,              // Secure hashed token
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

### Auditorium Schema
```javascript
{
  name: String,                      // Required
  capacity: Number,                  // Required
  amenities: [String],               // e.g. ["Projector", "WiFi", "AC"]
  images: [String],                  // Cloudinary image URLs
  basePrice: Number,                 // Hourly price rate (INR)
  description: String                // Details & policies
}
```

### Booking Schema
```javascript
{
  user: ObjectId,                    // Reference to User
  auditorium: ObjectId,              // Reference to Auditorium
  bookingDate: Date,                 // Reservation target day
  startTime: String,                 // 24hr normalized format (e.g. "09:00")
  endTime: String,                   // 24hr normalized format (e.g. "17:00")
  purpose: String,
  status: String,                    // 'pending', 'approved', 'confirmed', 'cancelled'
  totalPrice: Number,                // Calculated price (hours * basePrice)
  paymentId: ObjectId,               // Reference to Payment model
  approvedAt: Date,                  // Approval timestamp
  paymentDeadline: Date              // Date indicating 12-hour limit
}
```

### Payment Schema
```javascript
{
  user: ObjectId,                    // Reference to User
  booking: ObjectId,                 // Reference to Booking
  amount: Number,                    // Total INR transaction amount
  currency: String,                  // Defaults to "INR"
  gateway: String,                   // Defaults to "razorpay"
  gatewayOrderId: String,            // Unique Razorpay Order ID
  gatewayPaymentId: String,          // Unique Razorpay Transaction ID
  gatewaySignature: String,          // Signature validation key
  status: String,                    // 'created', 'paid', 'failed', 'expired', 'refunded'
  receipt: String,                   // Unique invoice serial
  expiresAt: Date,                   // Match deadline timestamp
  paidAt: Date,                      // Confirmation timestamp
  failureReason: String
}
```

### Notification Schema
```javascript
{
  recipient: ObjectId,               // Reference to User (Required, Indexed)
  sender: ObjectId,                  // Reference to User (Optional, e.g., admin or null)
  type: String,                      // 'BOOKING_PENDING', 'BOOKING_APPROVED', 'BOOKING_CANCELLED', 'BOOKING_CONFIRMED', 'PAYMENT_REQUEST', 'PAYMENT_SUCCESS', 'SYSTEM'
  title: String,                     // Required
  message: String,                   // Required
  isRead: Boolean,                   // Default: false (Indexed)
  data: {
    bookingId: ObjectId,             // Reference to Booking
    paymentId: ObjectId              // Reference to Payment
  },
  createdAt: Date                    // Default: Date.now
}
```

---

## Security Features

1. **Password Safety**: Hashed using `bcryptjs` with a cost factor of 10.
2. **Access Control**: Role-based access control (RBAC) checks on every endpoint, ensuring students cannot access admin control panels.
3. **Session Cookies**: Access tokens and Refresh tokens are secured in HTTP-only cookies to avoid Cross-Site Scripting (XSS) extraction.
4. **WebSocket Security**: Socket.io middleware parses connection cookies to authorize WebSocket handshakes with JWT, preventing anonymous listener connections.
5. **Rate Limiter**: Requests are capped on `/api/auth` endpoints to limit brute force logins.
6. **Secure Headers**: Integrated `helmet` middleware to hide headers and prevent content injection attacks.
7. **Input Validation**: Normalized time slot format checking and database integrity checks to prevent double booking.

---

## License
Distributed under the **ISC License**.

---

## Contributors
* **Rishabh Kumar** — [@buildwithrishabh](https://github.com/buildwithrishabh)
