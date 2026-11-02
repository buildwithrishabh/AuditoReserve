# 🏛️ AuditoReserve — System Architecture & Technical Design

The authoritative architecture documentation has moved to:

👉 **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

Please consult that document for the complete technical specifications, including:
- High-level multi-process architecture diagrams
- Decoupled API Gateway (`server.js`) & BullMQ Worker Tier (`worker.js`)
- Redis multi-role topology (Distributed locking, sliding-window rate limiting, BullMQ queues, Socket.IO adapter)
- End-to-end sequence diagrams (Booking review, payment confirmation, auto-expiry lifecycle)
- Database schema and compound index optimization
- Zero-disk streaming PDF pipeline and Cloudinary CDN synchronization
- Graceful shutdown and fault recovery
