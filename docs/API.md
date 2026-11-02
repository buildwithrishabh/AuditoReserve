# 🔌 AuditoReserve — REST API Specification

This document provides complete, accurate documentation for every REST endpoint exposed by the **AuditoReserve** backend API. All endpoints are prefixed with `/api`.

---

## 📌 Table of Contents

- [Global Conventions & Headers](#global-conventions--headers)
- [Rate Limiting Reference](#rate-limiting-reference)
- [1. Authentication Endpoints (`/api/auth`)](#1-authentication-endpoints-apiauth)
- [2. Auditorium Endpoints (`/api/auditoriums`)](#2-auditorium-endpoints-apiauditoriums)
- [3. Booking Endpoints (`/api/bookings`)](#3-booking-endpoints-apibookings)
- [4. Payment Endpoints (`/api/payments`)](#4-payment-endpoints-apipayments)
- [5. Notification Endpoints (`/api/notifications`)](#5-notification-endpoints-apinotifications)
- [6. System Health (`/api/health`)](#6-system-health-apihealth)

---

## Global Conventions & Headers

### Request Headers
| Header | Required | Description |
| :--- | :---: | :--- |
| `Content-Type` | Optional* | Must be `application/json` for JSON bodies, or `multipart/form-data` for file uploads. |
| `Authorization` | Conditional | Format: `Bearer <jwt_access_token>`. Required for protected routes if not supplied via HttpOnly cookie. |
| `Idempotency-Key` | Conditional | Unique UUID per request to prevent double execution on mutations (required on `/api/payments/verify`, optional on order creation). |

### Standard Response Envelope
All API responses return a structured JSON envelope:

#### Success (2xx)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

#### Error (4xx, 5xx)
```json
{
  "success": false,
  "message": "Human-readable error description.",
  "errors": [ ... ]
}
```

---

## Rate Limiting Reference

The API protects endpoints using an atomic **Redis Sliding Window Log** via a Lua script. When limits are exceeded, the API responds with **HTTP 429 Too Many Requests**:

```json
{
  "success": false,
  "message": "Too many requests. Try again later.",
  "retryAfter": "45s"
}
```

### Rate Limit Windows
| Route Group | Window | Max Hits | Prefix |
| :--- | :---: | :---: | :--- |
| **Auth General** | 15 min | 60 | `rl:auth:general` |
| **Auth Register** | 15 min | 5 | `rl:auth:register` |
| **Auth Login** | 15 min | 10 | `rl:auth:login` |
| **Auth Password Reset** | 15 min | 5 | `rl:auth:forget-password` |
| **Auth Refresh** | 15 min | 30 | `rl:auth:refresh` |
| **Auditorium Views** | 1 min | 60 | `rl:auditorium:view` |
| **Auditorium Mutations** | 1 min | 10 | `rl:auditorium:mutate` |
| **Booking Creation** | 1 min | 5 | `rl:booking:create` |
| **Booking Cancellation** | 1 min | 10 | `rl:booking:cancel` |
| **Calendar Query** | 1 min | 60 | `rl:booking:calendar` |
| **Payment Orders** | 1 min | 6 | `rl:payment:order` |
| **Payment Verification**| 1 min | 6 | `rl:payment:verify` |
| **Receipt Downloads** | 1 min | 10 | `rl:payment:download` |

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
Register a new student or administrator with institutional email domain validation (`@tmu.ac.in`).

- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Authentication**: None
- **Rate Limit**: 5 requests / 15 minutes

#### Request Body
```json
{
  "name": "Eleanor Vance",
  "email": "eleanor@tmu.ac.in",
  "password": "SecurePassword123!"
}
```
*Note: Any `role` field sent in the request body is intentionally sanitized and ignored. New registrations default to `student`.*

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "6724a89f1092e03d4c8b4567",
    "name": "Eleanor Vance",
    "email": "eleanor@tmu.ac.in",
    "role": "student"
  }
}
```

#### Error Responses
- `400 Bad Request`: Email does not belong to authorized institutional domain (`@tmu.ac.in`).
- `400 Bad Request`: User with this email already exists.
- `400 Bad Request`: Password must be at least 6 characters.

---

### 1.2 Verify Email Address
Verifies a student's institutional email address using a cryptographic token received via email.

- **Method**: `GET`
- **Route**: `/api/auth/verify-email`
- **Authentication**: None
- **Query Parameters**:
  - `token` (string, required): The hex verification token.

#### Example Request
```http
GET /api/auth/verify-email?token=8a3f789e924a...
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

#### Error Responses
- `400 Bad Request`: Missing or invalid verification token.
- `400 Bad Request`: Verification token has expired.

---

### 1.3 Resend Verification Email
Dispatches a fresh verification token to an unverified user's university inbox.

- **Method**: `POST`
- **Route**: `/api/auth/resend-verification`
- **Authentication**: None
- **Rate Limit**: 5 requests / 15 minutes

#### Request Body
```json
{
  "email": "eleanor@tmu.ac.in"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "If the account exists and is unverified, a verification link has been sent."
}
```

---

### 1.4 User Login
Authenticates credentials, returns an in-memory JWT Access Token in the response body, and sets a cryptographically secure HttpOnly Refresh Token cookie.

- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Authentication**: None
- **Rate Limit**: 10 requests / 15 minutes

#### Request Body
```json
{
  "email": "eleanor@tmu.ac.in",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6724a89f1092e03d4c8b4567",
    "name": "Eleanor Vance",
    "email": "eleanor@tmu.ac.in",
    "role": "student"
  }
}
```
**Response Headers**:
```http
Set-Cookie: refreshToken=eyJhbGciOi...; Path=/api/auth/refresh; HttpOnly; SameSite=Lax; Max-Age=604800
```

#### Error Responses
- `400 Bad Request`: Invalid email or password.
- `401 Unauthorized`: Please verify your university email before logging in.

---

### 1.5 Rotate Refresh Token
Exchanges the valid HttpOnly refresh cookie for a newly rotated access token and a fresh refresh token.

- **Method**: `POST`
- **Route**: `/api/auth/refresh`
- **Authentication**: `refreshToken` HttpOnly Cookie
- **Rate Limit**: 30 requests / 15 minutes

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6724a89f1092e03d4c8b4567",
    "name": "Eleanor Vance",
    "email": "eleanor@tmu.ac.in",
    "role": "student"
  }
}
```

#### Error Responses
- `401 Unauthorized`: No refresh token provided in cookies.
- `403 Forbidden`: Token reuse detected or invalid token hash. Revokes entire session family.

---

### 1.6 User Logout
Invalidates the stored refresh token hash in MongoDB and clears the refresh cookie.

- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Authentication**: None (reads cookie if present)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.7 Forgot Password Request
Enqueues a password reset email containing a single-use token valid for 10 minutes.

- **Method**: `POST`
- **Route**: `/api/auth/forget-password`
- **Rate Limit**: 5 requests / 15 minutes

#### Request Body
```json
{
  "email": "eleanor@tmu.ac.in"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "If that email is registered, a password reset link has been dispatched."
}
```

---

### 1.8 Reset Password Execution
Validates the reset token and updates the user's hashed password.

- **Method**: `POST`
- **Route**: `/api/auth/reset-password/:token`
- **Rate Limit**: 5 requests / 15 minutes

#### Request Body
```json
{
  "password": "NewSecurePassword456!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

### 1.9 Get Current User Profile
Retrieves account and role information for the active access token.

- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Authentication**: Required (`protect`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "6724a89f1092e03d4c8b4567",
    "name": "Eleanor Vance",
    "email": "eleanor@tmu.ac.in",
    "role": "student",
    "isVerified": true
  }
}
```

---

## 2. Auditorium Endpoints (`/api/auditoriums`)

### 2.1 View All Auditoriums
Fetches all campus auditoriums with Redis cache-aside acceleration (`TTL: 300s`).

- **Method**: `GET`
- **Route**: `/api/auditoriums/viewAllAuditoriums`
- **Authentication**: Public

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "auditoriums": [
    {
      "_id": "6724b12f1092e03d4c8b9999",
      "name": "Swami Vivekanand Auditorium",
      "capacity": 550,
      "amenities": ["Air Conditioned", "JBL Audio", "4K Laser Projector"],
      "images": [
        "https://res.cloudinary.com/.../auditorium_1.jpg"
      ],
      "basePrice": 2500,
      "description": "Grand campus assembly hall designed for convocations and conferences.",
      "createdAt": "2026-10-31T10:00:00.000Z"
    }
  ]
}
```

---

### 2.2 View Single Auditorium
Retrieves complete details for a specific auditorium ID.

- **Method**: `GET`
- **Route**: `/api/auditoriums/viewAuditorium/:id`
- **Authentication**: Public

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "auditorium": {
    "_id": "6724b12f1092e03d4c8b9999",
    "name": "Swami Vivekanand Auditorium",
    "capacity": 550,
    "amenities": ["Air Conditioned", "JBL Audio", "4K Laser Projector"],
    "images": [ ... ],
    "basePrice": 2500,
    "description": "Grand campus assembly hall..."
  }
}
```

---

### 2.3 Create Auditorium (Admin Only)
Registers a new auditorium and uploads images directly to Cloudinary.

- **Method**: `POST`
- **Route**: `/api/auditoriums/createAuditorium`
- **Authentication**: Required (`admin`, verified)
- **Content-Type**: `multipart/form-data`

#### Form Fields
- `name` (string, required): Hall name
- `capacity` (number, required): Seating capacity (min: 1)
- `basePrice` (number, required): Base tariff in INR per hour
- `description` (string, required, max: 500 chars)
- `amenities` (string, required): Comma-separated list or JSON array
- `images` (files, required): 1 to 5 image files (max 5MB each)

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Auditorium created successfully",
  "auditorium": {
    "_id": "6724b12f1092e03d4c8b9999",
    "name": "Swami Vivekanand Auditorium",
    "capacity": 550,
    "basePrice": 2500,
    "images": ["https://res.cloudinary.com/..."]
  }
}
```

---

### 2.4 Update Auditorium (Admin Only)
Updates venue details and optional new photos. Automatically purges old images from Cloudinary.

- **Method**: `PUT`
- **Route**: `/api/auditoriums/updateAuditorium/:id`
- **Authentication**: Required (`admin`, verified)
- **Content-Type**: `multipart/form-data`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Auditorium updated successfully",
  "auditorium": { ... }
}
```

---

### 2.5 Delete Auditorium (Admin Only)
Deletes an auditorium and cleans up Cloudinary assets. Blocked if there are active reservations.

- **Method**: `DELETE`
- **Route**: `/api/auditoriums/deleteAuditorium/:id`
- **Authentication**: Required (`admin`, verified)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Auditorium deleted successfully"
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot delete auditorium with active bookings"
}
```

---

## 3. Booking Endpoints (`/api/bookings`)

### 3.1 Availability Calendar Query
Returns all approved and confirmed reservations for a given month to power the visual schedule.

- **Method**: `GET`
- **Route**: `/api/bookings/calendar`
- **Authentication**: Public
- **Query Parameters**:
  - `month` (string, required): Format `YYYY-MM` (e.g. `2026-11`)
  - `auditoriumId` (string, optional): Specific auditorium ObjectId

#### Example Request
```http
GET /api/bookings/calendar?month=2026-11&auditoriumId=6724b12f1092e03d4c8b9999
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "bookings": [
    {
      "_id": "6724c9011092e03d4c8b1111",
      "bookingDate": "2026-11-15T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "12:00",
      "status": "confirmed"
    }
  ]
}
```

---

### 3.2 Create Booking Request
Submits a reservation request protected by Redlock distributed locking.

- **Method**: `POST`
- **Route**: `/api/bookings/createBooking`
- **Authentication**: Required (`student`, verified)
- **Rate Limit**: 5 requests / minute

#### Request Body
```json
{
  "auditoriumId": "6724b12f1092e03d4c8b9999",
  "bookingDate": "2026-11-20",
  "startTime": "10:00",
  "endTime": "13:00",
  "purpose": "Annual University Technical Symposium"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Booking request submitted successfully. Awaiting admin review.",
  "booking": {
    "_id": "6724d1011092e03d4c8b2222",
    "user": "6724a89f1092e03d4c8b4567",
    "auditorium": "6724b12f1092e03d4c8b9999",
    "bookingDate": "2026-11-20T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "13:00",
    "purpose": "Annual University Technical Symposium",
    "status": "pending",
    "totalPrice": 7500
  }
}
```

#### Error Responses
- `400 Bad Request`: Start time must be before end time.
- `400 Bad Request`: Cannot book a past time slot.
- `400 Bad Request`: This time slot is already booked.
- `400 Bad Request`: You already have 3 pending booking requests. Please wait for review.
- `409 Conflict`: Another user is currently booking this venue. Please retry.

---

### 3.3 Get Student's Bookings
Retrieves paginated reservations for the authenticated student.

- **Method**: `GET`
- **Route**: `/api/bookings/my-bookings`
- **Authentication**: Required (`student`, verified)
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `status` (string, optional: `pending`, `approved`, `confirmed`, `cancelled`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "6724d1011092e03d4c8b2222",
      "auditorium": {
        "_id": "6724b12f1092e03d4c8b9999",
        "name": "Swami Vivekanand Auditorium",
        "basePrice": 2500
      },
      "bookingDate": "2026-11-20T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "13:00",
      "status": "approved",
      "totalPrice": 7500,
      "paymentDeadline": "2026-11-03T08:00:00.000Z"
    }
  ],
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 20
  }
}
```

---

### 3.4 Cancel Booking Request (Student)
Allows students to cancel their own pending or approved bookings.

- **Method**: `PUT`
- **Route**: `/api/bookings/cancel/:id`
- **Authentication**: Required (`student`, verified)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "6724d1011092e03d4c8b2222",
    "status": "cancelled"
  }
}
```

