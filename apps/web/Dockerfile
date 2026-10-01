# Build context: repository ROOT (the pnpm workspace needs packages/).
# docker compose builds this with: context: ., dockerfile: apps/web/Dockerfile
FROM node:26-alpine AS build
WORKDIR /repo
RUN npm install -g pnpm@10
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web/package.json apps/web/
COPY site/package.json site/
RUN pnpm install --filter @adda/web... --no-frozen-lockfile
COPY apps/web ./apps/web
RUN pnpm --filter @adda/web build

FROM node:26-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /repo/apps/web/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
