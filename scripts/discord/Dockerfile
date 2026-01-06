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

# Copy discord notifier scripts
COPY scripts/discord ./scripts/discord

# Copy lib utilities needed by notifier
COPY lib/contracts/chains.ts ./lib/contracts/chains.ts
COPY lib/utils/image.ts ./lib/utils/image.ts

# Copy tsconfig for compilation
COPY tsconfig.json ./

ENV NODE_ENV=production

# Health check to ensure the process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f "notifier.ts" || exit 1

CMD ["tsx", "scripts/discord/notifier.ts"]