---

### 3.5 Get All Bookings (Admin Only)
Fetches campus-wide booking requests with search, venue, and status filters.

- **Method**: `GET`
- **Route**: `/api/bookings/all`
- **Authentication**: Required (`admin`, verified)
- **Query Parameters**:
  - `page`, `limit`, `status`, `auditoriumId`

---

### 3.6 Update Booking Status (Admin Approval / Decline)
Sanctions or declines a student booking request. When approved, initiates a **MongoDB Transaction**, creates a Razorpay order, sets a 12-hour payment deadline, and auto-declines conflicting pending requests.

- **Method**: `PUT`
- **Route**: `/api/bookings/status/:id`
- **Authentication**: Required (`admin`, verified)

#### Request Body
```json
{
  "status": "approved"
}
```
*(Acceptable values: `approved`, `cancelled`)*

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Booking approved. Payment email sent to student.",
  "booking": {
    "_id": "6724d1011092e03d4c8b2222",
    "status": "approved",
    "approvedAt": "2026-11-02T20:00:00.000Z",
    "paymentDeadline": "2026-11-03T08:00:00.000Z"
  }
}
```

---

## 4. Payment Endpoints (`/api/payments`)

### 4.1 Create Payment Order
Retrieves or creates a Razorpay order for an approved booking within its 12-hour window.

- **Method**: `POST`
- **Route**: `/api/payments/create-order/:bookingId`
- **Authentication**: Required (`student`, verified)
- **Headers**:
  - `Idempotency-Key` (UUID, optional)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "order": {
    "id": "order_OZp3r78GhsD192",
    "amount": 750000,
    "currency": "INR"
  },
  "key": "rzp_test_..."
}
```

