FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY backend/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY backend/ ./

# Expose server port
EXPOSE 5002

ENV NODE_ENV=production
ENV PORT=5002

# Start server
CMD ["node", "src/server.js"]
