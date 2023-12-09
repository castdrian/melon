# use the official Bun image
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# copy node_modules from temp directory
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules

# copy all (non-ignored) project files into the image
COPY . .

# run the app
USER bun
ENTRYPOINT [ "bun", "start" ]