---

### 4.2 Verify Payment & Lock Slot
Validates the cryptographic HMAC-SHA256 signature from Razorpay. Executes an atomic transaction to confirm the reservation, clean up BullMQ expiry jobs, and trigger PDF receipt generation.

- **Method**: `POST`
- **Route**: `/api/payments/verify`
- **Authentication**: Required (`student`, verified)
- **Headers**:
  - `Idempotency-Key` (UUID, required)

#### Request Body
```json
{
  "bookingId": "6724d1011092e03d4c8b2222",
  "razorpay_order_id": "order_OZp3r78GhsD192",
  "razorpay_payment_id": "pay_OZp4m28GhsD999",
  "razorpay_signature": "e5c6a1b2..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Payment successful. Booking confirmed.",
  "booking": {
    "_id": "6724d1011092e03d4c8b2222",
    "status": "confirmed"
  },
  "payment": {
    "gatewayPaymentId": "pay_OZp4m28GhsD999",
    "status": "paid",
    "receipt": "AR-2026-B2222-7812"
  }
}
```

#### Error Responses
- `400 Bad Request`: Invalid payment signature.
- `400 Bad Request`: Payment deadline expired.
- `409 Conflict`: Verification in progress.

---

### 4.3 Get Receipt Metadata / Inline PDF
Returns payment receipt details as structured JSON or streams an inline PDF document.

