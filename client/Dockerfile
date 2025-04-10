FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies with legacy peer deps flag to handle React 19 compatibility
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build application with standalone output
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy public directory for static assets
COPY --from=builder /app/public ./public

# Copy built standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Use non-root user
USER nextjs

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=5s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Run the Next.js server
CMD ["node", "server.js"]
