# TalentRadar Backend Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create uploads directory for temporary file storage
# Note: For production, use Cloudinary instead
RUN mkdir -p /app/uploads/deals && \
    chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose port (Railway/Render/GCP Cloud Run detect this)
EXPOSE 5000

# Health check
# Runs every 30 seconds, 10 second timeout, 40 second start period, 3 retries
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/index.js"]
