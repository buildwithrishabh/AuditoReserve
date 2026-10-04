# ==========================================
# AuditoReserve Backend Production Dockerfile
# ==========================================
FROM node:20-alpine AS base

# Install curl for container health checks
RUN apk add --no-cache curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy dependency manifests first for optimal layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# Copy application source code
COPY src ./src

# Create logs directory and assign permissions to non-root node user
RUN mkdir -p logs && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose backend server port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "src/server.js"]
