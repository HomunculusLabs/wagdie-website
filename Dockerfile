FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build args for NEXT_PUBLIC_ vars (inlined at build time)
ARG NEXT_PUBLIC_SUPABASE_URL=https://wagdie-api.runiverse.ai
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
# Server-side vars (set at runtime via docker-compose)
ENV SUPABASE_URL=http://placeholder.local
ENV SUPABASE_ANON_KEY=placeholder-key
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/lib/utils/server-browser-globals.js ./lib/utils/server-browser-globals.js
COPY --from=build /app/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "start"]