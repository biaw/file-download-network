FROM node:18-alpine@sha256:c28ababa721163f8ac5b2b12c14604722ddea3f95de9cf9ae354a52a3e23458e AS base

WORKDIR /app
ENV IS_DOCKER=true


# install prod dependencies

FROM base AS deps
RUN npm i -g pnpm@8

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json .npmrc ./
RUN pnpm install --frozen-lockfile --prod --offline


# install all dependencies and build everything

FROM deps AS ts-builder
RUN pnpm install --frozen-lockfile --offline

COPY tsconfig.json ./
COPY ./src ./src
COPY *.config.* ./
RUN pnpm run build


# production image

FROM base
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json .env* ./
COPY --from=ts-builder /app/build ./build

ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]
