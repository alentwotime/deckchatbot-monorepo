# syntax=docker/dockerfile:1

### 🧱 Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Optional: copy .npmrc if using a locked registry
COPY .npmrc ./

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

### 🚀 Stage 2: Serve the built static files
FROM node:18-alpine

WORKDIR /app

COPY .npmrc ./
RUN npm install -g serve

# Copy build output
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
