# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Runtime deps only — the custom server (server.mjs) can't use standalone
# output, so the runner ships real node_modules. Keeping `dependencies` down
# to what server.mjs + Next need at runtime (client/build packages live in
# devDependencies — Next bundles them into .next) is what keeps this small.
FROM oven/bun:1.3.14-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
# --omit=optional drops next's optional native binaries (@next/swc-* is
# build/dev-only, sharp/@img is next/image optimization — unused here).
RUN bun install --frozen-lockfile --production --omit=optional

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Drop the build cache here, not in the runner — files deleted in a later
# layer still ship with the COPY layer that added them.
RUN node node_modules/next/dist/bin/next build && rm -rf .next/cache

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs package.json next.config.mjs server.mjs ./
COPY --chown=nextjs:nodejs server ./server

USER nextjs
EXPOSE 3000

CMD ["node", "server.mjs"]
