# Use Node 18 Alpine base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy all frontend files
COPY . .

# Build React/Vite frontend
RUN npm run build

# Use serve to serve production build
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the frontend server
CMD ["serve", "-s", "build", "-l", "3000"]
