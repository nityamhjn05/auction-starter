# backend/Dockerfile
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Expose port
EXPOSE 8080

# Run backend
CMD ["npm", "start"]
