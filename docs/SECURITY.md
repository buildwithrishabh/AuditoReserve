# 🛡️ AuditoReserve — Security Architecture & Threat Model

This document outlines the security controls, cryptographic measures, and defensive patterns implemented across the **AuditoReserve** platform.

Every mechanism is structured as:
**Threat → Protection → Implementation**

---

## 📌 Table of Contents

- [1. Authentication & Session Security](#1-authentication--session-security)
- [2. Role-Based Access Control (RBAC)](#2-role-based-access-control-rbac)
- [3. Brute-Force & Denial of Service (Rate Limiting)](#3-brute-force--denial-of-service-rate-limiting)
- [4. Payment Signature Verification & Side-Channel Defense](#4-payment-signature-verification--side-channel-defense)
- [5. Concurrency, Race Conditions & Double-Booking Attacks](#5-concurrency-race-conditions--double-booking-attacks)
- [6. Idempotency & Duplicate Request Protection](#6-idempotency--duplicate-request-protection)
- [7. Input Validation & NoSQL Injection Defense](#7-input-validation--nosql-injection-defense)
- [8. File Upload Validation & Media Security](#8-file-upload-validation--media-security)
- [9. Browser Security, CORS & HTTP Headers](#9-browser-security-cors--http-headers)
- [10. Error Handling & Information Leakage](#10-error-handling--information-leakage)
- [11. Container & Deployment Security](#11-container--deployment-security)

---

## 1. Authentication & Session Security

### 1.1 In-Memory Access Token Storage
- **Threat**: Cross-Site Scripting (XSS) scripts accessing JWT tokens stored in `localStorage` or `sessionStorage` and exfiltrating them to attacker-controlled servers.
- **Protection**: Access tokens are kept strictly in JavaScript runtime memory and never written to web storage.
- **Implementation**:
  - The React client stores the access token in module-level in-memory state (`frontend/src/api.js`).
  - Access tokens have a short lifespan (15 minutes).
  - When the browser tab closes or refreshes, the token is cleared from memory and silently re-obtained via the HttpOnly refresh cookie.

### 1.2 HttpOnly Refresh Cookie & Token Rotation
- **Threat**: Long-lived session theft and token replay attacks.
- **Protection**: Long-lived refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies inaccessible to client JavaScript. Each refresh call rotates the token.
- **Implementation**:
  - `POST /api/auth/refresh` reads `req.cookies.refreshToken`.
  - The server verifies the token signature, hashes the incoming token using SHA-256, and compares it to the hashed token in MongoDB (`User.refreshToken`).
  - If a reused or stolen token is presented, the server revokes the user's entire session family (`User.refreshToken = null`) and responds with `HTTP 403 Forbidden`.
  - On valid refresh, a newly signed refresh token replaces the old one and the cookie is re-issued.

### 1.3 University Domain Restriction
- **Threat**: Unauthorized public users creating accounts and booking university facilities without academic standing.
- **Protection**: Strict email domain validation during registration.
- **Implementation**:
  - `backend/src/validators/authValidators.js` enforces that email addresses must end with the configured institutional domain (e.g. `@tmu.ac.in`).
  - Registration without this domain is rejected with `HTTP 400 Bad Request`.

### 1.4 Mandatory Email Verification
- **Threat**: Sybil attacks using fake email addresses to hoard auditoriums.
- **Protection**: Unverified accounts are strictly blocked from booking or administrative routes.
- **Implementation**:
  - The `isverified` middleware inspects `req.user.isVerified`.
  - If `false`, the request is rejected with `HTTP 403 Forbidden` (`"Please verify your email before accessing this service"`).

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Privilege Escalation during Registration
- **Threat**: An attacker sending `{"role": "admin"}` in the registration payload to obtain administrative rights.
- **Protection**: Explicit payload sanitization in controllers.
- **Implementation**:
  - `register` in `backend/src/controllers/authController.js` only extracts `name`, `email`, and `password`. The `role` property is hardcoded to default to `"student"`.

### 2.2 Route-Level Role Authorization
- **Threat**: Students modifying venue tariffs, approving their own bookings, or deleting auditoriums.
- **Protection**: Strict role-checking middleware.
- **Implementation**:
  - `authorizeRole("admin")` validates that `req.user.role === "admin"`. If a non-admin attempts access, `HTTP 403 Forbidden` is returned immediately.

---

## 3. Brute-Force & Denial of Service (Rate Limiting)

### 3.1 Distributed Sliding Window Log Rate Limiter
- **Threat**: Credential stuffing, brute-force password cracking, and API denial-of-service bursts across multiple load-balanced API instances.
- **Protection**: Atomic sliding-window rate limiting backed by Redis.
- **Implementation**:
  - Located in `backend/src/middlewares/rateLimiter.js`.
  - Uses an atomic Lua script executed on Redis:
    ```lua
    redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
    local count = redis.call('ZCARD', key)
    if count >= maxRequests then
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      return {0, count, oldest[2]}
    end
    redis.call('ZADD', key, now, member)
    redis.call('PEXPIRE', key, windowMs)
    return {1, count + 1, 0}
    ```
  - Standard headers are returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.
  - Fails open gracefully on Redis network errors to prevent service outages.

---

## 4. Payment Signature Verification & Side-Channel Defense

### 4.1 Cryptographic Timing Attacks on Signatures
- **Threat**: Timing side-channel attacks during payment verification where an attacker measures string comparison times character-by-character to forge a valid Razorpay payment signature.
- **Protection**: Constant-time byte buffer comparison (`crypto.timingSafeEqual`).
- **Implementation**:
  - In `backend/src/controllers/paymentController.js`:
    ```javascript
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature || "", "utf8");

    const isSignatureValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    ```
  - If the signature is invalid, payment status is set to `failed` and rejected with `HTTP 400 Bad Request`.

---

## 5. Concurrency, Race Conditions & Double-Booking Attacks

### 5.1 Simultaneous Slot Booking (Two Students at the Same Instant)
- **Threat**: Two students simultaneously submitting a booking request for the same auditorium on the same date and overlapping time window, causing both to be stored.
- **Protection**: Distributed locking (Redlock algorithm) across API nodes.
- **Implementation**:
  - `backend/src/utils/lock.js` acquires a Redis key `lock:booking:${auditoriumId}:${bookingDate}` with `NX PX` lease duration.
  - The second request is rejected with `HTTP 409 Conflict` (`"Another user is processing this booking"`).
  - Safe lock release is enforced via a Lua script ensuring only the lock owner holding the random UUID can release it.

### 5.2 Simultaneous Approval Race Condition (Admin Approval vs Payment Expiry)
- **Threat**: An admin approves a booking at the exact millisecond the 24-hour review expiry worker attempts to cancel it.
- **Protection**: Distributed lock `lock:booking:${bookingId}` + MongoDB ACID Multi-Document Session Transactions.
- **Implementation**:
  - Both `updateBookingStatus` and `bookingExpiryWorker` acquire `lock:booking:${bookingId}` before processing.
  - Operations execute inside `session.startTransaction()`. If any step fails, `session.abortTransaction()` reverts changes cleanly.

---

## 6. Idempotency & Duplicate Request Protection

### 6.1 Payment Verification Replay Attacks
- **Threat**: Unreliable network connections causing a client to submit duplicate `/api/payments/verify` requests, triggering multiple PDF generations, conflicting state writes, or double receipts.
- **Protection**: Per-user scoped idempotency keys with locked processing state.
- **Implementation**:
  - Middleware: `backend/src/middlewares/idempotencyMiddleware.js`.
  - Requires `Idempotency-Key` header.
  - Redis key: `idempotency:${userId}:${idempotencyKey}`.
  - If a concurrent request arrives while the first is in-flight, it returns `HTTP 409 Conflict` (`"A request with this Idempotency-Key is currently being processed"`).
  - Upon successful completion, the exact response payload is cached for 24 hours (`ttl: 86400`). Subsequent retries return the cached response with header `X-Idempotent-Replayed: true`.

---

## 7. Input Validation & NoSQL Injection Defense

### 7.1 Malicious Object Payloads in Query / Body
- **Threat**: NoSQL operator injection (e.g. `{"email": {"$ne": null}}`) bypassing password checks in authentication queries.
- **Protection**: Strict Zod schema validation on all ingress routes.
- **Implementation**:
  - `backend/src/middlewares/validateMiddleware.js` parses and validates `req.body`, `req.query`, and `req.params` against strict Zod definitions before controllers execute.
  - If any input contains unexpected types or operators, Zod rejects the request with `HTTP 400 Bad Request` and detailed field-level errors.

---

## 8. File Upload Validation & Media Security

### 8.1 Malicious File Uploads (Web Shells / Executables)
- **Threat**: Users uploading `.exe`, `.php`, or oversized files disguised as auditorium photos.
- **Protection**: Multer memory storage with MIME-type filtering and file size limits.
- **Implementation**:
  - `backend/src/middlewares/uploadMiddleware.js` restricts file types to `image/jpeg`, `image/png`, and `image/webp`.
  - File size is capped at 5MB per image, with a maximum of 5 images per request.
  - Files are streamed directly into Cloudinary CDN. No raw user uploads are stored on the local server filesystem.

---

## 9. Browser Security, CORS & HTTP Headers

### 9.1 Cross-Origin Request Forgery & Unauthorized Domain Access
- **Threat**: Third-party malicious websites making authenticated credentialed requests to the booking API.
- **Protection**: Dynamic origin whitelisting with credentials enforcement.
- **Implementation**:
  - `backend/src/app.js` configures CORS:
    - Whitelists `FRONTEND_URL`, `http://localhost:5173`, `http://localhost:3000`, and authorized Vercel production domains (`*.vercel.app`).
    - Enforces `credentials: true`.
    - Explicitly whitelists methods and headers (`Content-Type`, `Authorization`, `Idempotency-Key`).
  - **Helmet** is configured to set standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Resource-Policy`).

---

## 10. Error Handling & Information Leakage

### 10.1 Stack Trace & Database Details Exposure
- **Threat**: Detailed error messages exposing database connection strings, collection names, or internal stack traces to attackers.
- **Protection**: Centralized global error handling middleware.
- **Implementation**:
  - `backend/src/middlewares/errorMiddleware.js` intercepts all thrown errors.
  - Formats Mongoose `CastError`, duplicate key `code: 11000`, and `JsonWebTokenError` into generic, safe messages.
  - When `process.env.NODE_ENV === "production"`, the `stack` trace property is omitted from error responses.

---

## 11. Container & Deployment Security

### 11.1 Container Root User Execution
- **Threat**: In containerized environments, running the Node.js process as `root` grants full host compromise if an RCE vulnerability exists.
- **Protection**: Unprivileged user execution in Docker.
- **Implementation**:
  - `backend/Dockerfile` creates a non-root environment:
    ```dockerfile
    USER node
    ```
  - Dependencies are installed using `npm ci --omit=dev` to ensure development dependencies with potential vulnerabilities are omitted from production images.

---

## 📚 Related Documentation

- 🏛️ **[Architecture Guide](./ARCHITECTURE.md)** — Deep dive into system components, process models, and message flows.
- 🔌 **[API Reference](./API.md)** — Detailed REST endpoints, request/response schemas, and error codes.
- 📐 **[Design Decisions](./DESIGN-DECISIONS.md)** — Architectural trade-offs, engineering rationales, and alternatives considered.
- 📖 **[Project Readme](../README.md)** — System overview, local quickstart, and deployment instructions.

