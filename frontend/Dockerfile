# ==========================================
# AuditoReserve Frontend Multi-Stage Dockerfile
# ==========================================

# Stage 1: Build production React assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for Vite build)
RUN npm ci || npm install

# Copy source code
COPY . .

# Build arguments for Vite client environment
ARG VITE_API_BASE_URL=/api
ARG VITE_SOCKET_URL=
ARG VITE_RAZORPAY_KEY_ID=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Build static bundle
RUN npm run build

# Stage 2: Serve with lightweight Nginx web server
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
