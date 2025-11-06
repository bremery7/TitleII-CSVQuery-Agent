FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
# Build args that can be overridden
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:3001

# Set as environment variables for build
ENV NEXTAUTH_SECRET=build-time-secret-will-be-replaced
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create data directory for user database
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Create a writable directory for .env.local
RUN touch /app/.env.local && chown nextjs:nodejs /app/.env.local

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create a startup script to write environment variables to .env.local
CMD sh -c 'echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" > /app/.env.local && \
    echo "AUTH_SECRET=$AUTH_SECRET" >> /app/.env.local && \
    echo "SESSION_SECRET=$SESSION_SECRET" >> /app/.env.local && \
    echo "JWT_SECRET=$JWT_SECRET" >> /app/.env.local && \
    echo "NEXTAUTH_URL=$NEXTAUTH_URL" >> /app/.env.local && \
    echo "NEXTAUTH_URL_INTERNAL=$NEXTAUTH_URL_INTERNAL" >> /app/.env.local && \
    echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" >> /app/.env.local && \
    node server.js'
