# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Copy Excel files for seeding
COPY docs/export ./docs/export

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# Copy built application from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/docs/export ./docs/export
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script and fix line endings (Windows CRLF -> Unix LF)
COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Use entrypoint script (runs migrations, NOT seed!)
ENTRYPOINT ["docker-entrypoint.sh"]
