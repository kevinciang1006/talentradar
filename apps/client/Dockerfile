# TalentRadar Frontend Dockerfile (Turborepo Optimized)
# Multi-stage build using turbo prune for minimal image size

# ============================================
# Stage 1: Pruner - Extract only what's needed
# ============================================
FROM node:20-alpine AS pruner

WORKDIR /app

# Install turbo globally
RUN npm install -g turbo@^2.8.12

# Copy entire monorepo
COPY . .

# Prune the monorepo to only include client and its dependencies
RUN turbo prune talentradar_client --docker

# ============================================
# Stage 2: Builder - Install deps and build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .

# Install dependencies
RUN npm install

# Copy source code from pruner
COPY --from=pruner /app/out/full/ .

# Build the client application using Turborepo
RUN npm run build --filter=talentradar_client

# ============================================
# Stage 3: Production with Nginx
# ============================================
FROM nginx:alpine AS runner

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy custom nginx config
COPY --from=pruner /app/apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run standard)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx with dumb-init
CMD ["dumb-init", "nginx", "-g", "daemon off;"]
