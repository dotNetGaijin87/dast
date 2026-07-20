# Build the SPA (shared package first so its types/dist resolve).
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
# Trust a local TLS-inspection CA (certs/) if present; verification stays enabled.
ENV NODE_EXTRA_CA_CERTS=/app/certs/corp-ca.crt
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dast/shared build
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter @dast/frontend build

# Serve static assets with nginx (SPA history fallback).
FROM nginx:1.27-alpine AS runtime
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 80
