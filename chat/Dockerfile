# chat/Dockerfile
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
EXPOSE 3000

# Start command
CMD ["npm", "start"]
