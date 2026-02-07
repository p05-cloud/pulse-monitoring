# Dockerfile for PULSE API
# Optimized for Render.com deployment

FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
FROM base AS dependencies
RUN npm ci --workspace=apps/api --workspace=packages/shared

# Build stage
FROM dependencies AS build
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    postgresql-client \
    openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies only
RUN npm ci --workspace=apps/api --workspace=packages/shared --omit=dev

# Copy built files from build stage
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages/shared ./packages/shared

# Copy necessary scripts
COPY --from=build /app/apps/api/scripts ./apps/api/scripts
COPY --from=build /app/apps/api/start.sh ./apps/api/start.sh

# Set working directory to API
WORKDIR /app/apps/api

# Regenerate Prisma client in production node_modules
RUN npx prisma generate

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["sh", "start.sh"]
