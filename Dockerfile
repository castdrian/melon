# Base layer
FROM oven-sh/bun:latest as base
WORKDIR /home/bun/app

# Production layer
FROM base as production

ENV NODE_ENV=production
COPY bun.lockb package.json ./
RUN bun install --prod --frozen-lockfile

CMD ["bun", "start"]
