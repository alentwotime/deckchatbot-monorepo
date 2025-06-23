# syntax=docker/dockerfile:1

### 🧱 Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Optional: copy .npmrc to lock registry and avoid hanging installs
COPY .npmrc ./

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app code and build it
COPY . .
RUN npm run build

---

### 🚀 Stage 2: Serve the built static files
FROM node:18-alpine

WORKDIR /app

# Optional: use the same registry in runtime
COPY .npmrc ./

# Install static server
RUN npm install -g serve

# Copy the built assets from previous stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
