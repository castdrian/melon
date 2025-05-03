# Use the official Bun image
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# Install dependencies into temp directory
FROM base AS install
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}
COPY .npmrc package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production
RUN mkdir -p /temp/prod && \
    cd /temp/dev && \
    cp .npmrc package.json bun.lockb /temp/prod/ && \
    cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENTRYPOINT [ "bun", "start" ]
