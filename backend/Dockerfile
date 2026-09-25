FROM node:22-alpine AS build
WORKDIR /app
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
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/backend/dist backend/dist
COPY backend/prisma backend/prisma
WORKDIR /app/backend
CMD ["node", "dist/main.js"]
