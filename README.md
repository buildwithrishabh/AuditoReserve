# AudiReserve - Auditorium Booking System

AudiReserve is a modern, high-performance, full-stack web application designed for educational institutions to streamline auditorium reservations. It features role-based workflows, real-time availability checking, secure payment processing, resilient caching, and automated background tasks.

---

## 🚀 Key Features

### 👤 Student Features
- **Interactive Availability Calendar**: A month-view calendar indicating current bookings and daily timetables for checking slot availability.
- **Booking Requests**: Seamless submission of booking requests with validation to prevent overlapping or double-bookings.
- **Secure Payment Checkout**: Integrated with the **Razorpay Payment Gateway** for fast, secure checkouts on approved bookings.
- **Calendar Sync**: One-click actions to add confirmed bookings to **Google Calendar** or download a standard **`.ics`** file.
- **Real-Time In-App Alert Center**: Direct WebSocket push alerts on booking status updates (Pending, Approved, Confirmed, Cancelled).

### 🔑 Admin Features
- **Auditorium Management (CRUD)**: Create, view, edit, and delete venue catalogs, complete with image uploads hosted on **Cloudinary**.
- **Booking Decisions**: Review booking requests to either Approve (starts a 12-hour payment window) or Cancel them.
- **Dashboard Analytics**: High-level metrics tracking overall system utilization, total earnings, and booking trends.

### ⚙️ System Architecture & Reliability
- **Resilient Redis Cache-Aside**: High-speed caching for auditorium listings with a 5-minute TTL. Includes automatic cache invalidation on database updates and a fail-safe fallback to MongoDB if Redis goes offline.
- **Asynchronous BullMQ Workers**:
  - `email-queue`: Handles transactional emails (verification, approvals, receipts, cancellations) out of the main request-response cycle.
  - `booking-expiry`: Coordinates a 12-hour delayed worker to automatically expire and cancel approved bookings if unpaid.
- **Graceful Shutdowns**: Workers capture `SIGINT`/`SIGTERM` to safely finish active tasks before shutting down.
- **Multi-Device WebSocket Tracking**: Tracks and pushes Socket.io notifications to all active tabs/devices for a user, cleaning up connection references upon logout/disconnect.

### 🛡️ Security Features
- **University Email Restriction**: Restricts registration to a specified domain (e.g., `tmu.ac.in`) set via environment variables.
- **HTTP-Only JWT Cookies**: Protects access and refresh tokens against Cross-Site Scripting (XSS).
- **Socket.io Authentication**: Uses middleware to parse cookies and authorize WebSocket connection handshakes.
- **Brute-Force Protection**: Employs `express-rate-limit` to restrict abuse on sensitive `/api/auth` routes.
- **Secure Headers**: Utilizes `helmet` to establish secure HTTP policies.

---

## 🛠️ Tech Stack

### Backend
- **Core**: Node.js, Express.js
- **Database & Caching**: MongoDB (Mongoose), Redis (ioredis)
- **Queues & Real-time**: BullMQ, Socket.io
- **Integrations**: Razorpay Node SDK, Nodemailer, Cloudinary & Multer

### Frontend
- **Core**: React 19, TypeScript, Vite
- **Styling & Animations**: Tailwind CSS v4, Framer Motion
- **State & Validation**: TanStack React Query, React Router Dom v7, React Hook Form + Zod

---

## 📁 Directory Structure

```
Auditorium Booking System/
├── backend/          # Express API server, BullMQ workers, & socket registry
└── frontend/         # React SPA client with React Query & Tailwind
```

---

## ⚙️ Environment Configuration

Set up `.env` files in both the `backend/` and `frontend/` folders based on their respective `.env.example` templates:

### Backend Key Configurations
- **Database**: `MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Authentication**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `UNIVERSITY_DOMAIN`
- **Mail & Storage**: `SMTP_HOST`, `SMTP_PORT`, `BREVO_API_KEY`, `FROM_EMAIL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Gateway**: `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET_KEY`

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- Local or Cloud MongoDB & Redis instances

### Setup and Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/buildwithrishabh/AuditoReserve.git
   cd "Auditorium Booking System"
   ```

2. **Run Backend**:
   ```bash
   cd backend
   npm install
   # Create .env and configure
   npm run dev
   ```

3. **Run Frontend**:
   ```bash
   cd ../frontend
   npm install
   # Create .env and configure
   npm run dev
   ```

- **Frontend client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 📄 License & Contributors

- Distributed under the **ISC License**.
- Developed by **Rishabh Kumar** ([@buildwithrishabh](https://github.com/buildwithrishabh))
