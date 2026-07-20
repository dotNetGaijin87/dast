# Shared base with pnpm + openssl (Prisma needs openssl at build and runtime).
FROM node:22-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# Build: install the workspace, build the shared package, generate Prisma client.
FROM base AS build
COPY . .
# If a local TLS-inspection CA is provided (certs/), trust it so registry fetches
# verify inside the container. Harmless/no-op when the file is absent.
ENV NODE_EXTRA_CA_CERTS=/app/certs/corp-ca.crt
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dast/shared build
RUN pnpm --filter @dast/backend exec prisma generate

# Runtime image (same image serves both the API and the worker via different CMDs).
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
# Trust the local TLS-inspection CA and bake pnpm into the image so container
# startup needs no network for the package manager.
ENV NODE_EXTRA_CA_CERTS=/app/certs/corp-ca.crt
RUN corepack prepare pnpm@9.15.0 --activate
WORKDIR /app/packages/backend
EXPOSE 4000
CMD ["pnpm", "start:api"]
