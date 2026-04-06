FROM oven/bun:1.2.21-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build

FROM oven/bun:1.2.21-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CONTAINERIZED=1

COPY --from=build /app/dist ./dist
COPY server.ts ./server.ts

USER bun
EXPOSE 3000

CMD ["bun", "run", "server.ts"]
