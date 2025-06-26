FROM node:22-alpine AS builder
WORKDIR /app
# Copy frontend dependency manifests
COPY apps/frontend/package*.json ./apps/frontend/
WORKDIR /app/apps/frontend
RUN npm install
# Copy the rest of the frontend source
COPY apps/frontend/ ./
RUN npm run build

FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]