# Multi-stage build for production - Optimized for Fly.io deployment

# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with clean install
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Ensure scripts directory exists
RUN mkdir -p scripts

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install production dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Copy migration scripts
COPY --from=builder /app/scripts ./scripts

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port 8080 (Fly.io default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
# Note: Migrations are handled by release_command in fly.toml
# This ensures app starts even if migrations were already applied
CMD node dist/main
