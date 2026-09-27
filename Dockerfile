# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json yarn.lock ./

# Install dependencies with lockfile and network timeout resilience
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy source code and build production assets
COPY . .
RUN yarn build

# Production stage with Nginx
FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Cấu hình nginx dưới dạng TEMPLATE. Entrypoint của image nginx sẽ envsubst
# /etc/nginx/templates/*.template -> /etc/nginx/conf.d/*.conf lúc container start,
# nhờ đó ${BACKEND_UPSTREAM} có thể đổi mà không cần build lại image.
COPY templates /etc/nginx/templates

# Giá trị mặc định khi chạy `docker run` mà không truyền env.
# Docker Compose (docker-compose.yml) sẽ override bằng biến môi trường.
ENV BACKEND_UPSTREAM=http://host.docker.internal:8000

# Copy production build from builder stage
COPY --from=builder /app/dist ./

EXPOSE 80

# Healthcheck to verify Nginx is serving traffic
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
