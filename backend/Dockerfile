# ---------------------------------------------------
# Stage: Base Image
# ---------------------------------------------------
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure logs directory exists and set ownership to unprivileged node user
RUN mkdir -p logs && chown -R node:node /app

# Run as non-root user for security
USER node

# Expose default port (Render will inject PORT at runtime)
EXPOSE 5000

# Default command to run the backend API
CMD ["npm", "start"]

