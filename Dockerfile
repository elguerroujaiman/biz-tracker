# ── Frontend Multi-Stage Dockerfile ─────────────────────────────────
# Stage 1: Build the React Application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set API URL for Docker reverse proxy
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Serve production build with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
