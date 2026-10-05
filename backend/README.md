# 🏛️ AuditoReserve — Backend API & Worker Engine

Production-grade Node.js/Express REST API and WebSocket engine powering the AuditoReserve Auditorium Booking System.

---

## 🛠️ Tech Stack & Backing Services

- **Runtime & Framework:** Node.js 20, Express 4
- **Database:** MongoDB 7 with Mongoose ODM (Connection Pooling & Transactions)
- **Cache & Message Broker:** Redis 7 with BullMQ (Asynchronous worker queues & rate limiting)
- **Real-Time:** Socket.IO 4.8 with Redis Adapter
- **Storage & Documents:** Cloudinary & PDFKit (Receipt generation)
- **Payments:** Razorpay Node SDK

---

## 🐳 Running with Docker Compose (Recommended)

The backend includes a self-contained [docker-compose.yml](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/docker-compose.yml) that automatically spins up MongoDB 7, Redis 7, and the Backend API in isolated network containers with persistent volumes.

### 1. Prerequisites
- Docker & Docker Compose installed and running (e.g., Docker Desktop).

### 2. Environment Setup
Make sure you have your [backend/.env](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/.env) file populated with credentials (Cloudinary, Razorpay, Brevo SMTP, JWT secrets). 
> Docker Compose will automatically map MongoDB and Redis internal hostnames while using your other secrets from `.env`.

### 3. Build & Run
From inside the `backend/` directory:

```bash
# Build image and start all containers in detached mode
docker compose up -d --build

# View container status and health check results
docker compose ps

# View live output and logs
docker compose logs -f backend

# Stop all containers and network
docker compose down
```

### 4. Health Check
Once running, verify backend readiness:
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{"success": true, "message": "Server is running"}
```

---

## ⚡ Manual Local Setup (Without Docker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Ensure local MongoDB and Redis instances are running on your machine:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auditoreserve
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:5173
```

### 3. Start Development Server
```bash
# Start with nodemon auto-restart
npm run dev

# Or start in standard production mode
npm start
```

---

## 📂 File Overview

- [Dockerfile](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/Dockerfile) — Multi-stage Alpine container build with non-root security user.
- [docker-compose.yml](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/docker-compose.yml) — Service orchestration for MongoDB, Redis, and Backend API.
- [.dockerignore](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/.dockerignore) — Excludes `node_modules`, logs, and sensitive files from Docker builds.
- [src/server.js](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/src/server.js) — Application entrypoint and Socket.IO bootstrap.
- [src/app.js](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/backend/src/app.js) — Express route mounting, rate limiting, and global error handling.
