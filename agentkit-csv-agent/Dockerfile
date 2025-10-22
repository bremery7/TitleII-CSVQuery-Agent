FROM node:20-slim

# Install build dependencies for native modules and required libraries
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

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