- **Method**: `GET`
- **Route**: `/api/payments/:bookingId/receipt`
- **Authentication**: Required (Owner student or Admin)
- **Query Parameters**:
  - `format` (optional: `pdf` streams inline PDFKit document)

---

### 4.4 Download Receipt PDF
Downloads the official institutional entry pass and payment voucher PDF.

- **Method**: `GET`
- **Route**: `/api/payments/:bookingId/receipt/download`
- **Authentication**: Required (Owner student or Admin)

#### Response
Streams `application/pdf` with `Content-Disposition: attachment; filename="receipt_AR-2026-....pdf"`.

---

## 5. Notification Endpoints (`/api/notifications`)

All notification endpoints require authentication via `protect`.

### 5.1 Get Notifications Feed
- **Method**: `GET`
- **Route**: `/api/notifications?page=1&limit=20`

### 5.2 Get Unread Count
- **Method**: `GET`
- **Route**: `/api/notifications/unread-count`

### 5.3 Mark Notification Read
- **Method**: `PATCH`
- **Route**: `/api/notifications/:id`

### 5.4 Mark All Notifications Read
- **Method**: `PATCH`
- **Route**: `/api/notifications/read-all`

### 5.5 Delete Notification
- **Method**: `DELETE`
- **Route**: `/api/notifications/:id`

---

## 6. System Health (`/api/health`)

Probe endpoint for load balancers and deployment orchestrators.

- **Method**: `GET`
- **Route**: `/api/health`
- **Authentication**: None

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## 📚 Related Documentation

- 🏛️ **[Architecture Guide](./ARCHITECTURE.md)** — Deep dive into system components, process models, and message flows.
- 🛡️ **[Security Architecture](./SECURITY.md)** — Threat modeling, token lifecycle, and cryptographical validations.
- 📐 **[Design Decisions](./DESIGN-DECISIONS.md)** — Architectural trade-offs, engineering rationales, and alternatives considered.
- 📖 **[Project Readme](../README.md)** — System overview, local quickstart, and deployment instructions.

