# Build context: repository ROOT (the pnpm workspace needs packages/).
# docker compose builds this with: context: ., dockerfile: apps/web/Dockerfile
FROM node:26-alpine AS build
WORKDIR /repo
RUN npm install -g pnpm@10
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web/package.json apps/web/
COPY site/package.json site/

# Build-time public env (baked into the client bundle as defaults).
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:7001
ARG NEXT_PUBLIC_HLS_BASE_URL=http://localhost:8888
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_HLS_BASE_URL=$NEXT_PUBLIC_HLS_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm install --filter @adda/web... --no-frozen-lockfile
COPY apps/web ./apps/web
RUN pnpm --filter @adda/web build

# Next standalone output — tiny Node server.
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5173 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
EXPOSE 5173
CMD ["node", "apps/web/server.js"]
