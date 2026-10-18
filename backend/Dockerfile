FROM node:22-slim AS dependencies

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    PORT=5000 \
    DB_PATH=/app/db/database.sqlite

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p /app/db && chown -R node:node /app/db

USER node
EXPOSE 5000
CMD ["node", "server.js"]
