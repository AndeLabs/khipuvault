# API Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json ./

# Copy all packages and apps
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @khipu/database db:generate

# Build
RUN pnpm --filter @khipu/api build

EXPOSE 3001

CMD ["pnpm", "--filter", "@khipu/api", "start"]
