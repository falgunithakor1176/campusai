# ============================================================
# CampusAI Server – Dockerfile
# Multi-stage build for production optimization
# ============================================================

# ─── Stage 1: Dependencies ───────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# ─── Stage 2: Production Image ───────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 campusai

# Copy dependencies and Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads/documents uploads/images logs && \
    chown -R campusai:nodejs /app

# Switch to non-root user
USER campusai

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start command (runs migrations then server)
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
