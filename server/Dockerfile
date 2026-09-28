# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]
