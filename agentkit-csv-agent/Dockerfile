FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for ts-node and TypeScript)
RUN npm ci

# Copy application code
COPY . .

# Create data directory for CSV files
RUN mkdir -p /app/data

# Expose backend port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
