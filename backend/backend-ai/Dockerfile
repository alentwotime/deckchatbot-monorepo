# syntax=docker/dockerfile:1

### 🧱 Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Optional: use custom registry
COPY .npmrc ./  # ✅ only if needed

# Install deps and build
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

### 🚀 Stage 2: Serve static files
FROM node:18-alpine

WORKDIR /app

# Optional: same registry config (optional)
COPY .npmrc ./  # ✅ only if needed

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
