# --- Build client ---
FROM node:20-alpine AS web
WORKDIR /app
COPY client ./client
RUN cd client && npm ci && npm run build

# --- Build server ---
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY src ./src
COPY --from=web /app/client/dist ./client/dist
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/index.js"]
