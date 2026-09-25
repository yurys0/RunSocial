FROM node:22-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_MAXSOCKETS=1
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend --include-workspace-root
COPY frontend frontend/
ARG VITE_API_URL
ARG VITE_YANDEX_MAPS_API_KEY
RUN printf 'VITE_API_URL=%s\nVITE_YANDEX_MAPS_API_KEY=%s\n' \
      "$VITE_API_URL" "$VITE_YANDEX_MAPS_API_KEY" > .env.production \
    && npm run build --workspace frontend

FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
