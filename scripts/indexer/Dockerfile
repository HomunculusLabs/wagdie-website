FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for ts-node)
RUN npm ci

# Install tsx for TypeScript execution
RUN npm install -g tsx

# Copy indexer scripts
COPY scripts/indexer ./scripts/indexer

# Copy discord scripts for outbox module
COPY scripts/discord ./scripts/discord

# Copy lib directory for shared modules (contracts, services, etc.)
COPY lib ./lib

# Copy tsconfig for compilation
COPY tsconfig.json ./

# Create state directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV STATE_FILE=/app/data/state.json

CMD ["tsx", "scripts/indexer/transfer-indexer.ts"]
