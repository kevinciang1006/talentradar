# TalentRadar Backend Dockerfile (Turborepo Optimized)
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

# Prune the monorepo to only include server and its dependencies
# This creates /app/out/json (package.jsons) and /app/out/full (source code)
RUN turbo prune talentradar_server --docker

# ============================================
# Stage 2: Builder - Install deps and build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .

# Install dependencies from pruned lockfile
RUN npm install

# Copy source code from pruner
COPY --from=pruner /app/out/full/ .

# Build the server application using Turborepo
RUN npm run build --filter=talentradar_server

# ============================================
# Stage 3: Production - Minimal runtime image
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package.json files for production install
COPY --from=pruner --chown=nodejs:nodejs /app/out/json/ .

# Install only production dependencies
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/dist ./apps/server/dist

# Create uploads directory (for local storage fallback)
RUN mkdir -p /app/uploads/deals && \
    chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set working directory to server app
WORKDIR /app/apps/server

# Start application with dumb-init
CMD ["dumb-init", "node", "dist/index.js"]
