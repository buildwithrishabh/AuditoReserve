# AudiToReserve - Auditorium Booking System

A full-stack web application for booking university auditoriums with role-based access, real-time availability checking, and automated email notifications.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)

---

## About the Project

AudiToReserve is a comprehensive auditorium booking platform designed for educational institutions. It allows students to browse and book auditoriums for events, while administrators manage venues and approve bookings.

### Workflow

1. **Student** registers with university email → verifies email → browses auditoriums → selects date/time → submits booking request
2. **Admin** reviews pending bookings → approves/confirms or rejects → student gets notified via email
3. **Booking** has status: `pending` → `confirmed` / `cancelled`

---

## Features

### Authentication System
- JWT-based authentication (Access + Refresh tokens)
- Email verification on registration
- Forgot password / Reset password flow
- Rate limiting on auth endpoints (prevents brute force)
- University domain restriction (configurable)

### Role-Based Access
| Role | Permissions |
|------|-------------|
| **Student** | Browse auditoriums, create bookings, view own bookings, cancel bookings |
| **Admin** | All student permissions + Manage auditoriums (CRUD), view all bookings, approve/reject bookings |

### Core Features
- **Auditorium Management**: Create, update, delete venues with capacity, amenities, pricing, and images
- **Booking System**: Time-slot based booking with conflict detection
- **Image Upload**: Cloudinary integration for auditorium photos
- **Email Notifications**: Nodemailer for verification, booking confirmations, password resets
- **Search & Filter**: Filter auditoriums by capacity, amenities, price range

### Caching Strategy (Redis)
Fast data access with a **cache-aside** pattern backed by Redis:

| Strategy | Detail |
|----------|--------|
| **Pattern** | Lazy loading — check Redis first, fall back to MongoDB on miss, then populate cache |
| **TTL** | 300 seconds (5 min) for auditorium list & detail caches |
| **Invalidation** | Cache cleared on create / update / delete via key patterns (`auditoriums:*`) |
| **Resilience** | Automatic fallback to MongoDB if Redis is unreachable (no crash) |
| **Library** | `ioredis` with auto-reconnection & retry backoff |

```
GET /auditoriums  →  Redis hit?  →  return cached JSON
                   →  Redis miss? →  query MongoDB →  store in Redis (TTL: 300s) →  return
PUT /auditoriums   →  update DB   →  delete Redis keys
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Database + ODM |
| **JWT (jsonwebtoken)** | Authentication |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Email service |
| **Cloudinary** | Image storage & CDN |
| **Multer** | File upload handling |
| **Helmet** | Security headers |
| **CORS** | Cross-origin resource sharing |
| **express-rate-limit** | Rate limiting |
| **ioredis + Redis** | Caching layer (auditorium listings, cache-aside pattern) |
| **morgan** | HTTP request logging |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Library |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router DOM v7** | Client-side routing |
| **TanStack React Query** | Server state management, caching |
| **React Hook Form** | Form management |
| **Zod** | Schema validation |
| **Tailwind CSS v4** | Utility-first CSS |
| **Framer Motion** | Animations |
| **Lucide React** | Icons |
| **Axios** | HTTP client |
| **date-fns** | Date manipulation |

### Security Features Implemented
- Password hashing with bcrypt
- HTTP-only cookies for refresh tokens
- Helmet security headers
- CORS configuration
- Rate limiting on sensitive endpoints
- Input validation
- Protected routes + role-based authorization middleware

---

## Project Structure

```
Auditorium Booking System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   ├── cloudinary.js      # Cloudinary config
│   │   │   └── redis.js           # Redis client connection
│   │   ├── controllers/
│   │   │   ├── authController.js  # Register, login, verify email, reset password
│   │   │   ├── auditoriumController.js
│   │   │   └── bookingController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js  # protect, authorizeRole, isverified
│   │   │   └── uploadMiddleware.js # Multer + Cloudinary
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Auditorium.js
│   │   │   └── Booking.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── auditoriumRoutes.js
│   │   │   └── bookingRoutes.js
│   │   ├── service/
│   │   │   └── email.js           # Nodemailer transporter
│   │   ├── utils/
│   │   │   ├── cache.js           # Redis cache helpers (getOrSetCache, invalidation)
│   │   │   ├── EmailOptions.js    # Email templates
│   │   │   └── jwt.js             # Token helpers
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # Server entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.ts          # Axios instance
    │   │   ├── auth.ts
    │   │   ├── auditoriums.ts
    │   │   └── bookings.ts
    │   ├── components/
    │   │   ├── auditoriums/
    │   │   ├── auth/
    │   │   ├── bookings/
    │   │   ├── common/
    │   │   └── layout/
    │   ├── hooks/
    │   │   ├── useAuth.tsx
    │   │   ├── useToast.ts
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
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas URI)
- Redis (local via `choco install redis` / `brew install redis`, or cloud: Redis Labs / Upstash)
- Cloudinary account (for image uploads)
- Email service (Gmail with App Password, or any SMTP)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/buildwithrishabh/AuditoReserve.git
cd "Auditorium Booking System"
```

2. **Backend Setup**
```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure variables:
```bash
cp .env.example .env
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

4. **Run the application**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The app will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/audibook` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `REDIS_HOST` | Redis server host | `localhost` or `redis-xxxx.upstash.io` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | `your-redis-password` |
| `UNIVERSITY_DOMAIN` | Restrict email registrations | `tmu.ac.in` |
| `JWT_ACCESS_SECRET` | Access token secret | `your-random-secret-key` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `another-random-secret` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email password/app-password | `xxxx xxxx xxxx xxxx` |
| `FROM_EMAIL` | Sender email | `your-email@gmail.com` |
| `FROM_NAME` | Sender name | `AudiBook System` |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API endpoint | `http://localhost:5000/api` |
| `VITE_UNIVERSITY_DOMAIN` | University domain for validation | `tmu.ac.in` |

