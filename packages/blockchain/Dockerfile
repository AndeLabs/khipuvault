# Blockchain Indexer Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json ./

# Copy packages
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @khipu/database db:generate

# Build blockchain package
RUN pnpm --filter @khipu/blockchain build

EXPOSE 8080

CMD ["pnpm", "--filter", "@khipu/blockchain", "start"]
