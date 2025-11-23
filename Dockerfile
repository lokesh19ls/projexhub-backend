# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy schema.sql for migrations from builder stage
COPY --from=builder /app/src/database/schema.sql ./dist/database/schema.sql

# Copy migration scripts
COPY --from=builder /app/src/database/update-phone-to-optional.js ./dist/database/update-phone-to-optional.js
COPY --from=builder /app/src/database/migrations/add-fcm-token-column.js ./dist/database/migrations/add-fcm-token-column.js
COPY --from=builder /app/src/database/migrations/add-dispute-description-column.js ./dist/database/migrations/add-dispute-description-column.js

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]