---

## API Endpoints

### Base URL: `/api`

### Auth Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | ❌ Public |
| GET | `/verify-email?token=...` | Verify email address | ❌ Public |
| POST | `/login` | Login user | ❌ Public |
| POST | `/refresh` | Refresh access token | ❌ Refresh token in cookie |
| POST | `/logout` | Logout user | ✅ Authenticated |
| POST | `/forget-password` | Send reset password email | ❌ Public |
| POST | `/reset-password/:token` | Reset password with token | ❌ Public |
| GET | `/me` | Get current user profile | ✅ Authenticated |

### Auditorium Endpoints (`/api/auditoriums`)
| Method | Endpoint | Description | Auth/Role |
|--------|----------|-------------|-----------|
| GET | `/viewAllAuditoriums` | Get all auditoriums | ❌ Public |
| GET | `/viewAuditorium/:id` | Get single auditorium | ❌ Public |
| POST | `/createAuditorium` | Create new auditorium | ✅ Admin + Verified |
| PUT | `/updateAuditorium/:id` | Update auditorium | ✅ Admin + Verified |
| DELETE | `/deleteAuditorium/:id` | Delete auditorium | ✅ Admin + Verified |

### Booking Endpoints (`/api/bookings`)
| Method | Endpoint | Description | Auth/Role |
|--------|----------|-------------|-----------|
| POST | `/createBooking` | Create new booking | ✅ Student + Verified |
| GET | `/my-bookings` | Get logged-in user's bookings | ✅ Student + Verified |
| PUT | `/cancel/:id` | Cancel booking | ✅ Student + Verified |
| GET | `/all` | Get all bookings | ✅ Admin + Verified |
| PUT | `/status/:id` | Update booking status | ✅ Admin + Verified |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint |

---

## Data Models

### User
```javascript
{
  name: String,              // required
  email: String,             // required, unique
  password: String,          // required, min 6 chars (hashed)
  role: String,              // enum: ['student', 'admin'], default: 'student'
  isVerified: Boolean,       // default: false
  refreshToken: String,
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: Date
}
```

### Auditorium
```javascript
{
  name: String,              // required
  capacity: Number,          // required
  amenities: [String],       // e.g., ["Projector", "WiFi", "AC"]
  images: [String],          // Cloudinary URLs
  basePrice: Number,         // required (hourly rate)
  description: String,       // required
  timestamps (createdAt, updatedAt)
}
```

### Booking
```javascript
{
  user: ObjectId,            // ref: User
  auditorium: ObjectId,      // ref: Auditorium
  bookingDate: Date,         // required
  startTime: String,         // required (e.g., "09:00")
  endTime: String,           // required (e.g., "11:00")
  purpose: String,           // required
  status: String,            // enum: ['pending', 'confirmed', 'cancelled'], default: 'pending'
  totalPrice: Number,        // required
  paymentId: String,         // for future payment integration
  timestamps (createdAt, updatedAt)
}
```

**Index:** `{ auditorium: 1, bookingDate: 1 }` for fast availability queries
---

## License

ISC License

---

## Contributors

- [@buildwithrishabh](https://github.com/buildwithrishabh)
