# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Optional: use custom registry if available
# The build should not fail when `.npmrc` is missing, so we skip copying
# it by default. Uncomment if a registry file is provided.
# COPY .npmrc ./

# Install deps and build
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

### 🚀 Stage 2: Serve static files
FROM node:18-alpine

WORKDIR /app

# Optional: same registry config (uncomment if `.npmrc` is present)
# COPY .npmrc ./

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
