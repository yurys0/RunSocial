FROM node:22-alpine AS build
WORKDIR /app
# npm по умолчанию слишком быстро сдаётся на нестабильной сети
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=60000 \
    NPM_CONFIG_MAXSOCKETS=1
COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --workspace backend --include-workspace-root
COPY backend backend/
# Без сгенерированного клиента Prisma рантайм падает на первом запросе
RUN npm run db:generate --workspace backend
RUN npm run build --workspace backend

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=60000 \
    NPM_CONFIG_MAXSOCKETS=1
COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --workspace backend --include-workspace-root --omit=dev
# Клиент переносим из build-стадии: здесь схемы при установке ещё нет
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/backend/dist backend/dist
# Схема и миграции нужны контейнеру migrate
COPY backend/prisma backend/prisma
WORKDIR /app/backend
# CMD переопределяется в docker-compose: dist/main.js для api, dist/worker.js для воркера
CMD ["node", "dist/main.js"]
