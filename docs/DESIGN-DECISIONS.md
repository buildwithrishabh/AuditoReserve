# 💡 AuditoReserve — Architectural & Engineering Design Decisions

This document details the core architectural rationale, engineering trade-offs, and technical considerations behind the design of **AuditoReserve**.

---

## 📌 Table of Contents

- [1. Decoupled Architecture: API vs Dedicated Worker Process](#1-decoupled-architecture-api-vs-dedicated-worker-process)
- [2. Why MongoDB with Mongoose?](#2-why-mongodb-with-mongoose)
- [3. Why Redis as a Multi-Purpose State Engine?](#3-why-redis-as-a-multi-purpose-state-engine)
- [4. Distributed Locks (Redlock) vs Database Locking](#4-distributed-locks-redlock-vs-database-locking)
- [5. Why BullMQ for Asynchronous Queuing?](#5-why-bullmq-for-asynchronous-queuing)
- [6. Zero-Disk PDF Streaming with Cloudinary](#6-zero-disk-pdf-streaming-with-cloudinary)
- [7. In-Memory Access Tokens with HttpOnly Refresh Cookies](#7-in-memory-access-tokens-with-httponly-refresh-cookies)
- [8. Sliding Window Log vs Fixed Window Rate Limiting](#8-sliding-window-log-vs-fixed-window-rate-limiting)
- [9. Consistency vs Availability Trade-Offs](#9-consistency-vs-availability-trade-offs)
- [10. Known Limitations & Technical Debt](#10-known-limitations--technical-debt)

---

## 1. Decoupled Architecture: API vs Dedicated Worker Process

### Decision
Split the backend into two distinct runtime entry points:
- `backend/src/server.js`: Handles synchronous HTTP requests and real-time Socket.IO connections.
- `backend/src/worker.js`: Handles asynchronous BullMQ queue jobs (emails, PDF compilation, delayed slot expirations).

### Rationale
- **Single-Threaded Event Loop Protection**: Node.js operates on a single-threaded event loop. Intensive tasks like PDFKit vector rendering and bulk email dispatching block CPU cycles, leading to high latency for incoming HTTP requests.
- **Independent Scalability**: In production, the API servers can be scaled horizontally (e.g., 5 web containers) based on network request volume, while the worker pool can be scaled independently (e.g., 2 worker containers) based on queue backlogs.
- **Platform Compatibility**: Render and other PaaS providers require web services to bind to a port. `worker.js` includes a lightweight internal health check server (`http.createServer` on port 10000) so it can deploy cleanly as a managed service without crashing port probes.

---

## 2. Why MongoDB with Mongoose?

### Decision
Use MongoDB as the primary persistent data store, managed through Mongoose models with strict compound indexes.

### Rationale
- **Document Model Alignment**: Campus venues, booking metadata, and payment records naturally fit a document hierarchy (e.g., arrays of amenities, multi-image URLs, embedded user and auditorium snapshots in receipts).
- **Multi-Document ACID Transactions**: Starting in MongoDB 4.0+, multi-document transactions allow coordinating atomic updates across `Booking` and `Payment` documents within an explicit session (`session.startTransaction()`). This guarantees that booking approvals and payment verifications either succeed completely or roll back without leaving partial state.
- **Compound Query Indexing**: Mongoose compound indexes (`{ auditorium: 1, status: 1, bookingDate: 1, startTime: 1, endTime: 1 }`) enable sub-millisecond execution for interval collision checks even with tens of thousands of historical records.

---

## 3. Why Redis as a Multi-Purpose State Engine?

### Decision
Utilize Redis 7 as a unified, high-performance in-memory state engine serving five distinct architectural responsibilities:
1. **Cache-Aside Store**: Caches auditorium catalog queries (`getOrSetCache`, TTL 300s) to minimize MongoDB query load.
2. **Distributed Concurrency Locks**: Implements Redlock-style distributed locks for mutual exclusion during booking creation and approval.
3. **Sliding Window Rate Limiter**: Powers atomic Lua scripts tracking per-client request logs.
4. **BullMQ Message Broker**: Serves as the storage and delayed job scheduling engine for background queues.
5. **Socket.IO Pub/Sub Mesh**: Coordinates WebSocket broadcast events across multiple API server nodes via `@socket.io/redis-adapter`.

### Rationale
- Deploying a single, robust Redis cluster handles caching, queues, locking, and real-time clustering simultaneously, reducing infrastructure overhead while providing sub-millisecond in-memory performance.

---

## 4. Distributed Locks (Redlock) vs Database Locking

### Decision
Enforce mutual exclusion on booking slots using Redis distributed locks (`backend/src/utils/lock.js`) rather than database pessimistic locking or row-level constraints.

### Rationale
- **Lock Auto-Expiration (TTL Guard)**: If an API server crashes or network partitions occur midway through processing, the Redis `PX` lease automatically expires (e.g., after 10 or 15 seconds), releasing the resource without leaving orphaned deadlocks in the database.
- **Safe Release Semantics**: Lock acquisition stores a cryptographically random UUID (`crypto.randomUUID()`). The release mechanism uses an atomic Lua script:
  ```lua
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
  ```
  This guarantees that a slow process whose lock has expired cannot inadvertently release a lock subsequently acquired by another process.

---

## 5. Why BullMQ for Asynchronous Queuing?

### Decision
Use **BullMQ** over simpler alternatives (like in-memory setTimeout or basic message brokers).

### Rationale
- **Delayed Job Scheduling**: The university reservation workflow requires delayed expirations (e.g., auto-cancelling approved bookings if payment is not received within 12 hours). BullMQ natively supports delayed jobs stored durably in Redis.
- **Exponential Backoff & Retries**: External dependencies (Brevo email API, Cloudinary uploads) can experience transient network failures. BullMQ provides built-in exponential backoff retries without custom retry loop boilerplate.
- **Job Removal & Cancellation**: When a student completes payment for an approved booking, the pending 12-hour expiration job must be cancelled immediately. BullMQ allows jobs to be found and removed by custom job IDs (`booking_expiry_${bookingId}`).

---

## 6. Zero-Disk PDF Streaming with Cloudinary

### Decision
Stream PDF receipts directly from PDFKit into Cloudinary CDN via Node.js write streams (`backend/src/utils/cloudinaryHelper.js`) without saving `.pdf` files to local disk.

### Rationale
- **Container Ephemerality**: Cloud deployment platforms (Docker, Render, AWS ECS) utilize ephemeral local filesystems. Saving PDFs to local disk requires managing local directory cleanup cron jobs and risks exhausting container disk space.
- **Memory Efficiency**: Piping `doc.pipe(uploadStream)` streams binary data in chunks directly across the network to Cloudinary's secure upload API, avoiding memory spikes from buffering large multi-page receipts into memory.
- **Secure CDN Delivery**: Storing the resulting Cloudinary HTTPS URL in `payment.receiptPdfUrl` allows students to access their official receipts permanently without loading the API server.

---

## 7. In-Memory Access Tokens with HttpOnly Refresh Cookies

### Decision
Store the short-lived JWT access token in JavaScript memory and the long-lived refresh token in an `HttpOnly`, `SameSite=Lax` cookie.

### Rationale
- **Defense-in-Depth against XSS**: Storing access tokens in `localStorage` makes them vulnerable to any script injected through third-party dependencies or XSS vectors. In-memory storage completely eliminates localStorage credential exposure.
- **CSRF Mitigation**: The refresh endpoint is isolated to `POST /api/auth/refresh`. Combining `SameSite=Lax` cookies with strict CORS origin verification protects the refresh mechanism from cross-origin forged requests.
- **Automatic Silent Re-Authentication**: The frontend Axios client interceptor silently catches 401 errors, queues in-flight requests, calls `/api/auth/refresh` to rotate credentials, and retries the original request seamlessly.

---

## 8. Sliding Window Log vs Fixed Window Rate Limiting

### Decision
Implement a sliding window log rate limiter using Redis sorted sets (`ZSET`) and Lua scripts instead of a standard fixed-window counter.

### Rationale
- **Boundary Burst Elimination**: Fixed-window rate limiters (e.g., 60 requests per minute resetting at :00) permit attackers to send 60 requests at :59 and another 60 requests at :01, creating a burst of 120 requests in 2 seconds.
- **True Rolling Window Accuracy**: The sliding window log dynamically cleans expired entries (`ZREMRANGEBYSCORE key -inf windowStart`) and measures the exact count over the preceding rolling 60 or 900 seconds.

---

## 9. Consistency vs Availability Trade-Offs

### Model: Strong Consistency for Bookings & Payments, Eventual Consistency for Notifications & Caches

| Subsystem | Model | Rationale |
| :--- | :---: | :--- |
| **Slot Booking & Approval** | **Strong Consistency** | Double-booking two events in the same hall is an unacceptable business failure. Redlock and MongoDB ACID transactions guarantee that only one booking can claim a slot. |
| **Payment Verification** | **Strong Consistency** | Payment confirmation and slot locking execute inside a single MongoDB atomic session with conditional status verification. |
| **Catalog Browsing** | **Eventual Consistency** | Public browsing can tolerate seconds of latency. Catalog reads are served from Redis cache (`TTL: 300s`) and invalidated via pattern matching (`delPattern`) on venue mutations. |
| **Push Notifications** | **Eventual Consistency** | Notifications and emails are dispatched asynchronously via BullMQ and WebSockets. A slight delay in receiving an email does not compromise data integrity. |

---

## 10. Known Limitations & Technical Debt

1. **Redis as a Single Point of Failure (SPOF)**:
   - In the local and development configurations, a single Redis instance handles locking, rate limiting, and queues. If Redis crashes, booking submissions and payment verification will fail.
   - *Production Solution*: Deploy a Redis Sentinel or AWS ElastiCache cluster with multi-AZ replication.

2. **MongoDB Replica Set Requirement for Transactions**:
   - MongoDB transactions (`session.startTransaction()`) require a replica set. Standalone local MongoDB instances cannot execute multi-document transactions unless configured as a single-node replica set.
   - The test suite handles this via in-memory replication helpers (`tests/setup.js`).

3. **External Payment Webhook Dependency**:
   - Currently, payment verification is driven primarily by the client-side redirect calling `POST /api/payments/verify`. If a user closes their browser immediately after Razorpay checkout but before the redirect fires, the booking relies on Razorpay webhooks or manual student retry.

---

## 📚 Related Documentation

- 🏛️ **[Architecture Guide](./ARCHITECTURE.md)** — Deep dive into system components, process models, and message flows.
- 🔌 **[API Reference](./API.md)** — Detailed REST endpoints, request/response schemas, and error codes.
- 🛡️ **[Security Architecture](./SECURITY.md)** — Threat modeling, token lifecycle, and cryptographical validations.
- 📖 **[Project Readme](../README.md)** — System overview, local quickstart, and deployment instructions.

