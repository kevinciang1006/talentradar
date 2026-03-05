# TalentRadar Frontend Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# ============================================
# Stage 2: Production with Nginx
# ============================================
FROM nginx:alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run standard)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx with dumb-init
CMD ["dumb-init", "nginx", "-g", "daemon off;"]
