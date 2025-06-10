# ---------- Build stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the files
COPY . .

# Build Next.js app
RUN npm run build

# ---------- Production stage ----------
FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed for production
COPY package.json package-lock.json ./

# ✅ Install dependencies as root (default user)
RUN npm ci --omit=dev && npm cache clean --force

# ✅ Copy built app from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules

# ✅ Change ownership after everything is in place
RUN chown -R nextjs:nodejs /app

# ✅ Switch to non-root user only after setup
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
