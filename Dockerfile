FROM node:18-alpine@sha256:5859ed3030002488a7732b50f4266c4e4fd2b8bf42d006eacad08c1c0b7471ac AS base

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
